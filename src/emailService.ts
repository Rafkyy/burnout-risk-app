import { AssessmentResult, User } from './types';

const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

function buildSummary(result: AssessmentResult): string {
  const { score, riskLevel } = result;
  if (riskLevel === 'Tinggi') {
    return `Skor burnout Anda (${score.toFixed(2)}) berada pada level TINGGI. Disarankan segera mendiskusikan kondisi ini dengan atasan atau tim HR.`;
  }
  if (riskLevel === 'Sedang') {
    return `Skor burnout Anda (${score.toFixed(2)}) berada pada level SEDANG. Atur jeda istirahat teratur dan evaluasi beban kerja Anda.`;
  }
  return `Skor burnout Anda (${score.toFixed(2)}) berada pada level RENDAH. Kondisi kerja Anda saat ini relatif seimbang, pertahankan kebiasaan baik ini.`;
}

interface EmailJSPayload {
  service_id: string;
  template_id: string;
  user_id: string;
  template_params: Record<string, string>;
}

export async function sendAssessmentEmail(user: User, result: AssessmentResult): Promise<void> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('⚠️ EmailJS belum dikonfigurasi (.env kosong) — notifikasi email dilewati.');
    return;
  }
  if (!user.email) {
    console.warn('⚠️ User tidak punya email, notifikasi dilewati.');
    return;
  }

  const payload: EmailJSPayload = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      to_email: user.email,
      to_name: user.name || 'Pengguna',
      assessment_date: result.date,
      burnout_score: result.score.toFixed(2),
      risk_level: result.riskLevel,
      summary: buildSummary(result),
      top_recommendation: result.recommendations[0]?.title || 'Jaga keseimbangan kerja dan istirahat Anda.',
    },
  };

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`EmailJS gagal kirim (${response.status}): ${errText}`);
  }
  console.log('✅ Email notifikasi assessment terkirim ke', user.email);
}