import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';
import {
  Settings,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Shield,
  Sliders,
  BookOpen,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface ThresholdConfig {
  low_max: number;
  medium_max: number;
}

interface RecommendationTemplate {
  id: string;
  title: string;
  desc: string;
  category: string;
}

interface AdminScreenProps {
  onBack: () => void;
}

// ============================================================
// ADMIN SCREEN COMPONENT
// ============================================================
export default function AdminScreen({ onBack }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<'threshold' | 'recommendations' | 'users'>('threshold');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Threshold state
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    low_max: 0.39,
    medium_max: 0.69,
  });

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationTemplate[]>([
    { id: 'rec_1', title: 'Kurangi beban kerja', desc: 'Prioritaskan tugas utama dan delegasikan jika memungkinkan.', category: 'Tinggi' },
    { id: 'rec_2', title: 'Atur jadwal istirahat', desc: 'Ambil jeda singkat setiap beberapa jam kerja.', category: 'Sedang' },
    { id: 'rec_3', title: 'Diskusi dengan HR/Manager', desc: 'Bicarakan tantangan dan cari solusi bersama.', category: 'Tinggi' },
    { id: 'rec_4', title: 'Evaluasi WFH setup', desc: 'Pastikan ruang kerja nyaman dan bebas gangguan.', category: 'Rendah' },
    { id: 'rec_5', title: 'Lakukan hobi di luar kerja', desc: 'Luangkan waktu untuk kegiatan yang menyenangkan.', category: 'Sedang' },
  ]);

  // User list state
  const [users, setUsers] = useState<{ uid: string; name: string; email: string }[]>([]);

  // ============================================================
  // Load data dari Firebase saat mount
  // ============================================================
  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      // Load thresholds
      const threshSnap = await get(ref(db, 'masterData/thresholds'));
      if (threshSnap.exists()) {
        setThresholds(threshSnap.val());
      }

      // Load recommendations
      const recSnap = await get(ref(db, 'masterData/recommendations'));
      if (recSnap.exists()) {
        const data = recSnap.val() as Record<string, RecommendationTemplate>;
        setRecommendations(Object.values(data));
      }

      // Load users
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) {
        const data = usersSnap.val() as Record<string, { name: string; email: string }>;
        const userList = Object.entries(data).map(([uid, u]) => ({
          uid,
          name: u.name,
          email: u.email,
        }));
        setUsers(userList);
      }
    } catch (err) {
      console.error('❌ Gagal load master data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Simpan threshold ke Firebase
  // ============================================================
  const saveThresholds = async () => {
    setSaveStatus('saving');
    try {
      await set(ref(db, 'masterData/thresholds'), thresholds);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // ============================================================
  // Simpan rekomendasi ke Firebase
  // ============================================================
  const saveRecommendations = async () => {
    setSaveStatus('saving');
    try {
      const recObj: Record<string, RecommendationTemplate> = {};
      recommendations.forEach((r) => { recObj[r.id] = r; });
      await set(ref(db, 'masterData/recommendations'), recObj);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // ============================================================
  // Tambah rekomendasi baru
  // ============================================================
  const addRecommendation = () => {
    const newRec: RecommendationTemplate = {
      id: `rec_${Date.now()}`,
      title: '',
      desc: '',
      category: 'Sedang',
    };
    setRecommendations((prev) => [...prev, newRec]);
  };

  // ============================================================
  // Hapus rekomendasi
  // ============================================================
  const deleteRecommendation = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  };

  // ============================================================
  // Update field rekomendasi
  // ============================================================
  const updateRecommendation = (id: string, field: keyof RecommendationTemplate, value: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // ============================================================
  // Render Save Button
  // ============================================================
  const renderSaveButton = (onSave: () => void) => (
    <button
      onClick={onSave}
      disabled={saveStatus === 'saving'}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
        saveStatus === 'success'
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : saveStatus === 'error'
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : 'bg-elegant-gold/20 text-elegant-gold border border-elegant-gold/30 hover:bg-elegant-gold/30'
      }`}
    >
      {saveStatus === 'saving' ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : saveStatus === 'success' ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : saveStatus === 'error' ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : (
        <Save className="w-3.5 h-3.5" />
      )}
      {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'success' ? 'Tersimpan!' : saveStatus === 'error' ? 'Gagal!' : 'Simpan'}
    </button>
  );

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex flex-col h-full bg-elegant-bg overflow-hidden">
      {/* Header */}
      <div className="bg-elegant-panel border-b border-white/5 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-elegant-gold" />
          <span className="text-sm font-bold text-white">Panel Admin</span>
        </div>
        <span className="ml-auto text-[10px] font-mono text-elegant-gold bg-elegant-gold/10 px-2 py-0.5 rounded-full border border-elegant-gold/20">
          ADMIN
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0 bg-elegant-panel">
        {[
          { id: 'threshold', label: 'Threshold', icon: Sliders },
          { id: 'recommendations', label: 'Rekomendasi', icon: BookOpen },
          { id: 'users', label: 'Pengguna', icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition cursor-pointer ${
              activeTab === id
                ? 'text-elegant-gold border-b-2 border-elegant-gold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-5 h-5 text-elegant-gold animate-spin" />
            <span className="ml-2 text-xs text-slate-400">Memuat data...</span>
          </div>
        ) : (
          <>
            {/* ---- TAB: THRESHOLD ---- */}
            {activeTab === 'threshold' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Konfigurasi Threshold Risiko</h3>
                  {renderSaveButton(saveThresholds)}
                </div>

                <p className="text-[11px] text-slate-400">
                  Atur batas skor burn rate untuk setiap kategori risiko. Perubahan ini berlaku untuk semua prediksi baru.
                </p>

                {/* Threshold Cards */}
                <div className="space-y-3">
                  {/* Low */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="text-xs font-bold text-emerald-400">RISIKO RENDAH</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Burn Rate: 0.00 — {thresholds.low_max.toFixed(2)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 w-20">Batas atas:</span>
                      <input
                        type="range"
                        min="0.10"
                        max="0.50"
                        step="0.01"
                        value={thresholds.low_max}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, low_max: parseFloat(e.target.value) }))}
                        className="flex-1 accent-emerald-400 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-400 w-10 text-right">
                        {thresholds.low_max.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span className="text-xs font-bold text-amber-400">RISIKO SEDANG</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Burn Rate: {(thresholds.low_max + 0.01).toFixed(2)} — {thresholds.medium_max.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 w-20">Batas atas:</span>
                      <input
                        type="range"
                        min="0.50"
                        max="0.85"
                        step="0.01"
                        value={thresholds.medium_max}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, medium_max: parseFloat(e.target.value) }))}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-amber-400 w-10 text-right">
                        {thresholds.medium_max.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* High */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-xs font-bold text-red-400">RISIKO TINGGI</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Burn Rate: {(thresholds.medium_max + 0.01).toFixed(2)} — 1.00
                    </p>
                    <p className="text-[11px] text-slate-500 italic">Otomatis dihitung dari batas sedang ke atas.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ---- TAB: REKOMENDASI ---- */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Katalog Rekomendasi</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={addRecommendation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah
                    </button>
                    {renderSaveButton(saveRecommendations)}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Kelola daftar rekomendasi yang ditampilkan kepada karyawan berdasarkan level risiko.
                </p>

                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="bg-elegant-card border border-white/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={rec.category}
                          onChange={(e) => updateRecommendation(rec.id, 'category', e.target.value)}
                          className="text-[10px] font-bold bg-transparent border border-white/10 rounded-lg px-2 py-1 text-slate-300 cursor-pointer"
                        >
                          <option value="Rendah">Rendah</option>
                          <option value="Sedang">Sedang</option>
                          <option value="Tinggi">Tinggi</option>
                        </select>
                        <button
                          onClick={() => deleteRecommendation(rec.id)}
                          className="ml-auto text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        value={rec.title}
                        onChange={(e) => updateRecommendation(rec.id, 'title', e.target.value)}
                        placeholder="Judul rekomendasi..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-elegant-gold/50"
                      />
                      <textarea
                        value={rec.desc}
                        onChange={(e) => updateRecommendation(rec.id, 'desc', e.target.value)}
                        placeholder="Deskripsi rekomendasi..."
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-elegant-gold/50 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---- TAB: USERS ---- */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Data Pengguna</h3>
                  <button
                    onClick={loadMasterData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Total pengguna terdaftar: <span className="text-white font-bold">{users.length}</span>
                </p>

                <div className="space-y-2">
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Belum ada pengguna terdaftar
                    </div>
                  ) : (
                    users.map((u) => (
                      <div key={u.uid} className="bg-elegant-card border border-white/5 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-elegant-gold/20 flex items-center justify-center text-elegant-gold font-bold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
