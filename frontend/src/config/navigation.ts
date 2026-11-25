import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  Bot,
  CalendarCheck,
  Home,
  LayoutDashboard,
  Leaf,
  MessageSquareHeart,
  Navigation,
  Settings,
  Shield,
  Sliders,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { UserRole } from '../types/auth';

export interface WorkspaceNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export function getWorkspaceNavItems(
  t: (key: string) => string,
  role?: UserRole
): WorkspaceNavItem[] {
  const items: WorkspaceNavItem[] = [
    { path: '/app/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/app/air-quality', label: t('nav.airQuality'), icon: Activity },
    { path: '/app/analytics', label: t('nav.analytics'), icon: TrendingUp },
    { path: '/app/assistant', label: t('nav.assistant'), icon: Bot },
    { path: '/app/routine', label: t('nav.routine'), icon: CalendarCheck },
    { path: '/app/home', label: t('nav.home'), icon: Home },
    { path: '/app/family', label: t('nav.family'), icon: Users },
    { path: '/app/routes', label: t('nav.routes'), icon: Navigation },
    { path: '/app/impact', label: t('nav.impact'), icon: Leaf },
    { path: '/app/impact/what-if', label: 'What-If', icon: Sliders },
    { path: '/app/community', label: t('nav.community'), icon: MessageSquareHeart },
    { path: '/app/notifications', label: t('nav.notifications'), icon: Bell },
    { path: '/app/settings', label: t('nav.settings'), icon: Settings },
  ];

  if (role === 'admin' || role === 'moderator') {
    items.push({ path: '/admin', label: t('nav.admin'), icon: Shield });
  }
  return items;
}

export function getMobileBottomNavItems(): WorkspaceNavItem[] {
  return [
    { path: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/app/routine', label: 'Routine', icon: CalendarCheck },
    { path: '/app/assistant', label: 'Copilot', icon: Bot },
    { path: '/app/routes', label: 'Routes', icon: Navigation },
    { path: '/app/settings', label: 'Settings', icon: Settings },
  ];
}
