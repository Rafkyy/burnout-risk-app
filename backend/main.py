from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
import joblib
import shap
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model         = joblib.load(os.path.join(BASE_DIR, "burnout_model.joblib"))
    scaler        = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))
    le_dict       = joblib.load(os.path.join(BASE_DIR, "label_encoders.joblib"))
    feature_names = joblib.load(os.path.join(BASE_DIR, "feature_names.joblib"))
    explainer     = shap.TreeExplainer(model)
    print("✅ Model dan preprocessor berhasil dimuat.")
    print(f"   Fitur: {feature_names}")
except Exception as e:
    print(f"❌ Gagal memuat model: {e}")
    model = scaler = le_dict = feature_names = explainer = None

# ============================================================
# INISIALISASI FASTAPI
# ============================================================
app = FastAPI(
    title="Burnout Risk Prediction API",
    description="""
    API prediksi risiko burnout karyawan menggunakan Random Forest + SHAP.
    
    **Fitur Input:**
    - gender: 'Female' atau 'Male'
    - company_type: 'Product' atau 'Service'  
    - wfh_setup_available: 'No' atau 'Yes'
    - designation: 0.0 - 5.0
    - resource_allocation: 1.0 - 10.0
    - mental_fatigue_score: 0.0 - 10.0
    
    **Output:**
    - burn_rate: skor 0.0 - 1.0
    - risk_level: Low / Medium / High
    - shap_values: kontribusi tiap fitur
    - recommendations: saran tindak lanjut
    """,
    version="1.0.0"
)

# CORS — izinkan akses dari web app / mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# SCHEMA INPUT — sesuai 6 fitur model
# ============================================================
class AssessmentInput(BaseModel):
    gender: str = Field(
        ...,
        example="Female",
        description="'Female' atau 'Male'"
    )
    company_type: str = Field(
        ...,
        example="Service",
        description="'Product' atau 'Service'"
    )
    wfh_setup_available: str = Field(
        ...,
        example="Yes",
        description="'No' atau 'Yes'"
    )
    designation: float = Field(
        ...,
        example=2.0,
        ge=0.0,
        le=5.0,
        description="Level jabatan 0.0 - 5.0"
    )
    resource_allocation: float = Field(
        ...,
        example=3.0,
        ge=1.0,
        le=10.0,
        description="Alokasi sumber daya 1.0 - 10.0"
    )
    mental_fatigue_score: float = Field(
        ...,
        example=5.5,
        ge=0.0,
        le=10.0,
        description="Skor kelelahan mental 0.0 - 10.0"
    )

# ============================================================
# SCHEMA OUTPUT
# ============================================================
class PredictionOutput(BaseModel):
    burn_rate: float
    risk_level: str
    risk_level_id: int
    risk_level_id_desc: str
    shap_values: dict
    top_factors: list
    recommendations: list
    input_summary: dict
    model_version: str

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def map_risk_level(burn_rate: float):
    """
    0.00 - 0.39 → Low    (id=0)
    0.40 - 0.69 → Medium (id=1)
    0.70 - 1.00 → High   (id=2)
    """
    if burn_rate < 0.40:
        return "Low", 0, "Rendah"
    elif burn_rate < 0.70:
        return "Medium", 1, "Sedang"
    else:
        return "High", 2, "Tinggi"

def get_recommendations(risk_level: str, top_feature: str) -> list:
    base = {
        "Low": [
            {"id": "rec_l1", "title": "Pertahankan keseimbangan kerja", "desc": "Kondisi Anda saat ini baik. Pertahankan rutinitas yang sudah berjalan.", "category": "Rendah"},
            {"id": "rec_l2", "title": "Lakukan check-in rutin", "desc": "Komunikasikan progress dengan tim untuk menjaga motivasi.", "category": "Rendah"},
            {"id": "rec_l3", "title": "Kembangkan diri", "desc": "Manfaatkan waktu luang untuk pelatihan atau skill baru.", "category": "Rendah"},
        ],
        "Medium": [
            {"id": "rec_m1", "title": "Kurangi beban kerja", "desc": "Prioritaskan tugas utama dan delegasikan jika memungkinkan.", "category": "Sedang"},
            {"id": "rec_m2", "title": "Atur jadwal istirahat", "desc": "Ambil jeda singkat setiap beberapa jam kerja.", "category": "Sedang"},
            {"id": "rec_m3", "title": "Diskusi dengan HR/Manager", "desc": "Bicarakan tantangan dan cari solusi bersama.", "category": "Sedang"},
            {"id": "rec_m4", "title": "Evaluasi WFH setup", "desc": "Pastikan ruang kerja nyaman dan bebas gangguan.", "category": "Sedang"},
            {"id": "rec_m5", "title": "Lakukan hobi di luar kerja", "desc": "Luangkan waktu untuk kegiatan yang menyenangkan.", "category": "Sedang"},
        ],
        "High": [
            {"id": "rec_h1", "title": "Hubungi HR segera", "desc": "Segera laporkan kondisi Anda ke HR untuk intervensi prioritas.", "category": "Tinggi"},
            {"id": "rec_h2", "title": "Pertimbangkan cuti pemulihan", "desc": "Cuti singkat dapat membantu memulihkan energi mental.", "category": "Tinggi"},
            {"id": "rec_h3", "title": "Konsultasi profesional", "desc": "Pertimbangkan konsultasi dengan psikolog atau konselor kerja.", "category": "Tinggi"},
            {"id": "rec_h4", "title": "Kurangi beban kerja signifikan", "desc": "Kurangi target pekerjaan dalam waktu dekat bersama atasan.", "category": "Tinggi"},
            {"id": "rec_h5", "title": "Jaga kebutuhan dasar", "desc": "Pastikan tidur, makan, dan olahraga cukup setiap hari.", "category": "Tinggi"},
        ]
    }

    # Rekomendasi tambahan berdasarkan faktor dominan SHAP
    factor_extra = {
        "Mental Fatigue Score": {"id": "rec_f1", "title": "Kurangi beban kognitif", "desc": "Prioritaskan istirahat dan kurangi multitasking.", "category": "Faktor Dominan"},
        "Resource Allocation":  {"id": "rec_f2", "title": "Evaluasi alat kerja", "desc": "Pastikan alat dan sumber daya pendukung tersedia memadai.", "category": "Faktor Dominan"},
        "WFH Setup Available":  {"id": "rec_f3", "title": "Optimalkan setup WFH", "desc": "Setup ergonomis dan koneksi stabil sangat mempengaruhi produktivitas.", "category": "Faktor Dominan"},
        "Designation":          {"id": "rec_f4", "title": "Diskusi ekspektasi jabatan", "desc": "Klarifikasi peran dan tanggung jawab dengan atasan.", "category": "Faktor Dominan"},
    }

    recs = base.get(risk_level, [])
    extra = factor_extra.get(top_feature)
    if extra:
        recs = [extra] + recs

    return recs

def preprocess_input(data: AssessmentInput):
    """Preprocessing input sesuai pipeline training."""

    # Mapping nilai input ke format yang dikenali label encoder
    # Label encoder classes: Gender=['Female','Male'], CompanyType=['Product','Service'], WFH=['No','Yes']
    gender_val   = data.gender.strip().capitalize()
    company_val  = data.company_type.strip().capitalize()
    wfh_val      = data.wfh_setup_available.strip().capitalize()

    # Validasi nilai kategorikal
    valid = {
        "Gender":               ["Female", "Male"],
        "Company Type":         ["Product", "Service"],
        "WFH Setup Available":  ["No", "Yes"],
    }
    if gender_val not in valid["Gender"]:
        raise ValueError(f"Gender harus 'Female' atau 'Male', dapat: '{gender_val}'")
    if company_val not in valid["Company Type"]:
        raise ValueError(f"company_type harus 'Product' atau 'Service', dapat: '{company_val}'")
    if wfh_val not in valid["WFH Setup Available"]:
        raise ValueError(f"wfh_setup_available harus 'No' atau 'Yes', dapat: '{wfh_val}'")

    row = {
        "Gender":               gender_val,
        "Company Type":         company_val,
        "WFH Setup Available":  wfh_val,
        "Designation":          data.designation,
        "Resource Allocation":  data.resource_allocation,
        "Mental Fatigue Score": data.mental_fatigue_score,
    }

    df_input = pd.DataFrame([row])

    # Label encoding
    cat_cols = ["Gender", "Company Type", "WFH Setup Available"]
    for col in cat_cols:
        le = le_dict[col]
        df_input[col] = le.transform(df_input[col].astype(str))

    # Pastikan urutan kolom sama dengan training
    df_input = df_input[feature_names]

    # Scaling
    X_scaled = scaler.transform(df_input)
    X_scaled_df = pd.DataFrame(X_scaled, columns=feature_names)

    return X_scaled_df

# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Burnout Risk Prediction API - Active",
        "version": "1.0.0",
        "model": "RandomForestRegressor",
        "features": feature_names if feature_names else [],
        "performance": {
            "accuracy": "86.24%",
            "f1_score": "0.8603",
            "r2_test": "0.8521"
        },
        "endpoints": {
            "POST /predict": "Prediksi burnout + SHAP values",
            "GET  /health":  "Status API & model",
            "GET  /features": "Info fitur input",
            "GET  /docs":    "Swagger UI"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded":  model is not None,
        "scaler_loaded": scaler is not None,
        "shap_ready":    explainer is not None,
        "n_features":    len(feature_names) if feature_names else 0,
    }

@app.get("/features")
def get_features():
    return {
        "feature_names": feature_names,
        "categorical": {
            "gender":               ["Female", "Male"],
            "company_type":         ["Product", "Service"],
            "wfh_setup_available":  ["No", "Yes"],
        },
        "numerical": {
            "designation":          "float, range 0.0 - 5.0",
            "resource_allocation":  "float, range 1.0 - 10.0",
            "mental_fatigue_score": "float, range 0.0 - 10.0",
        },
        "risk_mapping": {
            "Low":    "Burn Rate 0.00 - 0.39",
            "Medium": "Burn Rate 0.40 - 0.69",
            "High":   "Burn Rate 0.70 - 1.00",
        }
    }

@app.post("/predict", response_model=PredictionOutput)
def predict(data: AssessmentInput):
    """
    Endpoint utama prediksi burnout.
    Menerima data asesmen karyawan, mengembalikan:
    - burn_rate, risk_level, shap_values, top_factors, recommendations
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model belum dimuat.")

    try:
        # 1. Preprocessing
        X_scaled = preprocess_input(data)

        # 2. Prediksi burn rate
        burn_rate = float(model.predict(X_scaled)[0])
        burn_rate = round(max(0.0, min(1.0, burn_rate)), 4)

        # 3. Risk mapping
        risk_level, risk_level_id, risk_level_id_desc = map_risk_level(burn_rate)

        # 4. SHAP values
        shap_vals = explainer.shap_values(X_scaled.values)[0]

        # Jika expected_value adalah array (RF), ambil mean
        base_val = explainer.expected_value
        if hasattr(base_val, '__len__'):
            base_val = float(np.mean(base_val))

        # Buat dict feature → shap value
        shap_dict = {
            fname: round(float(shap_vals[i]), 6)
            for i, fname in enumerate(feature_names)
        }

        # 5. Top factors — urutkan berdasarkan abs SHAP
        total_abs = sum(abs(v) for v in shap_dict.values())
        sorted_factors = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)

        top_factors = [
            {
                "feature":          fname,
                "feature_id":       fname.lower().replace(" ", "_"),
                "shap_value":       round(sval, 6),
                "contribution_pct": round(abs(sval) / total_abs * 100, 1) if total_abs > 0 else 0,
                "direction":        "increases_risk" if sval > 0 else "decreases_risk",
            }
            for fname, sval in sorted_factors
        ]

        # 6. Rekomendasi
        top_feature = sorted_factors[0][0] if sorted_factors else "Mental Fatigue Score"
        recommendations = get_recommendations(risk_level, top_feature)

        return PredictionOutput(
            burn_rate=burn_rate,
            risk_level=risk_level,
            risk_level_id=risk_level_id,
            risk_level_id_desc=risk_level_id_desc,
            shap_values=shap_dict,
            top_factors=top_factors,
            recommendations=recommendations,
            input_summary={
                "gender":               data.gender,
                "company_type":         data.company_type,
                "wfh_setup_available":  data.wfh_setup_available,
                "designation":          data.designation,
                "resource_allocation":  data.resource_allocation,
                "mental_fatigue_score": data.mental_fatigue_score,
            },
            model_version="random_forest_v1.0"
        )

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error prediksi: {str(e)}")
