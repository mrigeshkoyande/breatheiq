import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <div
    role="alert"
    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-danger-soft border border-danger-border text-[#991B1B] px-4 py-3 rounded-xl text-sm"
  >
    <div className="flex items-center gap-2.5">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
    {onRetry && (
      <Button type="button" size="sm" variant="outline" onClick={onRetry} className="shrink-0">
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        Retry
      </Button>
    )}
  </div>
);

export const LoadingSkeleton: React.FC<{ lines?: number; label?: string }> = ({
  lines = 3,
  label = 'Loading atmospheric telemetry...',
}) => (
  <div role="status" aria-live="polite" className="space-y-3 py-6">
    <span className="sr-only">{label}</span>
    {Array.from({ length: lines }).map((_, idx) => (
      <div
        key={idx}
        className="h-5 bg-[#E2E8F0] rounded-lg animate-pulse motion-reduce:animate-none"
        style={{ width: `${92 - idx * 12}%` }}
      />
    ))}
  </div>
);
