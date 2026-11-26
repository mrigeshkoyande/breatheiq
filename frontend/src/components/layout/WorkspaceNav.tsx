import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { WorkspaceNavItem } from '../../config/navigation';
import { Button } from '../ui/Button';

const NavLinksList: React.FC<{
  items: WorkspaceNavItem[];
  currentPath: string;
  onItemClick?: () => void;
}> = ({ items, currentPath, onItemClick }) => (
  <nav aria-label="Workspace Navigation" className="space-y-1">
    {items.map((item) => {
      const Icon = item.icon;
      const active = currentPath === item.path;
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
          <Icon className="w-4 h-4 shrink-0" aria-hidden={true} />
          <span className="truncate">{item.label}</span>
        </Link>
      );
    })}
  </nav>
);

interface SidebarProps {
  items: WorkspaceNavItem[];
  currentPath: string;
  userLabel: string;
  signOutLabel: string;
  onLogout: () => void;
}

/** Persistent desktop navigation sidebar with brand mark and account sign-out. */
export const WorkspaceSidebar: React.FC<SidebarProps> = ({
  items,
  currentPath,
  userLabel,
  signOutLabel,
  onLogout,
}) => (
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
      <NavLinksList items={items} currentPath={currentPath} />
    </div>

    <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
      <div className="px-2 text-xs text-[#475569] truncate font-medium">{userLabel}</div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="w-full justify-start text-[#B91C1C] hover:bg-[#FEF2F2]"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        {signOutLabel}
      </Button>
    </div>
  </aside>
);

interface DrawerProps {
  open: boolean;
  items: WorkspaceNavItem[];
  currentPath: string;
  signOutLabel: string;
  onClose: () => void;
  onLogout: () => void;
}

/** Accessible slide-over navigation drawer for tablet and mobile viewports. */
export const MobileNavDrawer: React.FC<DrawerProps> = ({
  open,
  items,
  currentPath,
  signOutLabel,
  onClose,
  onLogout,
}) => {
  if (!open) return null;
  return (
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
              onClick={onClose}
              aria-label="Close workspace menu"
              className="p-2 rounded-lg text-[#475569] hover:bg-[#F1F5F9]"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <NavLinksList items={items} currentPath={currentPath} onItemClick={onClose} />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="mt-4 w-full text-[#B91C1C]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          {signOutLabel}
        </Button>
      </div>
      <button
        type="button"
        aria-label="Close workspace menu backdrop"
        className="flex-1 bg-transparent border-0"
        onClick={onClose}
      />
    </div>
  );
};
