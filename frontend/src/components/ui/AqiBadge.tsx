import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from './Button';
import { CpcbCategory, getNaqiTheme } from '../../utils/calculations';

export type { CpcbCategory };
export const getCpcbColor = getNaqiTheme;

export interface AqiBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  aqi: number;
  category: CpcbCategory;
  showAqi?: boolean;
}

const CategoryIcon: React.FC<{ category: CpcbCategory }> = ({ category }) => {
  const cls = 'w-3.5 h-3.5 shrink-0';
  if (category === 'Good' || category === 'Satisfactory') {
    return <CheckCircle2 className={cls} aria-hidden="true" />;
  }
  if (category === 'Moderate') {
    return <Info className={cls} aria-hidden="true" />;
  }
  if (category === 'Poor') {
    return <AlertTriangle className={cls} aria-hidden="true" />;
  }
  if (category === 'Very Poor') {
    return <AlertCircle className={cls} aria-hidden="true" />;
  }
  return <ShieldAlert className={cls} aria-hidden="true" />;
};

export const AqiBadge: React.FC<AqiBadgeProps> = ({
  aqi,
  category,
  showAqi = true,
  className,
  ...props
}) => {
  const colors = getNaqiTheme(category);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-wide',
        colors.lightBg,
        colors.text,
        colors.border,
        className
      )}
      {...props}
    >
      <CategoryIcon category={category} />
      <span>{category}</span>
      {showAqi && <span className="font-semibold">({aqi} AQI)</span>}
    </div>
  );
};
