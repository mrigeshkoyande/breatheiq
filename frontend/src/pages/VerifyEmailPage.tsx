import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck, XCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import { buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AuthFormShell } from '../components/layout/AuthFormShell';

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
    <AuthFormShell
      headerAction={
        <Link to="/login" className="text-sm font-semibold text-brand">
          Sign In
        </Link>
      }
    >
      <Card elevated className="max-w-md w-full p-8 text-center space-y-5">
        {status === 'loading' && (
          <div className="space-y-3" role="status" aria-live="polite">
            <MailCheck
              className="w-12 h-12 text-brand mx-auto animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
            <h1 className="text-xl font-bold">Verifying Email</h1>
            <p className="text-sm text-ink-secondary">{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-12 h-12 text-brand-emerald mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold">Email Verified</h1>
            <p className="text-sm text-ink-secondary">{message}</p>
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
            <p className="text-sm text-danger">{message}</p>
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
    </AuthFormShell>
  );
};
