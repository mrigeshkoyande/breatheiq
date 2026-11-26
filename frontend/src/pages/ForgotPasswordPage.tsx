import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { apiRequest } from '../services/api';
import { Button, buttonStyles } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AuthFormShell } from '../components/layout/AuthFormShell';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    setLoading(true);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormShell
      headerAction={
        <Link
          to="/login"
          className="text-sm font-medium text-ink-secondary hover:text-brand flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Sign In
        </Link>
      }
    >
      <Card elevated className="max-w-md w-full p-8">
        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-brand-emerald mx-auto" aria-hidden="true" />
            <h1 className="text-2xl font-bold">Check Recovery Status</h1>
            <p className="text-sm text-ink-secondary">
              If an account is registered for <strong>{email}</strong>, a single-use signed reset
              token has been generated.
            </p>
            <div className="pt-2">
              <Link to="/login" className={buttonStyles({ className: 'w-full' })}>
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Forgot Password</h1>
              <p className="text-sm text-ink-secondary mt-1">
                Enter your registered email to request a single-use recovery token.
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
                label="Registered Email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading} className="w-full h-11">
                <Mail className="w-4 h-4" aria-hidden="true" />
                {loading ? 'Sending request...' : 'Request Reset Instructions'}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </AuthFormShell>
  );
};
