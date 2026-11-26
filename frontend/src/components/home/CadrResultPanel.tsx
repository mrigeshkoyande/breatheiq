import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { PurifierSizingResult } from '../../types/api';

interface CadrResultPanelProps {
  result: PurifierSizingResult;
}

/** Summarizes required CADR capacity, exponential decay timings, and device recommendations. */
export const CadrResultPanel: React.FC<CadrResultPanelProps> = ({ result }) => (
  <div className="space-y-4 pt-2 border-t border-edge">
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="p-3 rounded-xl bg-[#EBF7F0] border border-[#A3E5BA]">
        <div className="text-xs font-bold text-brand">Required CADR</div>
        <div className="text-xl font-extrabold">{result.required_cadr_m3h} m³/h</div>
        <div className="text-[11px] text-ink-secondary">{result.required_cadr_cfm} CFM</div>
      </div>
      <div className="p-3 rounded-xl bg-canvas border border-edge">
        <div className="text-xs font-bold text-ink-secondary">50% Reduction</div>
        <div className="text-xl font-extrabold">{result.time_to_50pct_min} min</div>
      </div>
      <div className="p-3 rounded-xl bg-canvas border border-edge">
        <div className="text-xs font-bold text-ink-secondary">80% Reduction</div>
        <div className="text-xl font-extrabold">{result.time_to_80pct_min} min</div>
      </div>
    </div>
    <p className="text-xs text-ink-strong">
      <strong>Device Class:</strong> {result.recommended_device_class}
    </p>
    <div className="flex items-start gap-2 text-xs text-ink-secondary">
      <ShieldAlert className="w-4 h-4 text-brand shrink-0 mt-0.5" aria-hidden="true" />
      <span>{result.limitations}</span>
    </div>
  </div>
);
