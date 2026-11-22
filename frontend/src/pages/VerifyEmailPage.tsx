import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { apiRequest } from '../services/api';
import { CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);

    try {
      await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setVerified(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed. The token may be expired or invalid.');
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
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-elevated p-8 lg:p-10 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center mx-auto shadow-sm">
            <Mail className="w-7 h-7" />
          </div>

          <div>
            <h1 className="font-heading font-bold text-2xl text-[#182A29]">
              Verify Your Email
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Confirm your email to unlock all community and alert capabilities.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-[#FDECEC] border border-[#F4A8A8] rounded-xl flex items-center gap-2.5 text-xs text-[#DC5252] font-medium text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {verified ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#EBF7F0] border border-[#A3E5BA] rounded-xl flex items-center justify-center gap-3 text-xs text-[#2F9E62]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Your email address has been verified!</span>
              </div>
              <Button onClick={() => navigate('/login')} className="w-full">
                Proceed to Dashboard
              </Button>
            </div>
          ) : (
            <Button onClick={handleVerify} className="w-full" size="lg" disabled={loading || !token}>
              {loading ? 'Verifying...' : 'Confirm Email Address'}
            </Button>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-[#64748B]">
        BreatheIQ &copy; 2026.
      </footer>
    </div>
  );
};
