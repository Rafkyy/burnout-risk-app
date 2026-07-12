import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  subscribeToAuthChanges,
  updateDisplayName,
} from '../authService';
import { checkIsAdmin } from '../masterDataService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Terjemahkan kode error Firebase Auth ke pesan Bahasa Indonesia yang ramah pengguna
function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Email belum terdaftar atau password salah.';
    case 'auth/wrong-password':
      return 'Password salah. Silakan coba lagi.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk.';
    case 'auth/weak-password':
      return 'Password terlalu lemah, minimal 6 karakter.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi beberapa saat lagi.';
    case 'auth/popup-closed-by-user':
      return 'Login dibatalkan.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda lalu coba lagi.';
    default: {
      const msg = (err as { message?: string })?.message;
      return msg && !msg.startsWith('Firebase') ? msg : 'Terjadi kesalahan. Silakan coba lagi.';
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Cek status admin setiap kali user berubah
  useEffect(() => {
    let active = true;
    if (user?.uid) {
      checkIsAdmin(user.uid).then((result) => {
        if (active) setIsAdmin(result);
      });
    } else {
      setIsAdmin(false);
    }
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const loginWithGoogle = async () => {
    try {
      setUser(await signInWithGoogle());
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setUser(await signInWithEmail(email, password));
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    try {
      setUser(await signUpWithEmail(email, password, name));
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const updateName = async (name: string) => {
    try {
      setUser(await updateDisplayName(name));
    } catch (err) {
      throw new Error(mapAuthError(err));
    }
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, loginWithGoogle, loginWithEmail, registerWithEmail, forgotPassword, updateName, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
