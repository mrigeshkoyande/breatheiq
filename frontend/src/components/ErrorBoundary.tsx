import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAF7] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-[#DC5252] mx-auto" aria-hidden="true" />
            <h1 className="text-xl font-bold text-[#182A29]">Something went wrong</h1>
            <p className="text-sm text-[#475569]">{this.state.errorMessage}</p>
            <Button type="button" onClick={() => window.location.reload()} className="mx-auto">
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
