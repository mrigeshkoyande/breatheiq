import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE_BUTTON_STYLES =
  'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand hover:bg-[#115E59] text-white focus:ring-[#0F766E]',
  secondary: 'bg-brand-mint hover:bg-[#CCFBF1] text-brand focus:ring-[#0F766E]',
  outline:
    'bg-white border border-edge hover:bg-canvas hover:border-[#CCFBF1] text-ink focus:ring-[#0F766E]',
  ghost: 'bg-transparent hover:bg-canvas text-ink focus:ring-[#0F766E]',
  danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white focus:ring-[#B91C1C]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
  md: 'text-sm px-4 py-2.5 h-10 gap-2',
  lg: 'text-base px-6 py-3.5 h-12 gap-2.5 font-semibold',
};

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE_BUTTON_STYLES, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonStyles({ variant, size, className })}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
