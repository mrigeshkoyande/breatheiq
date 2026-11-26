import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertsAndRules } from '../../api/hooks';
import { getMobileBottomNavItems, getWorkspaceNavItems } from '../../config/navigation';
import { SupportedLang, useLanguage } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { SkipLink } from './SkipLink';

interface AppShellProps {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

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

  const renderLinks = (onItemClick?: () => void) => (
    <nav aria-label="Workspace Navigation" className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-[#DDF5EC] text-[#0F766E] font-bold'
                : 'text-[#334155] hover:bg-[#F8FAF7] hover:text-[#0F766E]'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col lg:flex-row">
      <SkipLink />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-[#E2E8F0] p-4 justify-between sticky top-0 h-screen">
        <div className="space-y-5 overflow-y-auto">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-2.5 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
          >
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold text-base tracking-tight text-[#182A29]">BreatheIQ</div>
              <div className="text-[11px] font-medium text-[#475569]">Atmospheric Suite</div>
            </div>
          </Link>
          {renderLinks()}
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
          <div className="px-2 text-xs text-[#475569] truncate font-medium">
            {user?.full_name || user?.email}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleLogout()}
            className="w-full justify-start text-[#B91C1C] hover:bg-[#FEF2F2]"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {t('nav.signOut')}
          </Button>
        </div>
      </aside>

      {/* Main Content Column */}
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
                {(['en', 'hi', 'mr'] as SupportedLang[]).map((code) => (
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

        {/* Mobile Bottom Quick Nav */}
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

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
        >
          <div className="w-72 max-w-[85vw] bg-white h-full p-4 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo-mark.webp" alt="BreatheIQ" className="w-7 h-7 object-contain" />
                  <span className="font-bold text-base text-[#182A29]">BreatheIQ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close workspace menu"
                  className="p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9]"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              {renderLinks(() => setDrawerOpen(false))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleLogout()}
              className="mt-4 w-full text-[#B91C1C]"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {t('nav.signOut')}
            </Button>
          </div>
          <button
            type="button"
            aria-label="Close workspace menu backdrop"
            className="flex-1 bg-transparent border-0"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
