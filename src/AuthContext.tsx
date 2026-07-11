import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  signOutUser,
  subscribeToAuthChanges,
} from '../authService';

// ============================================================
// TYPES
// ============================================================
interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Login Google
  loginWithGoogle: () => Promise<User>;
  // Login Email
  loginWithEmail: (email: string, password: string) => Promise<User>;
  // Daftar Email
  registerWithEmail: (email: string, password: string, name: string) => Promise<User>;
  // Reset Password
  forgotPassword: (email: string) => Promise<void>;
  // Logout
  logout: () => Promise<void>;
}

// ============================================================
// CONTEXT
// ============================================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe ke perubahan status login Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Login Google ──
  const loginWithGoogle = async (): Promise<User> => {
    const loggedUser = await signInWithGoogle();
    setUser(loggedUser);
    return loggedUser;
  };

  // ── Login Email ──
  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const loggedUser = await signInWithEmail(email, password);
    setUser(loggedUser);
    return loggedUser;
  };

  // ── Daftar Email ──
  const registerWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<User> => {
    const newUser = await signUpWithEmail(email, password, name);
    setUser(newUser);
    return newUser;
  };

  // ── Reset Password ──
  const forgotPassword = async (email: string): Promise<void> => {
    await resetPassword(email);
  };

  // ── Logout ──
  const logout = async (): Promise<void> => {
    await signOutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
