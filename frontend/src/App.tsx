import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RouteLoadingFallback } from './routes/ProtectedRoute';
import {
  AdminPage,
  AirQualityPage,
  AnalyticsPage,
  AssistantPage,
  CommunityPage,
  DashboardPage,
  DevUiPage,
  ExplorePage,
  FamilyPage,
  ForgotPasswordPage,
  HomePage,
  ImpactPage,
  LandingPage,
  LoginPage,
  MethodologyPage,
  NotFoundPage,
  NotificationsPage,
  OnboardingPage,
  PrivacyPage,
  ResetPasswordPage,
  RoutesPage,
  RoutinePage,
  SettingsPage,
  SignupPage,
  VerifyEmailPage,
  WhatIfPage,
} from './routes/lazyPages';

export const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dev/ui" element={<DevUiPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);
