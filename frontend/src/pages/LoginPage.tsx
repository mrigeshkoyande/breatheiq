import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-mark.webp" alt="BreatheIQ Mark" className="w-8 h-8 rounded-lg" />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg leading-none text-[#182A29]">
              Breathe<span className="text-[#0F766E]">IQ</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
              Environmental Sanctuary
            </span>
          </div>
        </Link>
        <Link to="/" className="text-xs font-semibold text-[#0F766E] hover:underline">
          Back to Platform
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Atmospheric Showcase */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#E9FEFB] via-[#DDF2F0] to-[#A8ECE5] p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[10px] font-bold text-[#0F766E] uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-[#2F9E62] animate-pulse" />
                CPCB Telemetry Synchronized
              </div>

              <div className="flex items-center gap-3 mb-2">
                <img src="/logo-mark.webp" alt="Logo" className="w-10 h-10 rounded-xl shadow-sm" />
                <div>
                  <h2 className="font-heading font-bold text-xl text-[#182A29]">
                    Breathe<span className="text-[#0F766E]">IQ</span>
                  </h2>
                  <p className="text-[10px] font-bold tracking-widest text-[#64748B] uppercase">
                    Atmospheric Precision
                  </p>
                </div>
              </div>

              <p className="text-[#0F766E] font-heading font-semibold text-base mt-2">
                Breathe Smarter. Live Healthier.
              </p>
            </div>

            <div className="relative z-10 my-8 space-y-4">
              <div className="bg-white/85 backdrop-blur-sm rounded-xl p-4 border border-[#E2E8F0]/80 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3E4947] leading-relaxed">
                    “Precision atmospheric intelligence for every breath you take — grounded in real-time continuous CPCB telemetry.”
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#3E4947]">
                  <CheckCircle2 className="w-4 h-4 text-[#2F9E62]" />
                  <span>Ground station telemetry with timestamped provenance</span>
                </div>
                <div className="flex items-center gap-2 text-[#3E4947]">
                  <CheckCircle2 className="w-4 h-4 text-[#2F9E62]" />
                  <span>Diurnal thermal inversion forecasting</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Accounts Pill Bar */}
            <div className="relative z-10 pt-4 border-t border-[#0F766E]/15">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] block mb-2">
                One-Click Demo Accounts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('user@breatheiq.org')}
                  className="px-2 py-1 rounded bg-white/70 hover:bg-white text-[11px] font-medium text-[#182A29] border border-[#E2E8F0]"
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('moderator@breatheiq.org')}
                  className="px-2 py-1 rounded bg-white/70 hover:bg-white text-[11px] font-medium text-[#182A29] border border-[#E2E8F0]"
                >
                  Moderator
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin@breatheiq.org')}
                  className="px-2 py-1 rounded bg-white/70 hover:bg-white text-[11px] font-medium text-[#182A29] border border-[#E2E8F0]"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Form */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <h1 className="font-heading font-bold text-2xl text-[#182A29]">
                  Welcome back
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Access your hyper-local air intelligence dashboard
                </p>
              </div>

              {error && (
                <div className="p-3 bg-[#FDECEC] border border-[#F4A8A8] rounded-xl flex items-center gap-2.5 text-xs text-[#DC5252] font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., priya@example.com"
                  required
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#3E4947]">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-[#0F766E] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </Button>
              </form>

              <div className="pt-4 text-center border-t border-[#E2E8F0] text-xs text-[#64748B]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-[#0F766E] hover:underline">
                  Sign up for BreatheIQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#64748B]">
        BreatheIQ &copy; 2026. Challenge 6 — Urban Air Quality Assistant. All calculations adhere to CPCB benchmarks.
      </footer>
    </div>
  );
};
