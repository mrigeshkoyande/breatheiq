import React from 'react';
import { cn } from './Button';

export type SourceBadgeType = 'LIVE' | 'MODELED' | 'FORECAST' | 'ESTIMATED' | 'USER-REPORTED' | 'DEMO';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  badgeType: SourceBadgeType;
}

export const Badge: React.FC<BadgeProps> = ({ badgeType, className, ...props }) => {
  const styles = {
    LIVE: 'bg-[#DDF5EC] text-[#0F766E] border-transparent',
    MODELED: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    FORECAST: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    ESTIMATED: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    'USER-REPORTED': 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]',
    DEMO: 'bg-[#F3F4F6] text-[#6B7280] border-[#CBD5E1] border-dashed',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full border',
        styles[badgeType],
        className
      )}
      {...props}
    >
      {badgeType === 'LIVE' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E62] animate-pulse" />
      )}
      {badgeType}
    </span>
  );
};
