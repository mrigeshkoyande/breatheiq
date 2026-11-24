import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public Pages (4)
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { PrivacyPage } from './pages/PrivacyPage';

// Auth Pages (5)
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { OnboardingPage } from './pages/OnboardingPage';

// Secondary Utility
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DevUiPage } from './pages/DevUiPage';

// Core App Pages (13)
import { DashboardPage } from './pages/DashboardPage';
import { AirQualityPage } from './pages/AirQualityPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AssistantPage } from './pages/AssistantPage';
import { RoutinePage } from './pages/RoutinePage';
import { HomePage } from './pages/HomePage';
import { FamilyPage } from './pages/FamilyPage';
import { RoutesPage } from './pages/RoutesPage';
import { ImpactPage } from './pages/ImpactPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommunityPage } from './pages/CommunityPage';

// Admin Page (1)
import { AdminPage } from './pages/AdminPage';

// Error Page (1)
import { NotFoundPage } from './pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF7]">
        <div className="flex flex-col items-center gap-3">
          <img src="/logo-mark.webp" alt="Loading" className="w-10 h-10 animate-bounce" />
          <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
            Synchronizing Air Telemetry...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin' && user.role !== 'moderator') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-[#F8FAF7]" />}>
          <Routes>
            {/* Public Scope (4) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Auth Scope (5) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Utility Endpoints */}
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dev/ui" element={<DevUiPage />} />

            {/* Core Application Scope (13) */}
            <Route
              path="/app/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/air-quality"
              element={
                <ProtectedRoute>
                  <AirQualityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/assistant"
              element={
                <ProtectedRoute>
                  <AssistantPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/routine"
              element={
                <ProtectedRoute>
                  <RoutinePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/family"
              element={
                <ProtectedRoute>
                  <FamilyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/routes"
              element={
                <ProtectedRoute>
                  <RoutesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impact"
              element={
                <ProtectedRoute>
                  <ImpactPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/impact/what-if"
              element={
                <ProtectedRoute>
                  <WhatIfPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/community"
              element={
                <ProtectedRoute>
                  <CommunityPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Command Center (1) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* System / Error Scope (1) */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};
