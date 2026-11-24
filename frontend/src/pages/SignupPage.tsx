import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, fullName);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-between">
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
        <Link to="/login" className="text-xs font-semibold text-[#0F766E] hover:underline">
          Already registered? Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 lg:p-10">
        <div className="w-full max-w-5xl bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#E9FEFB] via-[#DDF2F0] to-[#A8ECE5] p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[10px] font-bold text-[#0F766E] uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-[#2F9E62] animate-pulse" />
                Join Clean Air Movement
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#182A29]">
                Protect your family from winter smog
              </h2>
              <p className="text-sm text-[#0F766E] font-medium mt-2">
                Hyper-local CPCB air monitoring, Window Oracle ventilation forecasts & CleanRoute navigation.
              </p>
            </div>

            <div className="space-y-3 my-6 text-xs text-[#3E4947]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2F9E62]" />
                <span>Deterministic CPCB NAQI algorithm</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2F9E62]" />
                <span>AirTwin vulnerability profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2F9E62]" />
                <span>Public health advisories without medical claims</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B]">
              BreatheIQ respects data privacy. All environmental telemetry is grounded in official station and meteorological feeds.
            </p>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto space-y-6">
              <div>
                <h1 className="font-heading font-bold text-2xl text-[#182A29]">
                  Create your account
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Start monitoring clean air for your home and family
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
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Priya Sharma"
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  helperText="Use a secure password with 8+ characters."
                  required
                />

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
              </form>

              <div className="pt-4 text-center border-t border-[#E2E8F0] text-xs text-[#64748B]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#0F766E] hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#64748B]">
        BreatheIQ &copy; 2026. Challenge 6 — Urban Air Quality Assistant.
      </footer>
    </div>
  );
};
