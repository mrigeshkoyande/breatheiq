import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, buttonStyles } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { SkipLink } from '../components/layout/SkipLink';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLen = password.length >= 8;
  const hasDigit = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const strengthScore = [hasMinLen, hasDigit, hasUpper].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!hasMinLen) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, fullName.trim());
      navigate('/onboarding');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#475569] hidden sm:inline">Already registered?</span>
          <Link to="/login" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
            Sign In
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:flex flex-col gap-5 pr-6">
            <p className="text-3xl font-extrabold tracking-tight leading-tight">
              Create Your Family Clean Air Profile.
            </p>
            <p className="text-[#475569] leading-relaxed">
              Configure household corridors, respiratory vulnerability weights for children and
              seniors, and room purifier CADR budgets in under two minutes.
            </p>
            <ul className="space-y-2.5 text-sm text-[#334155]">
              {[
                'Hourly Window Oracle aeration schedules',
                'True HEPA CADR & indoor decay sizing',
                'CPCB NAQI-grounded Copilot guidance',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Card elevated className="p-6 sm:p-8">
            <div className="mb-5">
              <h1 className="text-2xl font-bold tracking-tight mb-1">Create Account</h1>
              <p className="text-sm text-[#475569]">Set up personalized winter smog protection.</p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-medium"
              >
                {error}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Priya Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div className="space-y-1.5">
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <div
                  className="grid grid-cols-3 gap-1.5"
                  role="group"
                  aria-label="Password strength indicator"
                >
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full ${
                        strengthScore >= step
                          ? strengthScore === 3
                            ? 'bg-[#2F9E62]'
                            : 'bg-[#F59E0B]'
                          : 'bg-[#E2E8F0]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? (
                  'Creating account...'
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" aria-hidden="true" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
};
