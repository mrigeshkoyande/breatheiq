import React from 'react';
import { cn } from './Button';

export type CpcbCategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface AqiBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  aqi: number;
  category: CpcbCategory;
  showAqi?: boolean;
}

export const getCpcbColor = (category: CpcbCategory) => {
  switch (category) {
    case 'Good':
      return { bg: 'bg-[#2F9E62]', text: 'text-[#2F9E62]', lightBg: 'bg-[#EBF7F0]', border: 'border-[#A3E5BA]' };
    case 'Satisfactory':
      return { bg: 'bg-[#7CB342]', text: 'text-[#7CB342]', lightBg: 'bg-[#F3F8EC]', border: 'border-[#CCE8A3]' };
    case 'Moderate':
      return { bg: 'bg-[#F2B705]', text: 'text-[#B88700]', lightBg: 'bg-[#FEF8E7]', border: 'border-[#FCE28E]' };
    case 'Poor':
      return { bg: 'bg-[#F28C28]', text: 'text-[#C9660D]', lightBg: 'bg-[#FEF4EB]', border: 'border-[#F9C391]' };
    case 'Very Poor':
      return { bg: 'bg-[#DC5252]', text: 'text-[#DC5252]', lightBg: 'bg-[#FDECEC]', border: 'border-[#F4A8A8]' };
    case 'Severe':
      return { bg: 'bg-[#8B1E3F]', text: 'text-[#8B1E3F]', lightBg: 'bg-[#F6E9EE]', border: 'border-[#CA8AA0]' };
  }
};

export const AqiBadge: React.FC<AqiBadgeProps> = ({ aqi, category, showAqi = true, className, ...props }) => {
  const colors = getCpcbColor(category);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold tracking-wide',
        colors.lightBg,
        colors.text,
        colors.border,
        className
      )}
      {...props}
    >
      <span className={cn('w-2 h-2 rounded-full', colors.bg)} />
      <span>{category}</span>
      {showAqi && <span className="opacity-75 font-semibold">({aqi} AQI)</span>}
    </div>
  );
};
