// ============================================================
// MASTER DATA SERVICE
// Membuat konfigurasi Admin Panel (threshold & rekomendasi)
// BENAR-BENAR dipakai oleh perhitungan hasil assessment.
// Semua fungsi punya fallback aman jika Firebase gagal/offline.
// ============================================================

import { ref, get } from 'firebase/database';
import { db } from './firebase';
import { AssessmentResult, RecommendationItem, RiskLevel } from './types';
import { RECOM_TEMPLATES } from './data';

export interface ThresholdConfig {
  low_max: number; // skor <= low_max  => Rendah
  medium_max: number; // skor <= medium_max => Sedang, sisanya Tinggi
}

const DEFAULT_THRESHOLDS: ThresholdConfig = { low_max: 0.39, medium_max: 0.69 };

// Cache sederhana supaya tidak fetch berulang setiap assessment
let cachedThresholds: ThresholdConfig | null = null;
let cachedRecommendations: RecommendationItem[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000; // refresh tiap 1 menit

function cacheValid(): boolean {
  return Date.now() - cacheTime < CACHE_TTL_MS;
}

export function invalidateMasterDataCache(): void {
  cachedThresholds = null;
  cachedRecommendations = null;
  cacheTime = 0;
}

// ── Ambil threshold dari Admin Panel (masterData/thresholds) ──
export async function getThresholds(): Promise<ThresholdConfig> {
  if (cachedThresholds && cacheValid()) return cachedThresholds;
  try {
    const snap = await get(ref(db, 'masterData/thresholds'));
    if (snap.exists()) {
      const v = snap.val() as Partial<ThresholdConfig>;
      const low = typeof v.low_max === 'number' ? v.low_max : DEFAULT_THRESHOLDS.low_max;
      const med = typeof v.medium_max === 'number' ? v.medium_max : DEFAULT_THRESHOLDS.medium_max;
      // Validasi: harus 0 < low < med < 1, jika tidak pakai default
      if (low > 0 && med > low && med < 1) {
        cachedThresholds = { low_max: low, medium_max: med };
        cacheTime = Date.now();
        return cachedThresholds;
      }
    }
  } catch {
    // permission denied / offline → pakai default, jangan ganggu user
  }
  cachedThresholds = DEFAULT_THRESHOLDS;
  cacheTime = Date.now();
  return cachedThresholds;
}

// ── Ambil template rekomendasi dari Admin Panel ──
export async function getAdminRecommendations(): Promise<RecommendationItem[]> {
  if (cachedRecommendations && cacheValid()) return cachedRecommendations;
  try {
    const snap = await get(ref(db, 'masterData/recommendations'));
    if (snap.exists()) {
      const data = snap.val() as Record<string, Omit<RecommendationItem, 'completed'>>;
      const list = Object.values(data)
        .filter((r) => r && r.title)
        .map((r) => ({ ...r, completed: false }));
      if (list.length > 0) {
        cachedRecommendations = list;
        cacheTime = Date.now();
        return cachedRecommendations;
      }
    }
  } catch {
    // fallback di bawah
  }
  cachedRecommendations = RECOM_TEMPLATES.map((r) => ({ ...r, completed: false }));
  cacheTime = Date.now();
  return cachedRecommendations;
}

// ── Tentukan level risiko berdasarkan threshold admin ──
export function riskLevelFromScore(score: number, t: ThresholdConfig): RiskLevel {
  if (score <= t.low_max) return 'Rendah';
  if (score <= t.medium_max) return 'Sedang';
  return 'Tinggi';
}

// ── Finalisasi hasil: terapkan threshold + rekomendasi dari Admin Panel ──
// Dipanggil di App setelah prediksi (API maupun kalkulasi lokal),
// sehingga apapun yang admin ubah langsung berpengaruh ke hasil.
export async function finalizeResult(result: AssessmentResult): Promise<AssessmentResult> {
  const [thresholds, adminRecs] = await Promise.all([
    getThresholds(),
    getAdminRecommendations(),
  ]);

  const riskLevel = riskLevelFromScore(result.score, thresholds);

  // Prioritaskan rekomendasi yang kategorinya cocok dengan level risiko,
  // lalu tambahkan sisanya sampai maksimal 5 item.
  const matching = adminRecs.filter((r) => r.category === riskLevel);
  const others = adminRecs.filter((r) => r.category !== riskLevel);
  const recommendations = [...matching, ...others]
    .slice(0, 5)
    .map((r) => ({ ...r, completed: false }));

  return {
    ...result,
    riskLevel,
    recommendations: recommendations.length > 0 ? recommendations : result.recommendations,
  };
}

// ── Cek apakah user adalah admin (node /admins/{uid} = true) ──
export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const snap = await get(ref(db, `admins/${uid}`));
    return snap.exists() && snap.val() === true;
  } catch {
    return false;
  }
}
