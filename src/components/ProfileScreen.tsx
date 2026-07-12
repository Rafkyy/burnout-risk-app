import React, { useState } from 'react';
import { User as UserIcon, LogOut, ShieldAlert, ChevronLeft, ChevronRight, Edit2, Shield, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  currentUser: User;
  onLogout: () => void;
  onBack?: () => void;
}

export default function ProfileScreen({
  currentUser,
  onLogout,
  onBack,
}: ProfileScreenProps) {
  const { updateName } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [savingName, setSavingName] = useState(false);
  const [editError, setEditError] = useState('');
  const [showNotifySetting, setShowNotifySetting] = useState(false);
  const [notifySetting, setNotifySetting] = useState(true);

  // Nama disimpan PERMANEN ke Firebase Auth + database (bukan hanya state lokal)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setSavingName(true);
    try {
      await updateName(editName);
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan nama.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      {/* Header bar matching mockup */}
      <div className="bg-elegant-panel border-b border-white/5 py-4 px-5 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1 px-2.5 rounded-lg text-slate-300 hover:bg-white/5 transition flex items-center text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            <span>Kembali</span>
          </button>
        ) : (
          <div className="w-6"></div>
        )}
        <span className="font-serif-elegant font-bold text-white text-base">Profil Pengguna</span>
        <div className="w-6"></div>
      </div>

      <div className="p-6 flex-1 space-y-6">
        {/* Profile Card details centered */}
        {!isEditing ? (
          <div className="flex flex-col items-center text-center space-y-3.5 bg-elegant-panel p-5 rounded-2xl border border-white/5 shadow-md">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full ring-4 ring-elegant-gold/15 overflow-hidden shadow-inner relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 p-1.5 bg-elegant-gold hover:bg-elegant-gold-dark text-black rounded-full transition shadow-md"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-white font-serif-elegant leading-tight">
                {currentUser.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {currentUser.email}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleUpdate}
            className="space-y-4 bg-elegant-panel p-5 rounded-2xl border border-white/5 shadow-md"
          >
            <h4 className="font-bold text-white text-xs font-serif-elegant uppercase tracking-wider">Edit Data Profil</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="edit-name">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0B0D] border border-white/10 rounded-xl text-xs font-medium text-white focus:border-elegant-gold/50 outline-none transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider" htmlFor="edit-email">
                  Email address
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={currentUser.email}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 bg-[#0A0B0D]/60 border border-white/5 rounded-xl text-xs font-medium text-slate-500 outline-none cursor-not-allowed"
                />
                <p className="text-[9px] text-slate-500">Email terikat pada akun login dan tidak dapat diubah dari sini.</p>
              </div>
            </div>
            {editError && (
              <div className="p-2.5 bg-rose-950/40 text-rose-300 border border-rose-500/20 text-[11px] rounded-xl font-medium">
                {editError}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditError(''); setEditName(currentUser.name); }}
                className="px-3 py-1.5 border border-slate-700 hover:bg-white/5 text-slate-400 rounded-lg text-[11px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingName}
                className="px-4 py-1.5 bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold rounded-lg text-[11px] uppercase tracking-wider disabled:opacity-60 flex items-center gap-1.5"
              >
                {savingName && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{savingName ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Setting items lists */}
        <div className="bg-elegant-panel border border-white/5 rounded-2xl shadow-md overflow-hidden divide-y divide-white/5">
          {/* Edit Profil action item */}
          <div
            onClick={() => setIsEditing(true)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-white/5 text-elegant-gold rounded-xl border border-white/5">
                <Edit2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-white">Edit Profil</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
          </div>

          {/* Pengaturan Notifikasi toggle panel option */}
          <div
            onClick={() => setShowNotifySetting(!showNotifySetting)}
            className="p-4 flex flex-col justify-center cursor-pointer hover:bg-white/5 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-white/5 text-elegant-gold rounded-xl border border-white/5">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-white">Pengaturan Notifikasi</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showNotifySetting ? 'rotate-90' : ''}`} />
            </div>

            {showNotifySetting && (
              <div className="pt-3 pl-11 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] text-slate-400">Kirim pemberitahuan harian</span>
                <button
                  onClick={() => setNotifySetting(!notifySetting)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    notifySetting ? 'bg-elegant-gold' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black transition duration-200 ease-in-out ${
                      notifySetting ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Privasi & Keamanan */}
          <div
            onClick={() => alert('Sistem Privasi & Keamanan Enkripsi Aktif untuk melindungi parameter asesmen Anda.')}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-white/5 text-elegant-gold rounded-xl border border-white/5">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-white">Privasi & Keamanan</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
          </div>

          {/* Keluar */}
          <div
            onClick={onLogout}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-rose-500/5 transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 bg-rose-500/10 text-rose-300 rounded-xl border border-rose-500/10">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-rose-300" id="btn-logout-profile">
                Keluar
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}
