import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiRequest } from '../services/api';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-between">
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-mark.webp" alt="BreatheIQ Mark" className="w-8 h-8 rounded-lg" />
          <span className="font-heading font-bold text-lg text-[#182A29]">
            Breathe<span className="text-[#0F766E]">IQ</span>
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated p-8 lg:p-10 space-y-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#182A29]">
              Set New Password
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Create a new secure password for your account.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FDECEC] border border-[#F4A8A8] rounded-xl flex items-center gap-2.5 text-xs text-[#DC5252] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EBF7F0] border border-[#A3E5BA] rounded-xl flex items-center gap-3 text-xs text-[#2F9E62]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Password successfully reset. You may now log in.</span>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                required
              />

              <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
                {loading ? 'Updating Password...' : 'Save New Password'}
              </Button>

              {!token && (
                <p className="text-xs text-[#DC5252] text-center">
                  Missing reset token in URL parameters.
                </p>
              )}
            </form>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#64748B]">
        BreatheIQ &copy; 2026.
      </footer>
    </div>
  );
};
