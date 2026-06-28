import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, forgotPassword } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login dengan Google gagal.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (isRegistering && !name) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password, name);
        setSuccessMsg('Pendaftaran berhasil! Mengarahkan ke Dashboard...');
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan, silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMsg('');
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu di atas, lalu klik "Lupa Password" lagi.');
      return;
    }
    try {
      await forgotPassword(email);
      setSuccessMsg(`Link reset password sudah dikirim ke ${email}. Silakan cek inbox/spam.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim email reset password.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-elegant-bg text-slate-300 overflow-y-auto">
      <div className="bg-elegant-panel border-b border-white/5 py-5 px-6 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-br from-elegant-gold to-elegant-gold-dark p-2 rounded-lg text-black shadow-md shadow-amber-950/30">
            <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <span className="font-serif-elegant font-bold text-white text-base tracking-wide">Lumina Burnout Analytica</span>
        </div>
        <div className="w-2 h-2 bg-elegant-gold rounded-full animate-pulse shadow-md shadow-elegant-gold/50"></div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center">
        <div className="my-auto max-w-sm w-full mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 id="login-title" className="text-2xl font-bold text-white font-serif-elegant tracking-tight">
              {isRegistering ? 'Buat Akun Baru' : 'Selamat Datang'}
            </h2>
            <p className="text-xs text-slate-400">
              {isRegistering ? 'Daftar dengan email untuk mulai memantau risiko burnout Anda' : 'Masuk untuk melanjutkan ke Dashboard'}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 text-rose-300 border border-rose-500/20 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/30 text-emerald-300 border border-emerald-500/20 text-xs rounded-xl font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400" htmlFor="input-name">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    id="input-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-elegant-panel text-slate-200 placeholder-slate-600 text-xs focus:border-elegant-gold focus:ring-1 focus:ring-elegant-gold transition outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400" htmlFor="input-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  id="input-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-elegant-panel text-slate-200 placeholder-slate-600 text-xs focus:border-elegant-gold focus:ring-1 focus:ring-elegant-gold transition outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400" htmlFor="input-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/5 bg-elegant-panel text-slate-200 placeholder-slate-600 text-xs focus:border-elegant-gold focus:ring-1 focus:ring-elegant-gold transition outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-elegant-gold to-elegant-gold-dark text-black font-extrabold py-3 rounded-xl hover:brightness-110 active:scale-98 shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-widest disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isRegistering ? 'Daftar' : 'Masuk'}</span>
            </button>

            {!isRegistering && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-elegant-gold hover:text-elegant-gold-light font-bold"
                >
                  Lupa Password?
                </button>
              </div>
            )}
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">atau</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            type="button"
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 active:scale-98 shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-elegant-gold-dark" />}
            <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Google'}</span>
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
              className="text-xs text-slate-400 font-semibold"
            >
              {isRegistering ? (
                <span>Sudah punya akun? <strong className="text-elegant-gold hover:underline font-bold">Masuk</strong></span>
              ) : (
                <span>Belum punya akun? <strong className="text-elegant-gold hover:underline font-bold">Daftar</strong></span>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 max-w-xs mx-auto mt-6">
          Sistem Keamanan Lumina Core terenkripsi 256-bit. Sesi penilaian mandiri Anda terjaga sepenuhnya melalui Firebase Authentication.
        </p>
      </div>
    </div>
  );
}