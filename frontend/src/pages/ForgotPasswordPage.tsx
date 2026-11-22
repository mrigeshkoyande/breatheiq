import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiRequest } from '../services/api';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{ message: string; details?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSuccessMessage(res.message + (res.details ? ` (${res.details})` : ''));
    } catch (err: any) {
      setError(err.message || 'Failed to submit password recovery.');
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
        <Link to="/login" className="text-xs font-semibold text-[#0F766E] hover:underline">
          Return to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated p-8 lg:p-10 space-y-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-[#182A29]">
              Reset password
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Enter the email address registered with your BreatheIQ account.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FDECEC] border border-[#F4A8A8] rounded-xl flex items-center gap-2.5 text-xs text-[#DC5252] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EBF7F0] border border-[#A3E5BA] rounded-xl flex items-start gap-3 text-xs text-[#2F9E62]">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Sending link...' : 'Send Recovery Instructions'}
              </Button>
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
