import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { WindowOracleOutput } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface WindowOracleWidgetProps {
  title: string;
  oracle: WindowOracleOutput;
}

export const WindowOracleWidget: React.FC<WindowOracleWidgetProps> = ({ title, oracle }) => (
  <Card className="space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 font-bold">
        <Clock className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <Badge badgeType={oracle.is_forecast_driven ? 'FORECAST' : 'ESTIMATED'} />
    </div>

    <div className="p-4 rounded-xl bg-[#EBF7F0] border border-[#A3E5BA] space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold uppercase text-[#0F766E]">
        <span>Best Cross-Ventilation Slot</span>
        <span>Score {oracle.best_window_score}/100</span>
      </div>
      <div className="text-2xl font-extrabold text-[#182A29]">
        {oracle.best_window_start || '12:00'} - {oracle.best_window_end || '15:00'}
      </div>
      <p className="text-xs text-[#334155] leading-relaxed">{oracle.summary_advisory}</p>
    </div>

    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-xs">
      {oracle.hourly_slots.slice(0, 6).map((slot) => (
        <div
          key={slot.hour_iso}
          className="p-2 rounded-lg bg-[#F8FAF7] border border-[#E2E8F0] text-center"
        >
          <div className="text-[#475569] font-medium">{slot.hour_local}</div>
          <div className="font-bold text-[#182A29] mt-0.5">{slot.aeration_score}</div>
          <div className="text-[10px] font-semibold text-[#0F766E] truncate">
            {slot.recommendation.replace('VENTILATE_', 'VENT ')}
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-center gap-2 text-[11px] text-[#475569]">
      <ShieldAlert className="w-3.5 h-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
      <span>{oracle.methodology_note}</span>
    </div>
  </Card>
);
