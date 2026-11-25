import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { buttonStyles } from '../ui/Button';

export const PublicHeader: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/explore', label: 'Explore Cities' },
    { to: '/methodology', label: 'Methodology' },
    { to: '/privacy', label: 'Privacy' },
  ];

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-10 py-3">
      <nav
        aria-label="Primary Navigation"
        className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md border border-[#E2E8F0] rounded-2xl px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-sm"
      >
        <Link to="/" className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#0F766E] rounded-lg px-1">
          <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight text-[#182A29]">BreatheIQ</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#475569]">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={active ? 'text-[#0F766E] font-bold' : 'hover:text-[#0F766E] transition-colors'}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2.5">
          <Link to="/login" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
            Sign In
          </Link>
          <Link to="/signup" className={buttonStyles({ size: 'sm' })}>
            Create Account
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-[#182A29] hover:bg-[#F1F5F9]"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-lg space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#182A29] hover:bg-[#F8FAF7]"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#E2E8F0] flex gap-2">
            <Link
              to="/login"
              className={buttonStyles({ variant: 'outline', size: 'sm', className: 'flex-1' })}
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className={buttonStyles({ size: 'sm', className: 'flex-1' })}
              onClick={() => setMobileOpen(false)}
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
