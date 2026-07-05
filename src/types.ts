export type RiskLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export interface User {
  uid?: string;
  name: string;
  email: string;
  avatarUrl: string;
  lastLogin?: string;
}

export interface AssessmentInput {
  jenisKelamin: string; // 'Laki-laki' | 'Perempuan'
  tipePerusahaan: string; // 'Teknologi' | 'Keuangan' | 'Kesehatan' | 'Manufaktur' | 'Pendidikan' | 'Lainnya'
  wfhSetup: boolean; // true = Tersedia, false = Tidak Tersedia
  levelJabatan: number; // 1 = Rendah, 2 = Sedang, 3 = Tinggi
  alokasiSumberDaya: number; // 1 = Buruk, 2 = Cukup, 3 = Baik, 4 = Sangat Baik
  skorKelebihanMental: number; // 1 = Rendah, 2 = Sedang, 3 = Tinggi, 4 = Sangat Tinggi
}

export interface ShapFactor {
  factor: string;
  percentage: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  desc: string;
  completed: boolean;
  category: string;
}

export interface AssessmentResult {
  id: string;
  date: string;
  score: number; // between 0.00 and 1.00
  riskLevel: RiskLevel;
  input: AssessmentInput;
  shapFactors: ShapFactor[];
  recommendations: RecommendationItem[];
}

export interface StoredAssessment {
  assessmentId: string;
  uid: string;
  email: string;
  date: string;
  score: number;
  riskLevel: RiskLevel;
  input: AssessmentInput;
  shapAnalysis: ShapFactor[];
  recommendations: RecommendationItem[];
  createdAt: string;
}

export type ScreenName =
  | 'login'
  | 'dashboard'
  | 'assessment'
  | 'loading'
  | 'result'
  | 'shap'
  | 'recommendations'
  | 'history'
  | 'profile'
  | 'journey'
  | 'admin';
