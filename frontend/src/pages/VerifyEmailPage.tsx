import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SkipLink } from '../components/layout/SkipLink';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token was provided in the link.');
        return;
      }
      try {
        await apiRequest('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('success');
        setMessage('Email verified successfully. Your account is now confirmed.');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification link is invalid or expired.');
      }
    };
    void verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <header className="h-16 px-6 lg:px-12 flex items-center justify-between border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
        </Link>
        <Link to="/login" className="text-sm font-semibold text-[#0F766E]">
          Sign In
        </Link>
      </header>

      <main id="main-content" className="flex-1 flex items-center justify-center p-4">
        <Card elevated className="max-w-md w-full p-8 text-center space-y-5">
          {status === 'loading' && (
            <div className="space-y-3" role="status" aria-live="polite">
              <MailCheck
                className="w-12 h-12 text-[#0F766E] mx-auto animate-pulse motion-reduce:animate-none"
                aria-hidden="true"
              />
              <h1 className="text-xl font-bold">Verifying Email</h1>
              <p className="text-sm text-[#475569]">{message}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#2F9E62] mx-auto" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Email Verified</h1>
              <p className="text-sm text-[#475569]">{message}</p>
              <div className="pt-2">
                <Link to="/app/dashboard" className={buttonStyles({ className: 'w-full' })}>
                  Open Dashboard
                </Link>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="w-12 h-12 text-[#DC5252] mx-auto" aria-hidden="true" />
              <h1 className="text-2xl font-bold">Verification Failed</h1>
              <p className="text-sm text-[#B91C1C]">{message}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className={buttonStyles({ variant: 'outline', className: 'w-full' })}
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
