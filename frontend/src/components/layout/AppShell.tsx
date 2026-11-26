import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertsAndRules } from '../../api/hooks';
import { getMobileBottomNavItems, getWorkspaceNavItems } from '../../config/navigation';
import { SupportedLang, useLanguage } from '../../i18n/translations';
import { SkipLink } from './SkipLink';
import { MobileNavDrawer, WorkspaceSidebar } from './WorkspaceNav';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

const LANGUAGES: SupportedLang[] = ['en', 'hi', 'mr'];

/** Responsive authenticated workspace shell with sidebar, header bar, and mobile drawer. */
export const AppShell: React.FC<AppShellProps> = ({ title, children, headerRight }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: alertsData } = useAlertsAndRules();
  const unreadCount = alertsData?.notifications.filter((n) => !n.is_read).length ?? 0;

  const navItems = getWorkspaceNavItems(t, user?.role);
  const mobileNavItems = getMobileBottomNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col lg:flex-row">
      <SkipLink />

      <WorkspaceSidebar
        items={navItems}
        currentPath={location.pathname}
        userLabel={user?.full_name || user?.email || ''}
        signOutLabel={t('nav.signOut')}
        onLogout={() => void handleLogout()}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open workspace menu"
                className="lg:hidden p-2 rounded-lg text-[#182A29] hover:bg-[#F1F5F9]"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <Link to="/app/dashboard" className="lg:hidden shrink-0">
                <img src="/logo-mark.webp" alt="BreatheIQ" className="w-7 h-7 object-contain" />
              </Link>
              <span className="text-sm font-bold text-[#182A29] truncate">{title}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {headerRight}
              <div
                className="inline-flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAF7] p-0.5"
                role="group"
                aria-label="Language switcher"
              >
                {LANGUAGES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLang(code)}
                    aria-pressed={lang === code}
                    className={`px-2 py-1 text-[11px] font-bold uppercase rounded-md transition-colors ${
                      lang === code
                        ? 'bg-[#0F766E] text-white'
                        : 'text-[#475569] hover:text-[#182A29]'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <Link
                to="/app/notifications"
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative p-2 rounded-lg border border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAF7] hover:text-[#0F766E]"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC5252] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full pb-20 lg:pb-10 focus:outline-none"
        >
          {children}
        </main>

        <nav
          aria-label="Mobile Quick Navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E2E8F0] px-2 py-1.5 flex items-center justify-around"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  active ? 'text-[#0F766E]' : 'text-[#475569]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <MobileNavDrawer
        open={drawerOpen}
        items={navItems}
        currentPath={location.pathname}
        signOutLabel={t('nav.signOut')}
        onClose={() => setDrawerOpen(false)}
        onLogout={() => void handleLogout()}
      />
    </div>
  );
};
