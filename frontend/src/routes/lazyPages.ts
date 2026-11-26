import { lazy } from 'react';

export const LandingPage = lazy(() =>
  import('../pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
export const ExplorePage = lazy(() =>
  import('../pages/ExplorePage').then((m) => ({ default: m.ExplorePage }))
);
export const MethodologyPage = lazy(() =>
  import('../pages/MethodologyPage').then((m) => ({ default: m.MethodologyPage }))
);
export const PrivacyPage = lazy(() =>
  import('../pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
export const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
export const SignupPage = lazy(() =>
  import('../pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
export const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
export const ResetPasswordPage = lazy(() =>
  import('../pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
export const OnboardingPage = lazy(() =>
  import('../pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
);
export const VerifyEmailPage = lazy(() =>
  import('../pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage }))
);
export const DevUiPage = lazy(() =>
  import('../pages/DevUiPage').then((m) => ({ default: m.DevUiPage }))
);
export const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
export const AirQualityPage = lazy(() =>
  import('../pages/AirQualityPage').then((m) => ({ default: m.AirQualityPage }))
);
export const AnalyticsPage = lazy(() =>
  import('../pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
export const AssistantPage = lazy(() =>
  import('../pages/AssistantPage').then((m) => ({ default: m.AssistantPage }))
);
export const RoutinePage = lazy(() =>
  import('../pages/RoutinePage').then((m) => ({ default: m.RoutinePage }))
);
export const HomePage = lazy(() =>
  import('../pages/HomePage').then((m) => ({ default: m.HomePage }))
);
export const FamilyPage = lazy(() =>
  import('../pages/FamilyPage').then((m) => ({ default: m.FamilyPage }))
);
export const RoutesPage = lazy(() =>
  import('../pages/RoutesPage').then((m) => ({ default: m.RoutesPage }))
);
export const ImpactPage = lazy(() =>
  import('../pages/ImpactPage').then((m) => ({ default: m.ImpactPage }))
);
export const WhatIfPage = lazy(() =>
  import('../pages/WhatIfPage').then((m) => ({ default: m.WhatIfPage }))
);
export const NotificationsPage = lazy(() =>
  import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
export const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
export const CommunityPage = lazy(() =>
  import('../pages/CommunityPage').then((m) => ({ default: m.CommunityPage }))
);
export const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
export const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);
