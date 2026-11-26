import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, buttonStyles } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SkipLink } from '../components/layout/SkipLink';

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleQuickNav = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (q.includes('mumbai') || q.includes('delhi') || q.includes('city')) {
      navigate('/explore');
    } else if (q.includes('cadr') || q.includes('purifier') || q.includes('naqi')) {
      navigate('/methodology');
    } else if (q.includes('privacy')) {
      navigate('/privacy');
    } else {
      navigate(user ? '/app/dashboard' : '/');
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SkipLink />
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-edge bg-white">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
        </Link>
        <Link to="/" className="text-sm font-semibold text-brand hover:underline">
          Back to Home
        </Link>
      </header>

      <main id="main-content" className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-edge rounded-2xl p-8 text-center space-y-6 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-danger-soft text-danger text-xs font-bold uppercase tracking-wider">
            404 · Page Not Found
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Atmospheric Route Unavailable</h1>
          <p className="text-sm text-ink-secondary">
            The page you requested could not be found. Search core topics below or return to your
            workspace.
          </p>

          <form onSubmit={handleQuickNav} className="flex gap-2">
            <Input
              aria-label="Search BreatheIQ destination"
              placeholder="Search cities, NAQI methodology, privacy..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="submit" aria-label="Go to matching section">
              <Search className="w-4 h-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to={user ? '/app/dashboard' : '/'} className={buttonStyles()}>
              <Home className="w-4 h-4" aria-hidden="true" />
              {user ? 'Dashboard' : 'Landing Page'}
            </Link>
            <Link to="/explore" className={buttonStyles({ variant: 'outline' })}>
              <Compass className="w-4 h-4" aria-hidden="true" />
              Explore Cities
            </Link>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};
