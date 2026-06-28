import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  isAuthenticated?: boolean; // override untuk fitur simulator/demo App.tsx
}

export default function ProtectedRoute({ children, fallback, isAuthenticated }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const authed = isAuthenticated !== undefined ? isAuthenticated : !!user;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-elegant-bg">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-elegant-gold animate-spin" />
      </div>
    );
  }

  return <>{authed ? children : fallback}</>;
}