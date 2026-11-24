import React, { forwardRef } from 'react';
import { cn } from './Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, name, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || name || generatedId;
    const inputName = name || inputId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[#3E4947]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          name={inputName}
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm text-[#182A29] placeholder-[#94A3B8] transition-all',
            'focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20',
            error && 'border-[#DC5252] focus:border-[#DC5252] focus:ring-[#DC5252]/20',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#DC5252] font-medium">{error}</span>}
        {!error && helperText && <span className="text-xs text-[#64748B]">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
