import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu,
  RefreshCw,
  TrendingDown,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle,
  Home as HomeIcon,
  FileText,
  Clock,
  User as UserIcon,
  Shield,
  ShieldAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { useAuth } from './contexts/AuthContext';
import { createAssessment, getAssessmentHistory, deleteAssessment } from './firebaseService';
import { sendAssessmentEmail } from './emailService';
import { ScreenName, AssessmentInput, AssessmentResult } from './types';
import { calculateAssessmentResult } from './data';
import { predictBurnout, checkBackendHealth } from './apiService';
import { finalizeResult } from './masterDataService';
import { isEmbeddedWebView } from './authService';

import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import AssessmentScreen from './components/AssessmentScreen';
import ResultScreen from './components/ResultScreen';
import ShapScreen from './components/ShapScreen';
import RecommendationScreen from './components/RecommendationScreen';
import HistoryScreen from './components/HistoryScreen';
import ProfileScreen from './components/ProfileScreen';
import UserJourneyFlow from './components/UserJourneyFlow';
import ProtectedRoute from './components/ProtectedRoute';
import AdminScreen from './components/AdminScreen';

// ============================================================
// Hook: deteksi layar mobile (< lg) atau APK WebView.
// Di mode mobile, aplikasi dirender FULL-SCREEN tanpa
// mockup HP dan tanpa panel simulator desktop.
// ============================================================
function useIsMobileMode(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1023px)').matches || isEmbeddedWebView();
  });

  useEffect(() => {
    if (isEmbeddedWebView()) {
      setIsMobile(true);
      return;
    }
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

const LOADING_STEPS = [
  { step: 15, text: 'Memetakan data Kelebihan Mental...' },
  { step: 40, text: 'Menganalisis Alokasi Sumber Daya instansi...' },
  { step: 65, text: 'Menghitung kontribusi fitur via algoritma SHAP...' },
  { step: 85, text: 'Melakukan klasterisasi level risiko...' },
  { step: 100, text: 'Menyusun saran dan rekomendasi pribadi...' },
];

export default function App() {
  const { user: authUser, loading: authLoading, isAdmin, logout: authLogout } = useAuth();
  const isMobileMode = useIsMobileMode();

  const [screen, setScreen] = useState<ScreenName>('login');
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingText, setLoadingText] = useState('Menginisialisasi analisis...');

  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [latestResult, setLatestResult] = useState<AssessmentResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Ref untuk membersihkan timer loading jika komponen unmount
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, []);

  const isAuthenticated = !!authUser;

  // ── Cek status backend ML saat app dibuka ──
  useEffect(() => {
    checkBackendHealth().then((ok) => setBackendStatus(ok ? 'online' : 'offline'));
  }, []);

  // ── Sinkronisasi navigasi dengan status login Firebase ──
  useEffect(() => {
    if (authLoading) return;
    if (authUser && screen === 'login') {
      setScreen('dashboard');
    } else if (!authUser && screen !== 'login') {
      setScreen('login');
      setHistory([]);
      setLatestResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authLoading]);

  // ── Muat riwayat assessment dari Firebase saat login ──
  useEffect(() => {
    if (!authUser?.uid) return;
    let active = true;
    getAssessmentHistory(authUser.uid)
      .then((data) => {
        if (!active) return;
        setHistory(data);
        setLatestResult(data.length > 0 ? data[0] : null);
      })
      .catch((err) => console.error('Gagal memuat riwayat:', err));
    return () => {
      active = false;
    };
  }, [authUser?.uid]);

  // ── Tambah/replace item riwayat lokal (tanpa duplikat id) ──
  const upsertHistory = useCallback((result: AssessmentResult) => {
    setHistory((prev) => {
      const without = prev.filter((h) => h.id !== result.id);
      return [result, ...without];
    });
  }, []);

  const handleLogout = () => {
    setScreen('login');
    setHistory([]);
    setLatestResult(null);
    authLogout().catch(console.error);
  };

  // ============================================================
  // SUBMIT ASSESSMENT
  // - Animasi loading minimal ±2.3 detik agar terasa natural
  // - Prediksi via API (timeout 15 dtk) dengan fallback lokal
  // - Threshold & rekomendasi dari Admin Panel DITERAPKAN di sini
  // - Hasil langsung tersimpan ke Firebase & muncul di Riwayat
  // ============================================================
  const handleAssessmentSubmit = (input: AssessmentInput) => {
    if (!authUser?.uid) return;
    setScreen('loading');
    setLoadingStep(0);
    setLoadingText('Menerima parameter input...');

    // Jalankan prediksi paralel dengan animasi
    const predictionPromise: Promise<AssessmentResult> = predictBurnout(input)
      .catch((err) => {
        console.error('Prediksi API gagal, memakai kalkulasi lokal:', err);
        return calculateAssessmentResult(input);
      })
      // Terapkan konfigurasi Admin Panel (threshold + rekomendasi)
      .then((raw) => finalizeResult(raw).catch(() => raw));

    let idx = 0;
    if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    loadingTimerRef.current = setInterval(() => {
      if (idx < LOADING_STEPS.length) {
        setLoadingStep(LOADING_STEPS[idx].step);
        setLoadingText(LOADING_STEPS[idx].text);
        idx++;
        return;
      }
      // Animasi selesai → tunggu hasil prediksi (paling lama 15 dtk krn timeout)
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      predictionPromise.then((result) => {
        const uid = authUser.uid as string;
        createAssessment(uid, authUser.email, result).catch(console.error);
        upsertHistory(result);
        setLatestResult(result);
        setScreen('result');
      });
    }, 450);
  };

  // ── Simpan update rekomendasi (checklist) dari layar Rekomendasi ──
  const handleSaveResult = (updatedResult: AssessmentResult) => {
    upsertHistory(updatedResult);
    setLatestResult(updatedResult);
    setScreen('history');
    if (authUser?.uid) {
      createAssessment(authUser.uid, authUser.email, updatedResult).catch(console.error);
      sendAssessmentEmail(authUser, updatedResult).catch((err) =>
        console.error('Gagal mengirim email notifikasi:', err)
      );
    }
  };

  const handleDeleteHistoryItem = (assessmentId: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== assessmentId));
    setLatestResult((prev) => (prev?.id === assessmentId ? null : prev));
    if (authUser?.uid) {
      deleteAssessment(authUser.uid, assessmentId).catch(console.error);
    }
  };

  // ── Preset simulasi (hanya desktop & sudah login) ──
  // Hasil preset TIDAK disimpan ke Firebase — murni demo tampilan.
  const handleLoadPreset = (profile: 'low' | 'high' | 'medium') => {
    const presets: Record<typeof profile, AssessmentInput> = {
      low: {
        jenisKelamin: 'Perempuan',
        tipePerusahaan: 'Teknologi',
        wfhSetup: true,
        levelJabatan: 1,
        alokasiSumberDaya: 4,
        skorKelebihanMental: 1,
      },
      medium: {
        jenisKelamin: 'Laki-laki',
        tipePerusahaan: 'Kesehatan',
        wfhSetup: true,
        levelJabatan: 2,
        alokasiSumberDaya: 2,
        skorKelebihanMental: 3,
      },
      high: {
        jenisKelamin: 'Laki-laki',
        tipePerusahaan: 'Keuangan',
        wfhSetup: false,
        levelJabatan: 3,
        alokasiSumberDaya: 1,
        skorKelebihanMental: 4,
      },
    };
    const result = calculateAssessmentResult(presets[profile], `hist_preset_${Date.now()}`);
    finalizeResult(result)
      .catch(() => result)
      .then((finalized) => {
        setLatestResult(finalized);
        setScreen('result');
      });
  };

  // Navigasi cepat dari User Journey / simulator — TANPA bypass login.
  // Jika belum login, ProtectedRoute otomatis menampilkan LoginScreen.
  const handleQuickScreenSwitch = (target: ScreenName) => {
    if (target === 'admin' && !isAdmin) return;
    // User yang sudah login tidak perlu melihat form login lagi
    if (target === 'login' && isAuthenticated) {
      setScreen('dashboard');
      return;
    }
    setScreen(target);
  };

  // ============================================================
  // RENDER LAYAR APLIKASI
  // ============================================================
  const renderAppScreens = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen />;
      case 'dashboard':
        return (
          <DashboardScreen
            currentUser={authUser!}
            latestResult={latestResult}
            onNavigate={(tgt) => setScreen(tgt)}
            onSelectHistoryItem={(item) => {
              setLatestResult(item);
              setScreen('result');
            }}
          />
        );
      case 'assessment':
        return (
          <AssessmentScreen
            onBack={() => setScreen('dashboard')}
            onSubmit={handleAssessmentSubmit}
          />
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 h-full bg-elegant-bg">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-elegant-gold animate-spin"></div>
              <Cpu className="absolute w-6 h-6 text-elegant-gold animate-pulse" />
            </div>
            <div className="space-y-2 max-w-xs">
              <h3 className="font-bold text-white text-lg font-serif-elegant">Proses Analisis</h3>
              <p className="text-xs text-slate-400 font-mono tracking-tight h-8">{loadingText}</p>
            </div>
            <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-elegant-gold h-full rounded-full transition-all duration-300"
                style={{ width: `${loadingStep}%` }}
              />
            </div>
            <span className="font-mono text-xs text-slate-400 font-bold">{loadingStep}%</span>
            <div
              className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                backendStatus === 'online'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
            >
              {backendStatus === 'online' ? (
                <>
                  <Wifi className="w-3 h-3" /> ML API Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" /> Mode Lokal
                </>
              )}
            </div>
          </div>
        );
      case 'result':
        return (
          <ResultScreen
            onBack={() => setScreen('dashboard')}
            result={latestResult}
            onNavigate={(tgt) => setScreen(tgt)}
          />
        );
      case 'shap':
        return (
          <ShapScreen
            onBack={() => setScreen('result')}
            result={latestResult}
            onNavigate={(tgt) => setScreen(tgt)}
          />
        );
      case 'recommendations':
        return (
          <RecommendationScreen
            onBack={() => setScreen('result')}
            result={latestResult}
            onSaveResult={handleSaveResult}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            onDeleteItem={handleDeleteHistoryItem}
            history={history}
            onBack={() => setScreen('dashboard')}
            onSelectHistoryItem={(item) => {
              setLatestResult(item);
              setScreen('result');
            }}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            currentUser={authUser!}
            onBack={() => setScreen('dashboard')}
            onLogout={handleLogout}
          />
        );
      case 'journey':
        return (
          <UserJourneyFlow
            onBack={() => setScreen('dashboard')}
            onNavigateToStep={handleQuickScreenSwitch}
            currentScreen={screen}
          />
        );
      case 'admin':
        // Lapisan proteksi kedua: hanya admin terdaftar yang bisa membuka
        if (!isAdmin) {
          return (
            <div className="flex flex-col items-center justify-center h-full bg-elegant-bg p-8 text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-rose-400" />
              <h3 className="text-white font-bold font-serif-elegant text-lg">Akses Ditolak</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Halaman ini khusus administrator. Hubungi pengelola sistem jika Anda merasa
                seharusnya memiliki akses.
              </p>
              <button
                onClick={() => setScreen('dashboard')}
                className="bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black text-xs font-extrabold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          );
        }
        return <AdminScreen onBack={() => setScreen('dashboard')} />;
      default:
        return <LoginScreen />;
    }
  };

  const isTabBarActive = ['dashboard', 'assessment', 'history', 'profile', 'result'].includes(screen);

  // ── Konten inti aplikasi: layar + tab bar (dipakai mobile & mockup desktop) ──
  const appShell = (
    <>
      <div className="flex-1 overflow-hidden relative bg-elegant-bg">
        <ProtectedRoute fallback={<LoginScreen />}>{renderAppScreens()}</ProtectedRoute>
      </div>

      {isTabBarActive && isAuthenticated && (
        <nav className="h-16 bg-elegant-panel border-t border-white/5 flex items-center justify-around shrink-0 pb-1 z-20 shadow-[0_-2px_15px_rgba(0,0,0,0.5)]">
          {[
            { id: 'dashboard', label: 'Home', icon: HomeIcon },
            { id: 'assessment', label: 'Asesmen', icon: FileText },
            { id: 'history', label: 'Riwayat', icon: Clock },
            { id: 'profile', label: 'Profil', icon: UserIcon },
            ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = screen === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setScreen(tab.id as ScreenName)}
                className={`flex flex-col items-center justify-center space-y-1 transition text-[10px] font-bold tracking-tight w-14 cursor-pointer ${
                  isActive ? 'text-elegant-gold font-extrabold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-elegant-gold' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );

  // ============================================================
  // MODE MOBILE / APK: aplikasi full-screen, tanpa mockup HP
  // ============================================================
  if (isMobileMode) {
    return (
      <div
        className="flex flex-col bg-elegant-bg text-slate-300 font-sans overflow-hidden"
        style={{ height: '100dvh' }}
        id="app-root-container"
      >
        {appShell}
      </div>
    );
  }

  // ============================================================
  // MODE DESKTOP: landing page + simulator mockup HP
  // ============================================================
  return (
    <div className="min-h-screen bg-elegant-bg text-slate-300 flex flex-col font-sans" id="app-root-container">
      {/* Header */}
      <header className="bg-elegant-panel border-b border-white/5 py-4 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-elegant-gold to-elegant-gold-dark p-2 rounded-xl text-black shadow-lg shadow-amber-900/10">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase font-serif-elegant">
              Burnout Risk Analytica
            </h1>
            <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
              LUMINA INTELLIGENCE SYSTEM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={() => setScreen('journey')}
              className="hidden sm:flex items-center gap-1.5 bg-white/5 text-elegant-gold-light hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-elegant-gold" />
              <span>Panduan Alur</span>
            </button>
          )}

          {/* Tombol Admin — hanya untuk admin terdaftar */}
          {isAuthenticated && isAdmin && (
            <button
              onClick={() => setScreen('admin')}
              className="hidden sm:flex items-center gap-1.5 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-elegant-gold" />
              <span>Admin</span>
            </button>
          )}

          {/* Status Backend */}
          <div
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              backendStatus === 'online'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : backendStatus === 'offline'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-white/5 text-elegant-gold border-white/10'
            }`}
          >
            {backendStatus === 'online' && <Wifi className="w-3 h-3" />}
            {backendStatus === 'offline' && <WifiOff className="w-3 h-3" />}
            {backendStatus === 'checking' && <RefreshCw className="w-3 h-3 animate-spin" />}
            {backendStatus === 'online' ? 'ML API: ONLINE' : backendStatus === 'offline' ? 'ML API: OFFLINE' : 'ML API: ...'}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center justify-items-center">
        {/* Left pane */}
        <section className="lg:col-span-7 space-y-6 w-full text-left order-2 lg:order-1">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-elegant-gold/10 text-elegant-gold px-3.5 py-1.5 rounded-full text-xs font-bold border border-elegant-gold/20 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive System Simulator</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif-elegant">
              Analisis Risiko Burnout{' '}
              <span className="bg-gradient-to-r from-elegant-gold via-elegant-gold-light to-white bg-clip-text text-transparent">
                Premium
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
              Gunakan simulator genggam interaktif di sebelah kanan untuk mengevaluasi parameter keseimbangan
              kerja karyawan. Sistem menghitung tingkat probabilitas kelelahan menggunakan model{' '}
              <b className="text-elegant-gold">Random Forest + SHAP (Shapley Additive exPlanations)</b> yang
              dilatih dari dataset burnout karyawan.
            </p>

            {/* Status info backend */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                backendStatus === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : backendStatus === 'offline'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {backendStatus === 'online' && (
                <>
                  <Wifi className="w-3 h-3" /> Prediksi menggunakan ML API (Random Forest)
                </>
              )}
              {backendStatus === 'offline' && (
                <>
                  <WifiOff className="w-3 h-3" /> ML API offline — menggunakan kalkulasi lokal
                </>
              )}
              {backendStatus === 'checking' && (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Menghubungi ML API...
                </>
              )}
            </div>
          </div>

          {/* Panel simulator — HANYA muncul setelah login (tidak ada bypass) */}
          {isAuthenticated ? (
            <>
              <div className="bg-elegant-panel border border-white/5 rounded-3xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-elegant-gold"></span>
                  <span>SIMULASI PROFIL CEPAT (LUMINA DATASETS):</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Coba hitung profil contoh secara instan. Hasil simulasi <b>tidak</b> disimpan ke riwayat Anda.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleLoadPreset('low')}
                    className="bg-elegant-card hover:bg-white/5 border border-white/5 text-emerald-400 text-xs font-bold p-3.5 rounded-2xl transition text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="group-hover:text-white transition-colors">Profil Aman (Rendah)</span>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[10px] text-slate-400/80 mt-1">Beban rendah + WFH aktif</span>
                  </button>
                  <button
                    onClick={() => handleLoadPreset('medium')}
                    className="bg-elegant-card hover:bg-white/5 border border-white/5 text-amber-400 text-xs font-bold p-3.5 rounded-2xl transition text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="group-hover:text-white transition-colors">Profil Menengah (Sedang)</span>
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[10px] text-slate-400/80 mt-1">Beban menengah, kognisi sedang</span>
                  </button>
                  <button
                    onClick={() => handleLoadPreset('high')}
                    className="bg-elegant-card hover:bg-white/5 border border-white/5 text-rose-400 text-xs font-bold p-3.5 rounded-2xl transition text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="group-hover:text-white transition-colors">Profil Kritis (Tinggi)</span>
                      <Award className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <span className="text-[10px] text-slate-400/80 mt-1">Kelebihan mental + No resources</span>
                  </button>
                </div>
              </div>

              {/* Quick Screen Switcher — navigasi saja, proteksi tetap berlaku */}
              <div className="bg-[#111318]/50 border border-white/5 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  BERALIH CEPAT LAYAR UTAMA (SIMULATOR CONTROLS)
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { name: 'dashboard', label: 'Dashboard' },
                    { name: 'assessment', label: 'Form Input' },
                    { name: 'result', label: 'Hasil Prediksi' },
                    { name: 'shap', label: 'Grafik SHAP' },
                    { name: 'recommendations', label: 'Rekomendasi' },
                    { name: 'history', label: 'Tren & Riwayat' },
                    { name: 'journey', label: 'User Journey' },
                    ...(isAdmin ? [{ name: 'admin', label: '⚙️ Admin Panel' }] : []),
                  ].map((lnk) => (
                    <button
                      key={lnk.name}
                      onClick={() => handleQuickScreenSwitch(lnk.name as ScreenName)}
                      className={`px-3.5 py-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        screen === lnk.name
                          ? 'bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black border-transparent font-extrabold shadow-md'
                          : 'bg-elegant-card text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {lnk.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-elegant-panel border border-white/5 rounded-3xl p-6 space-y-2">
              <h3 className="text-sm font-bold text-white font-serif-elegant">Masuk untuk memulai</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Silakan masuk atau daftar melalui simulator di sebelah kanan untuk mengakses dashboard,
                melakukan asesmen risiko burnout, dan melihat riwayat analisis Anda.
              </p>
            </div>
          )}
        </section>

        {/* Right pane — Smartphone mockup */}
        <section className="lg:col-span-5 w-full flex items-center justify-center order-1 lg:order-2">
          <div className="relative w-full max-w-[375px] h-[720px] max-h-[85vh] bg-[#0d0e12] rounded-[55px] p-3 border-4 border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden ring-4 ring-[#161922] flex flex-col">
            <div className="absolute top-1/4 left-0 w-0.5 h-20 bg-elegant-gold/20 rounded-r-md"></div>
            <div className="absolute top-1/2 left-0 w-0.5 h-12 bg-elegant-gold/20 rounded-r-md"></div>
            <div className="absolute top-1/3 right-0 w-0.5 h-16 bg-elegant-gold/20 rounded-l-md"></div>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-6 bg-[#0d0e12] rounded-b-3xl z-30 flex items-center justify-around px-4 border-b border-x border-white/5">
              <div className="w-16 h-1.5 bg-neutral-800 rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full"></div>
            </div>

            <div className="flex-1 bg-elegant-bg rounded-[42px] overflow-hidden flex flex-col relative z-20 shadow-inner">
              <div className="h-6 bg-elegant-panel text-[10px] text-slate-400 px-6 pt-1 flex items-center justify-between font-bold shrink-0 z-10 border-b border-white/5">
                <span className="font-mono">09:41</span>
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500">
                  <span>📶</span>
                  <span>5G</span>
                  <span>🔋 98%</span>
                </div>
              </div>

              {appShell}

              <div className="h-3 bg-elegant-panel flex items-center justify-center shrink-0 pb-1 z-20 border-t border-transparent">
                <div className="w-28 h-1 bg-neutral-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-elegant-panel border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p className="font-mono tracking-widest text-[10px] text-slate-600">
          LUMINA PREMIUM STYLING • ALL RIGHTS RESERVED © 2026
        </p>
      </footer>
    </div>
  );
}
