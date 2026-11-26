import React from 'react';
import { cn } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, elevated = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white border border-edge rounded-2xl p-6 transition-shadow',
        elevated ? 'shadow-elevated border-[#CCFBF1]' : 'shadow-atmospheric',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
