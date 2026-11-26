import React from 'react';
import { Link } from 'react-router-dom';
import { SkipLink } from './SkipLink';

interface AuthFormShellProps {
  headerAction: React.ReactNode;
  children: React.ReactNode;
  mainClassName?: string;
}

/** Shared accessible layout shell and top navigation chrome for authentication views. */
export const AuthFormShell: React.FC<AuthFormShellProps> = ({
  headerAction,
  children,
  mainClassName = 'flex-1 flex items-center justify-center p-4',
}) => (
  <div className="min-h-screen bg-canvas text-ink flex flex-col">
    <SkipLink />
    <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-edge bg-white/80 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2.5">
        <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
        <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
      </Link>
      {headerAction}
    </header>
    <main id="main-content" className={mainClassName}>
      {children}
    </main>
  </div>
);
