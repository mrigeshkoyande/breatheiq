import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AqiBadge } from '../components/ui/AqiBadge';
import { ArrowRight, Sparkles, Activity } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col">
      {/* Navigation */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-mark.webp" alt="BreatheIQ Mark" className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg leading-none text-[#182A29]">
              Breathe<span className="text-[#0F766E]">IQ</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
              Urban Air Quality Assistant
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/dev/ui" className="text-xs font-semibold text-[#64748B] hover:text-[#0F766E] hidden sm:inline">
            Design Sandbox (/dev/ui)
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
        </div>
      </header>

      {/* Hero Section matching Mumbai Hero redesign */}
      <main className="flex-1">
        <section className="py-16 lg:py-24 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DDF5EC] border border-[#A7E8C6] text-xs font-bold text-[#0F766E]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Challenge 6 — Urban Air Quality Assistant</span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#182A29] tracking-tight leading-tight max-w-4xl mx-auto">
            Breathe Smarter. <span className="text-[#0F766E]">Live Healthier.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            GenAI-powered assistant helping families and communities navigate severe winter smog with CPCB ground telemetry, Window Oracle ventilation forecasts, and sustainable commute alternatives.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/signup">
              <Button size="lg" className="shadow-lg">
                Start Protecting Your Family
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Explore Demo Dashboard
              </Button>
            </Link>
          </div>

          {/* Hero Live Telemetry Preview Card */}
          <div className="pt-10 max-w-2xl mx-auto">
            <div className="p-6 bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated text-left space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0F766E]" />
                  <span className="text-xs font-bold uppercase text-[#64748B]">Live CPCB Monitoring</span>
                </div>
                <Badge badgeType="LIVE" />
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-heading font-bold text-2xl text-[#182A29]">Andheri West, Mumbai</h3>
                  <p className="text-xs text-[#64748B]">Updated 4 mins ago &bull; Station Distance: 1.2 km</p>
                </div>
                <AqiBadge category="Poor" aqi={242} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 border-t border-[#E2E8F0] bg-white text-center text-xs text-[#64748B]">
        BreatheIQ &copy; 2026. Built with React 19, TypeScript, Tailwind CSS, FastAPI & Google Gemini.
      </footer>
    </div>
  );
};
