import React from 'react';
import { ChevronLeft, Bell, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AssessmentResult, ScreenName } from '../types';

interface ResultScreenProps {
  onBack: () => void;
  result: AssessmentResult | null;
  onNavigate: (screen: ScreenName) => void;
}

export default function ResultScreen({ onBack, result, onNavigate }: ResultScreenProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-slate-400" />
        <h3 className="text-lg font-bold text-slate-800">Tidak ada hasil ditemukan</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          Silakan lakukan asesmen baru terlebih dahulu untuk melihat hasil prediksi risiko Anda.
        </p>
        <button
          onClick={() => onNavigate('assessment')}
          className="bg-blue-600 text-white font-medium px-4 py-2 rounded-xl text-xs"
        >
          Mulai Asesmen
        </button>
      </div>
    );
  }

  const { score, riskLevel, input } = result;

  // Let's generate tailored Indonesian description based on dynamic score
  const getDescription = () => {
    if (riskLevel === 'Tinggi') {
      return `Skor Anda (${score.toFixed(2)}) menunjukkan Anda berisiko mengalami kelelahan kerja yang tinggi; ini mengindikasikan tingkat stres yang signifikan saat ini. Kami sangat menyarankan Anda mendiskusikan kondisi ini dengan atasan atau tim HR segera.`;
    } else if (riskLevel === 'Sedang') {
      return `Skor Anda (${score.toFixed(2)}) menunjukkan tingkat risiko burnout sedang. Anda mungkin merasakan beban kerja berlebih sesekali. Mengatur jeda istirahat teratur dan mengevaluasi beban kerja akan sangat membantu meredakan stres.`;
    } else {
      return `Skor Anda (${score.toFixed(2)}) menunjukkan tingkat risiko burnout rendah. Kondisi kerja dan beban mental Anda saat ini relatif seimbang. Pertahankan kebiasaan sehat ini untuk menjaga performa optimal Anda!`;
    }
  };

  const badgeColor =
    riskLevel === 'Tinggi'
      ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
      : riskLevel === 'Sedang'
      ? 'bg-elegant-gold/10 text-elegant-gold border-elegant-gold/25'
      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header matching screenshot perfectly */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Kembali ke Dashboard"
          className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition flex items-center text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Kembali</span>
        </button>
        <span className="font-serif-elegant font-bold text-white text-base">Hasil Analisis</span>
        <div className="relative">
          <Bell className="w-4 h-4 text-elegant-gold" />
          <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6 my-auto">
          {/* Main Results card themed as mockup with rounded shadows and dynamic content */}
          <div className="bg-elegant-panel rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col items-center text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              {/* Big bold text score */}
              <span className="text-5xl font-extrabold text-white tracking-tight font-serif-elegant">
                {score.toFixed(2)}
              </span>
              {/* Badge badge color */}
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${badgeColor}`}>
                {riskLevel}
              </span>
            </div>

            {/* Dynamic Description matching the exact text screenshot font sizing */}
            <p className="text-xs text-slate-300 leading-relaxed font-normal px-2">
              {getDescription()}
            </p>

            <div className="w-full h-px bg-white/5 my-2"></div>

            {/* Assessment Summary Indicators */}
            <div className="w-full text-left bg-elegant-card rounded-xl p-3 border border-white/5 space-y-1.5">
              <span className="text-[9px] font-extrabold text-elegant-gold tracking-wider block uppercase">
                Metrik Masukan Anda:
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                <div>• Setup WFH: <b className="text-white font-bold">{input.wfhSetup ? 'Tersedia' : 'Tidak Ada'}</b></div>
                <div>• Perusahaan: <b className="text-white font-bold">{input.tipePerusahaan}</b></div>
                <div>• Beban Mental: <b className="text-white font-bold">{input.skorKelebihanMental}/4</b></div>
                <div>• Alokasi Daya: <b className="text-white font-bold">{input.alokasiSumberDaya}/4</b></div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons flow as shown in the screenshot */}
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('shap')}
            id="btn-view-shap"
            className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-98 shadow-md transition text-xs uppercase tracking-widest cursor-pointer block"
          >
            Lihat Analitik SHAP
          </button>
          <button
            onClick={() => onNavigate('recommendations')}
            id="btn-view-recommendations"
            className="w-full bg-elegant-panel hover:bg-white/5 text-slate-300 font-extrabold py-3 rounded-xl transition text-xs uppercase tracking-widest border border-white/5 cursor-pointer block"
          >
            Lihat Rekomendasi
          </button>
        </div>
      </div>
    </div>
  );
}
