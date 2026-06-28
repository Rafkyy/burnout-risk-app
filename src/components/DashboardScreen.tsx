import React from 'react';
import { Bell, Play, Award, HelpCircle, Activity, BarChart3, Search, ClipboardList, Clock } from 'lucide-react';
import { User, AssessmentResult, ScreenName } from '../types';

interface DashboardScreenProps {
  currentUser: User;
  latestResult: AssessmentResult | null;
  onNavigate: (screen: ScreenName) => void;
  onSelectHistoryItem: (item: AssessmentResult) => void;
}

export default function DashboardScreen({
  currentUser,
  latestResult,
  onNavigate,
  onSelectHistoryItem,
}: DashboardScreenProps) {
  // If there's no latest result, use a fallback empty state or default representation
  const score = latestResult ? latestResult.score : 0.58;
  const riskLevel = latestResult ? latestResult.riskLevel : 'Sedang';

  // Get current time greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return 'Selamat Pagi!';
    if (hours < 15) return 'Selamat Siang!';
    if (hours < 19) return 'Selamat Sore!';
    return 'Selamat Malam!';
  };

  // Convert score to angle for the gauge (0 is 180deg (left), 1.0 is 360deg/0deg (right))
  // In custom SVG, a clean representation of a gauge arc
  const radius = 60;
  const strokeWidth = 12;
  const pathLength = Math.PI * radius; // half circle perimeter
  const strokeDashoffset = pathLength - score * pathLength;

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto pb-4">
      {/* Dashboard Top Header */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-md">
        <h1 className="text-white font-serif-elegant font-bold text-center flex-1 text-base tracking-wide">
          Dashboard Analitika
        </h1>
        <div className="relative cursor-pointer hover:bg-white/5 p-1.5 rounded-full transition">
          <Bell className="w-4 h-4 text-elegant-gold" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-elegant-gold rounded-full border border-elegant-bg"></span>
        </div>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Welcome Section */}
        <div className="flex justify-between items-center bg-elegant-panel/30 p-3 rounded-2xl border border-white/5">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight font-serif-elegant flex items-center gap-1.5">
              <span>Halo, {currentUser.name}</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {getGreeting()} ({new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)
            </p>
          </div>
          <div
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 rounded-full ring-2 ring-elegant-gold/20 hover:ring-elegant-gold/50 overflow-hidden cursor-pointer shadow-sm active:scale-95 transition"
          >
            <img src={currentUser.avatarUrl} alt={currentUser.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Status Terakhir Card */}
        <div className="bg-gradient-to-br from-elegant-panel to-elegant-card rounded-2xl p-5 border border-white/5 text-slate-100 shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-elegant-gold/5 rounded-full blur-xl"></div>
          <p className="text-[10px] text-elegant-gold font-bold tracking-widest uppercase opacity-90">
            PROFIL RISIKO AKTIF
          </p>
          <div className="mt-1.5 flex justify-between items-baseline">
            <h3 className="text-2xl font-extrabold tracking-tight text-white">
              {riskLevel === 'Tinggi' ? 'Level Tinggi 🚨' : riskLevel === 'Sedang' ? 'Level Sedang ⚠️' : 'Level Rendah ✨'}
            </h3>
            <span className="text-[10px] bg-elegant-gold/10 border border-elegant-gold/20 px-2.5 py-0.5 rounded-full font-bold text-elegant-gold shadow-inner">
              Skor: {score.toFixed(2)}
            </span>
          </div>

          {/* Progress bar matching mockup screen (elegant gold scale) */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full bg-elegant-bg h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  riskLevel === 'Tinggi' ? 'bg-rose-500' : riskLevel === 'Sedang' ? 'bg-elegant-gold' : 'bg-emerald-500'
                }`}
                style={{ width: `${score * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
              <span>Rendah</span>
              <span>Sedang</span>
              <span>Tinggi</span>
            </div>
          </div>
        </div>

        {/* Burn Rate Gauge Counter Card */}
        <div className="bg-elegant-panel rounded-2xl p-5 border border-white/5 shadow-md flex flex-col items-center">
          <div className="relative w-44 h-28 flex justify-center mt-2">
            {/* Half circle representation arc */}
            <svg className="w-44 h-40 transform -rotate-180" viewBox="0 0 140 140">
              {/* Background Arc */}
              <path
                d="M 20,80 A 50,50 0 0,1 120,80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Value Arc of current score */}
              <path
                d="M 20,80 A 50,50 0 0,1 120,80"
                fill="none"
                stroke={riskLevel === 'Tinggi' ? '#ef4444' : riskLevel === 'Sedang' ? '#C9A050' : '#10b981'}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={pathLength}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Score label in center */}
            <div className="absolute top-10 flex flex-col items-center text-center">
              <span className="text-3xl font-extrabold text-white tracking-tight font-serif-elegant">
                {score.toFixed(2)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Indeks Overload
              </span>
            </div>

            {/* 0 and 1.0 ticks under the gauge */}
            <div className="absolute bottom-1.5 left-2 text-[9px] text-slate-500 font-mono font-bold">0.00</div>
            <div className="absolute bottom-1.5 right-2 text-[9px] text-slate-500 font-mono font-bold">1.00</div>

            {/* Dynamic gauge Percentage text (e.g. 85%) under mockup layout */}
            <div className="absolute top-1 right-2 bg-elegant-card border border-white/5 px-2 py-0.5 rounded text-[9px] text-elegant-gold-light font-mono font-bold shadow-sm">
              {Math.round(score * 100)}%
            </div>
          </div>

          {/* Mulai Asesmen Button (Premium gold gradient) */}
          <button
            onClick={() => onNavigate('assessment')}
            id="btn-start-assessment-home"
            className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3.5 rounded-xl hover:brightness-110 active:scale-98 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 mt-4 cursor-pointer text-xs uppercase tracking-widest text-[11px]"
          >
            <Play className="w-3.5 h-3.5 fill-current text-black" />
            <span>Mulai Asesmen Mandiri</span>
          </button>
        </div>

        {/* Menu Utama Container */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase px-1">
            Menu Diagnostik
          </h4>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              {
                id: 'menu-hasil',
                label: 'Hasil',
                icon: BarChart3,
                screen: 'result' as ScreenName,
                color: 'text-[#10b981] bg-[#10b981]/10 border-emerald-500/10',
              },
              {
                id: 'menu-shap',
                label: 'SHAP',
                icon: Search,
                screen: 'shap' as ScreenName,
                color: 'text-elegant-gold bg-elegant-gold/10 border-elegant-gold/10',
              },
              {
                id: 'menu-rekomendasi',
                label: 'Saran',
                icon: ClipboardList,
                screen: 'recommendations' as ScreenName,
                color: 'text-indigo-400 bg-indigo-5050/10 border-indigo-400/10',
              },
              {
                id: 'menu-riwayat',
                label: 'Riwayat',
                screen: 'history' as ScreenName,
                icon: Clock,
                color: 'text-slate-300 bg-white/5 border-white/5',
              },
            ].map((menuItem) => (
              <button
                key={menuItem.id}
                id={menuItem.id}
                onClick={() => {
                  if (latestResult) {
                     onNavigate(menuItem.screen);
                  } else {
                    if (menuItem.screen === 'history') {
                      onNavigate('history');
                    } else {
                      alert('Silakan lakukan Asesmen pertama terlebih dahulu untuk melihat analisis penuh.');
                      onNavigate('assessment');
                    }
                  }
                }}
                className="bg-elegant-panel border border-white/5 p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm transition hover:translate-y-[-2px] hover:border-elegant-gold/20 cursor-pointer group active:scale-95"
              >
                <div className={`p-2 rounded-xl ${menuItem.color} group-hover:scale-105 transition`}>
                  <menuItem.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-2 truncate w-full">
                  {menuItem.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips / Disclaimer Card */}
        <div className="bg-elegant-panel/50 rounded-2xl p-4 border border-white/5 flex gap-3 items-start">
          <HelpCircle className="w-5 h-5 text-elegant-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold text-white font-serif-elegant">Sistem Analisis SHAP</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Algoritma mengevaluasi kelebihan mental, alokasi sumber daya perusahaan, dan efektivitas setup kerja (WFA/WFH). Tekan tombol <b className="text-elegant-gold cursor-pointer underline" onClick={() => onNavigate('journey')}>User Journey</b> untuk melihat detail petunjuk peta digital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
