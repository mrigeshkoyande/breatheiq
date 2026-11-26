import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AuthFormShell } from '../components/layout/AuthFormShell';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim(), new_password: newPassword }),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormShell
      headerAction={
        <Link to="/login" className="text-sm font-medium text-ink-secondary hover:text-brand">
          Sign In
        </Link>
      }
    >
      <Card elevated className="max-w-md w-full p-8">
        {done ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-brand-emerald mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold">Password Updated</h1>
            <p className="text-sm text-ink-secondary">
              Your password has been updated and active sessions have been revoked.
            </p>
            <Button type="button" onClick={() => navigate('/login')} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
              <p className="text-sm text-ink-secondary mt-1">
                Paste your single-use recovery token and choose a new password.
              </p>
            </div>
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-danger-soft border border-danger-border text-danger text-xs font-medium"
              >
                {error}
              </div>
            )}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <Input
                label="Reset Token"
                autoComplete="one-time-code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJ..."
                required
              />
              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="w-full h-11">
                <KeyRound className="w-4 h-4" aria-hidden="true" />
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </AuthFormShell>
  );
};
