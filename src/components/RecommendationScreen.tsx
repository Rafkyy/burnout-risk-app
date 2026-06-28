import React, { useState } from 'react';
import { ChevronLeft, User as UserIcon, CheckSquare, Square, Clock, CircleAlert, CheckCircle2, PhoneCall, HelpCircle, Briefcase, Coffee, MessageSquare, Laptop, Smile } from 'lucide-react';
import { AssessmentResult } from '../types';

interface RecommendationScreenProps {
  onBack: () => void;
  result: AssessmentResult | null;
  onSaveResult: (updatedResult: AssessmentResult) => void;
}

export default function RecommendationScreen({ onBack, result, onSaveResult }: RecommendationScreenProps) {
  // Use a fallback default result if none is generated
  const activeResult = result;
  
  const [recommendations, setRecommendations] = useState(
    activeResult?.recommendations || [
      { id: 'rec_1', title: 'Kurangi beban kerja', desc: 'Prioritaskan tugas utama dan delegasikan jika memungkinkan.', completed: true, category: 'Tinggi' },
      { id: 'rec_2', title: 'Atur jadwal istirahat', desc: 'Ambil jeda singkat setiap beberapa jam kerja.', completed: true, category: 'Sedang' },
      { id: 'rec_3', title: 'Diskusi dengan HR/Manager', desc: 'Bicarakan tantangan dan cari solusi bersama.', completed: false, category: 'Tinggi' },
      { id: 'rec_4', title: 'Evaluasi WFH setup', desc: 'Pastikan ruang kerja nyaman dan bebas gangguan.', completed: false, category: 'Rendah' },
      { id: 'rec_5', title: 'Lakukan hobi di luar kerja', desc: 'Luangkan waktu untuk kegiatan yang menyenangkan.', completed: false, category: 'Sedang' },
    ]
  );

  const [saving, setSaving] = useState(false);

  // Toggle checklist completed states
  const handleToggle = (id: string) => {
    setRecommendations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleSave = () => {
    if (!activeResult) {
      alert('Simulasi: Rekomendasi diupdate!');
      onBack();
      return;
    }

    setSaving(true);
    const updated: AssessmentResult = {
      ...activeResult,
      recommendations: recommendations,
    };

    setTimeout(() => {
      onSaveResult(updated);
      setSaving(false);
    }, 850);
  };

  const getIconForTitle = (title: string) => {
    const lowTitle = title.toLowerCase();
    if (lowTitle.includes('kerja') || lowTitle.includes('beban')) return Briefcase;
    if (lowTitle.includes('istirahat') || lowTitle.includes('jadwal')) return Coffee;
    if (lowTitle.includes('hr') || lowTitle.includes('diskusi') || lowTitle.includes('manager')) return MessageSquare;
    if (lowTitle.includes('wfh') || lowTitle.includes('setup')) return Laptop;
    return Smile;
  };

  const riskLabel = activeResult ? activeResult.riskLevel : 'Sedang';

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header bar matching layout */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Kembali"
          className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition flex items-center text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          <span>Kembali</span>
        </button>
        <span className="font-serif-elegant font-bold text-white text-base">Rekomendasi</span>
        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300">
          <UserIcon className="w-4 h-4" />
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          {/* Main Risk Status card indicating risk levels */}
          <div className="bg-elegant-panel rounded-2xl p-4 border border-white/5 shadow-md space-y-2.5">
            <h3 className="font-bold text-white text-sm font-serif-elegant uppercase tracking-wider" id="recom-risk-status-title">
              Evaluasi Risiko: {riskLabel}
            </h3>
            {/* Visual small chart bars representing the risk levels */}
            <div className="flex items-end gap-1.5 h-9 bg-elegant-bg p-2 rounded-xl border border-white/5 max-w-[200px]">
              <div className={`w-8 rounded-sm ${riskLabel === 'Rendah' ? 'h-[40%] bg-emerald-500' : 'h-[25%] bg-white/5'}`}></div>
              <div className={`w-8 rounded-sm ${riskLabel === 'Sedang' ? 'h-[70%] bg-elegant-gold' : 'h-[25%] bg-white/5'}`}></div>
              <div className={`w-8 rounded-sm ${riskLabel === 'Tinggi' ? 'h-[100%] bg-rose-500' : 'h-[25%] bg-white/5'}`}></div>
            </div>
          </div>

          {/* Action List items matching mockup exact details */}
          <div className="space-y-3">
            {recommendations.map((item) => {
              const IconComp = getIconForTitle(item.title);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className={`bg-elegant-panel/70 hover:bg-elegant-panel rounded-2xl p-4 border transition duration-150 shadow-sm cursor-pointer flex items-start gap-3.5 ${
                    item.completed ? 'border-elegant-gold/20 bg-elegant-panel' : 'border-white/5'
                  }`}
                >
                  {/* Custom Checkbox on the left */}
                  <div className="mt-0.5 shrink-0">
                    {item.completed ? (
                      <div className="bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black rounded p-0.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-black" />
                      </div>
                    ) : (
                      <div className="border border-slate-700 hover:border-elegant-gold rounded w-5 h-5 transition-colors"></div>
                    )}
                  </div>

                  {/* Icon representations (circular background colored) */}
                  <div className="p-2 bg-elegant-gold/10 text-elegant-gold rounded-xl shrink-0 mt-0.5 border border-elegant-gold/10">
                    <IconComp className="w-4 h-4" />
                  </div>

                  {/* Text descriptions */}
                  <div className="space-y-0.5 flex-1 pr-1">
                    <h4
                      className={`font-bold text-xs text-white transition ${
                        item.completed ? 'line-through text-slate-500 font-semibold' : ''
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p
                      className={`text-[11px] text-slate-400 leading-normal ${
                        item.completed ? 'text-slate-600 font-normal' : ''
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simpan Hasil button */}
        <button
          onClick={handleSave}
          disabled={saving}
          id="btn-save-recommendations-results"
          className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-98 shadow-md transition text-xs uppercase tracking-widest cursor-pointer block mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Melakukan Sinkronisasi...' : 'Simpan Rekomendasi'}
        </button>
      </div>
    </div>
  );
}
