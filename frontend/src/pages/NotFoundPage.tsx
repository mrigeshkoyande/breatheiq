import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Compass, Home, Search, ArrowLeft, ShieldAlert } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-between p-6 lg:p-12">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-mark.webp" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-heading font-bold text-lg text-[#182A29]">
            Breathe<span className="text-[#0F766E]">IQ</span>
          </span>
        </Link>
        <Link to="/" className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </header>

      {/* Main 404 Centerpiece */}
      <main className="max-w-lg mx-auto w-full text-center py-12 flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-[#DDF5EC] border border-[#A7E8C6] flex items-center justify-center text-[#0F766E] mb-6 shadow-sm">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>

        <h1 className="font-heading font-extrabold text-6xl text-[#182A29] tracking-tight">404</h1>
        <h2 className="font-heading font-bold text-2xl text-[#0F766E] mt-2">
          Atmospheric Zone Uncharted
        </h2>
        <p className="text-sm text-[#64748B] mt-3 leading-relaxed">
          The coordinates or route you requested cannot be found in our atmospheric telemetry grid.
          It may have shifted or requires a different access level.
        </p>

        {/* Search Bar fallback */}
        <form onSubmit={handleSearch} className="w-full max-w-sm mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-3" />
            <label htmlFor="notfound-search-input" className="sr-only">Search</label>
            <input
              id="notfound-search-input"
              name="search_query"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cities or topics..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#E2E8F0] text-xs font-medium focus:outline-none focus:border-[#0F766E]"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        {/* Quick Nav Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Home Sanctuary
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
          <Link to="/dev/ui">
            <Button variant="ghost" size="sm" className="text-xs text-[#64748B]">
              Component Sandbox
            </Button>
          </Link>
        </div>
      </main>

      {/* Helpful Navigation Footer */}
      <footer className="max-w-md mx-auto w-full text-center text-xs text-[#64748B] border-t border-[#E2E8F0] pt-6 flex flex-col items-center gap-1">
        <span>Need guidance? Return to the home dashboard or search your neighborhood above.</span>
      </footer>
    </div>
  );
};
