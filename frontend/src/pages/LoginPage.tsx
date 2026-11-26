import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAuthConfig } from '../api/hooks';
import { Button, buttonStyles } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AuthFormShell } from '../components/layout/AuthFormShell';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { data: authConfig } = useAuthConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showDemoQuickFill = authConfig?.demo_mode === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/app/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <AuthFormShell
      mainClassName="flex-1 flex items-center justify-center p-4 py-10"
      headerAction={
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-secondary hidden sm:inline">Need an account?</span>
          <Link to="/signup" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
            Create Account
          </Link>
        </div>
      }
    >
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:flex flex-col gap-6 pr-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint text-brand w-fit text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            JWT Session Security
          </div>
          <p className="text-3xl font-extrabold tracking-tight leading-tight">
            Return to Your Family Atmospheric Command Center.
          </p>
          <p className="text-ink-secondary leading-relaxed">
            Sign in to access personalized Window Oracle schedules, family AirTwin sensitivity
            alerts, indoor CADR filtration profiles, and saved impact records.
          </p>
          <Card className="bg-white/80 border-[#CCFBF1] space-y-2 p-5">
            <div className="flex items-center gap-2 font-bold text-sm text-brand">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-[#2F9E62] animate-pulse motion-reduce:animate-none"
              />
              Security Architecture
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Access tokens reside strictly in volatile memory. Refresh sessions use rotating
              HttpOnly cookies with family reuse detection and Argon2id password verification.
            </p>
          </Card>
        </div>

        <Card elevated className="p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1">Sign In</h1>
            <p className="text-sm text-ink-secondary">Enter your credentials to continue.</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-danger-soft border border-danger-border text-danger text-xs font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="space-y-1">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 bottom-2.5 p-1 text-ink-secondary hover:text-ink rounded"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? (
                'Signing in...'
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {showDemoQuickFill && (
            <div className="mt-6 pt-5 border-t border-edge">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-2.5">
                Demo Mode Quick-Fill Accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => quickFillDemo('user@breatheiq.org')}
                  className="text-xs px-2.5 py-2 rounded-lg bg-brand-mint hover:bg-[#CCFBF1] text-brand font-semibold transition"
                >
                  Demo User
                </button>
                <button
                  type="button"
                  onClick={() => quickFillDemo('moderator@breatheiq.org')}
                  className="text-xs px-2.5 py-2 rounded-lg bg-[#F1F5F9] hover:bg-edge text-ink font-semibold transition"
                >
                  Moderator
                </button>
                <button
                  type="button"
                  onClick={() => quickFillDemo('admin@breatheiq.org')}
                  className="text-xs px-2.5 py-2 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-semibold transition"
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AuthFormShell>
  );
};
