import React from 'react';
import { ChevronLeft, Info, HelpCircle } from 'lucide-react';
import { AssessmentResult, ScreenName } from '../types';

interface ShapScreenProps {
  onBack: () => void;
  result: AssessmentResult | null;
  onNavigate: (screen: ScreenName) => void;
}

export default function ShapScreen({ onBack, result, onNavigate }: ShapScreenProps) {
  // Use default fallback if there's no result
  const factors = result?.shapFactors || [
    { factor: 'Skor Kelebihan Mental', percentage: 35 },
    { factor: 'Alokasi Sumber Daya', percentage: 25 },
    { factor: 'WFH Setup', percentage: 18 },
  ];

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header matching screenshot perfectly */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition flex items-center text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Kembali</span>
        </button>
        <span className="font-serif-elegant font-bold text-white text-base">Penjelasan SHAP</span>
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-elegant-gold">
          <Info className="w-4 h-4" />
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-serif-elegant flex items-center gap-1.5" id="shap-dominant-heading">
              <span>Faktor Dominan</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Beban utama kontribusi risiko burnout Anda</p>
          </div>

          {/* Bar Chart list modeled with 100% precision relative to screenshot */}
          <div className="space-y-5">
            {factors.map((item, index) => (
              <div key={item.factor} className="space-y-2">
                <div className="flex justify-between items-baseline text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-elegant-gold shadow-md"></span>
                    {item.factor}
                  </span>
                  <span className="font-mono font-extrabold text-elegant-gold">{item.percentage}%</span>
                </div>
                {/* Custom animated progress slide container */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-elegant-gold to-elegant-gold-dark h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      transitionDelay: `${index * 150}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-elegant-panel/50 border border-white/5 rounded-xl p-4 mt-6">
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
              Representasi grafis ini menunjukkan pengaruh kontribusi metrik masukan Anda terhadap skor burnout akhir. Semakin tebal garis persentase gold, semakin besar dampak kontribusi yang dirasakan sistem.
            </p>
          </div>

          {/* Deep Explanation boxes */}
          <div className="space-y-2.5">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
              Interpretasi Analisis Algoritma:
            </span>
            <div className="border-l-2 border-elegant-gold pl-3 py-1.5">
              <h4 className="text-xs font-bold text-white font-serif-elegant">Skor Kelebihan Mental</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Menjadi kontributor terbesar disebabkan tuntutan kognitif konstan dan minimnya jeda istirahat harian Anda.
              </p>
            </div>
            <div className="border-l-2 border-slate-500 pl-3 py-1.5">
              <h4 className="text-xs font-bold text-white font-serif-elegant">Alokasi Sumber Daya</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Terbatasnya ketersediaan peralatan penunjang di tempat kerja membatasi fleksibilitas Anda saat menyelesaikan tugas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button at the bottom */}
        <button
          onClick={() => onNavigate('recommendations')}
          id="btn-navigate-to-recommendations"
          className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-98 shadow-md transition text-xs uppercase tracking-widest cursor-pointer block mt-6"
        >
          Lanjut ke Rekomendasi
        </button>
      </div>
    </div>
  );
}
