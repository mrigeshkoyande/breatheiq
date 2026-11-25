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
    const describedById = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          name={inputName}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedById}
          className={cn(
            'w-full bg-white border border-[#CBD5E1] rounded-lg px-4 py-2.5 text-sm text-[#182A29] placeholder-[#64748B] transition-all',
            'focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/25',
            error && 'border-[#DC5252] focus:border-[#DC5252] focus:ring-[#DC5252]/25',
            className
          )}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} role="alert" className="text-xs text-[#B91C1C] font-medium">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-help`} className="text-xs text-[#475569]">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
