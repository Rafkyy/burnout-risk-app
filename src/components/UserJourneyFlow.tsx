import React from 'react';
import { LogIn, LayoutDashboard, FileText, Cpu, Eye, ShieldCheck, History, ArrowDown } from 'lucide-react';
import { ScreenName } from '../types';

interface UserJourneyFlowProps {
  onBack: () => void;
  onNavigateToStep: (screen: ScreenName) => void;
  currentScreen: ScreenName;
}

export default function UserJourneyFlow({ onBack, onNavigateToStep, currentScreen }: UserJourneyFlowProps) {
  const steps = [
    {
      step: 1,
      title: '1. Login (Welcome)',
      desc: 'Secure user authentication.',
      icon: LogIn,
      screen: 'login' as ScreenName,
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    {
      step: 2,
      title: '2. Dashboard (Home)',
      desc: 'Overview of app features.',
      icon: LayoutDashboard,
      screen: 'dashboard' as ScreenName,
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      step: 3,
      title: '3. Assessment Form (Input)',
      desc: 'Answer questions about work habits.',
      icon: FileText,
      screen: 'assessment' as ScreenName,
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    {
      step: 4,
      title: '4. Analysis Process (Loading/Algorithm)',
      desc: 'Calculating risk levels...',
      icon: Cpu,
      screen: 'loading' as ScreenName,
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    {
      step: 5,
      title: '5. Result & SHAP (Insight)',
      desc: 'View detailed risk score & contributing factors.',
      icon: Eye,
      screen: 'result' as ScreenName,
      color: 'bg-red-100 text-red-700 border-red-200',
    },
    {
      step: 6,
      title: '6. Recommendations (Action)',
      desc: 'Get personalized advice.',
      icon: ShieldCheck,
      screen: 'recommendations' as ScreenName,
      color: 'bg-teal-100 text-teal-700 border-teal-200',
    },
    {
      step: 7,
      title: '7. History (Tracking)',
      desc: 'Review past assessments.',
      icon: History,
      screen: 'history' as ScreenName,
      color: 'bg-stone-200 text-stone-700 border-stone-300',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto pb-6">
      {/* Header bar */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition text-xs font-bold"
        >
          ← Dashboard
        </button>
        <span className="font-serif-elegant font-bold text-white text-base">Journey Flow</span>
        <div className="w-12"></div>
      </div>

      <div className="p-5 flex-1 max-w-md mx-auto w-full space-y-5">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white font-serif-elegant">Alur Perjalanan Pengguna</h2>
          <p className="text-xs text-slate-400">Klik langkah untuk langsung beralih ke layar simulasi tersebut</p>
        </div>

        {/* Vertical flow layout matching screenshot 10 perfectly with arrows */}
        <div className="flex flex-col items-center space-y-2">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isActive = currentScreen === st.screen;
            return (
              <React.Fragment key={st.step}>
                <div
                  onClick={() => {
                    // navigate directly to show user of that screen
                    if (st.screen === 'loading') {
                      onNavigateToStep('assessment'); // triggers assessment so they can run it
                      alert('Silakan tekan Submit pada formulir untuk melihat simulasi proses algoritma!');
                    } else {
                      onNavigateToStep(st.screen);
                    }
                  }}
                  className={`w-full border p-4 rounded-2xl flex items-center gap-4 transition duration-150 cursor-pointer ${
                    isActive
                      ? 'border-elegant-gold bg-elegant-panel ring-2 ring-elegant-gold/20 shadow-md transform scale-[1.02]'
                      : 'border-white/5 bg-elegant-panel/70 hover:border-elegant-gold/20 hover:bg-elegant-panel'
                  }`}
                >
                  {/* Icon label of step background matched with colors */}
                  <div className={`p-3 rounded-xl shrink-0 bg-elegant-gold/10 text-elegant-gold border border-elegant-gold/15`}>
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>

                  {/* Flow description texts */}
                  <div className="space-y-0.5 flex-1 text-left">
                    <h4 className="font-bold text-xs text-white flex items-center justify-between font-serif-elegant">
                      <span>{st.title}</span>
                      {isActive && (
                        <span className="text-[8px] bg-elegant-gold text-black font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider whitespace-nowrap">
                          Aktif
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow down connector between flow steps */}
                {idx < steps.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-elegant-gold/40 stroke-[2.5] my-1 inline" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
