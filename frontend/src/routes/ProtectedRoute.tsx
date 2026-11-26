import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RouteLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-screen flex items-center justify-center bg-[#F8FAF7]"
  >
    <div className="flex flex-col items-center gap-3">
      <img
        src="/logo-mark.webp"
        alt="Loading"
        className="w-10 h-10 animate-bounce motion-reduce:animate-none"
      />
      <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
        Synchronizing Air Telemetry...
      </span>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoadingFallback />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <>{children}</>;
};
