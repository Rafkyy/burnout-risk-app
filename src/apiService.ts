// ============================================================
// API SERVICE - Menghubungkan ke Backend FastAPI
// Ganti URL_BACKEND dengan URL dari Railway/Render kamu
// ============================================================

import { AssessmentInput, AssessmentResult, RecommendationItem, ShapFactor, RiskLevel } from './types';
import { RECOM_TEMPLATES, calculateAssessmentResult } from './data';

// ⚠️ GANTI dengan URL backend kamu setelah deploy ke Railway
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://burnout-api.up.railway.app';

// ============================================================
// Mapping input bahasa Indonesia → format API (bahasa Inggris)
// ============================================================
function mapInputToAPI(input: AssessmentInput) {
  // Gender mapping
  const genderMap: Record<string, string> = {
    'Laki-laki': 'Male',
    'Perempuan': 'Female',
  };

  // Company type mapping
  const companyMap: Record<string, string> = {
    'Teknologi': 'Product',
    'Keuangan': 'Service',
    'Kesehatan': 'Service',
    'Manufaktur': 'Service',
    'Pendidikan': 'Service',
    'Lainnya': 'Service',
  };

  // Level jabatan: 1-3 → 0-5 (scale ke designation model)
  const designationMap: Record<number, number> = {
    1: 1.0,
    2: 2.5,
    3: 4.0,
  };

  // Alokasi sumber daya: 1-4 → 1-10
  const resourceMap: Record<number, number> = {
    1: 2.0,
    2: 4.0,
    3: 7.0,
    4: 9.0,
  };

  // Skor kelebihan mental: 1-4 → 0-10
  const mentalMap: Record<number, number> = {
    1: 2.0,
    2: 4.5,
    3: 7.0,
    4: 9.5,
  };

  return {
    gender: genderMap[input.jenisKelamin] || 'Male',
    company_type: companyMap[input.tipePerusahaan] || 'Service',
    wfh_setup_available: input.wfhSetup ? 'Yes' : 'No',
    designation: designationMap[input.levelJabatan] || 2.0,
    resource_allocation: resourceMap[input.alokasiSumberDaya] || 5.0,
    mental_fatigue_score: mentalMap[input.skorKelebihanMental] || 5.0,
  };
}

// ============================================================
// Mapping response API → format AssessmentResult app
// ============================================================
function mapAPIResponseToResult(
  apiResponse: APIResponse,
  input: AssessmentInput,
  id: string
): AssessmentResult {
  // Map risk level API ke bahasa Indonesia
  const riskLevelMap: Record<string, RiskLevel> = {
    'Low': 'Rendah',
    'Medium': 'Sedang',
    'High': 'Tinggi',
  };

  // Map feature name API → nama tampilan bahasa Indonesia
  const featureDisplayMap: Record<string, string> = {
    'Mental Fatigue Score': 'Skor Kelebihan Mental',
    'Resource Allocation': 'Alokasi Sumber Daya',
    'WFH Setup Available': 'WFH Setup',
    'Designation': 'Level Jabatan',
    'Gender': 'Jenis Kelamin',
    'Company Type': 'Tipe Perusahaan',
  };

  // Konversi top_factors → ShapFactor[]
  const shapFactors: ShapFactor[] = apiResponse.top_factors
    .slice(0, 3)
    .map((f) => ({
      factor: featureDisplayMap[f.feature] || f.feature,
      percentage: f.contribution_pct,
    }));

  // Konversi recommendations dari API → RecommendationItem[]
  const recommendations: RecommendationItem[] = apiResponse.recommendations.map((rec, idx) => ({
    id: rec.id || `rec_api_${idx}`,
    title: rec.title,
    desc: rec.desc,
    category: rec.category || 'Sedang',
    completed: false,
  }));

  // Fallback ke RECOM_TEMPLATES jika API tidak return recommendations
  const finalRecommendations = recommendations.length > 0
    ? recommendations
    : RECOM_TEMPLATES.map((r) => ({ ...r, completed: false }));

  // Format tanggal
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  return {
    id,
    date: formattedDate,
    score: apiResponse.burn_rate,
    riskLevel: riskLevelMap[apiResponse.risk_level] || 'Sedang',
    input,
    shapFactors,
    recommendations: finalRecommendations,
  };
}

// ============================================================
// Type untuk response API
// ============================================================
interface APITopFactor {
  feature: string;
  feature_id: string;
  shap_value: number;
  contribution_pct: number;
  direction: string;
}

interface APIRecommendation {
  id: string;
  title: string;
  desc: string;
  category: string;
}

interface APIResponse {
  burn_rate: number;
  risk_level: string;
  risk_level_id: number;
  risk_level_id_desc: string;
  shap_values: Record<string, number>;
  top_factors: APITopFactor[];
  recommendations: APIRecommendation[];
  input_summary: Record<string, unknown>;
  model_version: string;
}

// ============================================================
// FUNGSI UTAMA — Panggil API dan kembalikan AssessmentResult
// ============================================================
export async function predictBurnout(
  input: AssessmentInput,
  id = `hist_${Date.now()}`
): Promise<AssessmentResult> {
  const apiInput = mapInputToAPI(input);

  try {
    const response = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiInput),
      // Timeout 15 detik: cukup untuk cold-start Railway, tapi tidak
      // membiarkan layar loading menggantung tanpa batas di koneksi mobile.
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${errorData.detail || 'Unknown error'}`);
    }

    const data: APIResponse = await response.json();
    console.log('✅ API Response:', data);

    return mapAPIResponseToResult(data, input, id);

  } catch (error) {
    console.error('❌ Gagal memanggil API backend:', error);
    // Fallback ke kalkulasi lokal jika API tidak tersedia
    console.warn('⚠️ Menggunakan kalkulasi lokal sebagai fallback...');
    return calculateAssessmentResult(input, id);
  }
}

// ============================================================
// Cek apakah backend aktif
// ============================================================
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // timeout 5 detik
    });
    const data = await response.json();
    return data.status === 'ok' && data.model_loaded === true;
  } catch {
    return false;
  }
}
