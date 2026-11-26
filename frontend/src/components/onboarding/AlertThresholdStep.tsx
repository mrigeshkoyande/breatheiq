import React from 'react';
import { ArrowLeft, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

interface AlertThresholdStepProps {
  aqiThreshold: number;
  enablePush: boolean;
  saving: boolean;
  onThresholdChange: (value: number) => void;
  onEnablePushChange: (enabled: boolean) => void;
  onBack: () => void;
  onComplete: () => void;
}

/** Step 3 panel for configuring SmogShield alert thresholds during onboarding. */
export const AlertThresholdStep: React.FC<AlertThresholdStepProps> = ({
  aqiThreshold,
  enablePush,
  saving,
  onThresholdChange,
  onEnablePushChange,
  onBack,
  onComplete,
}) => (
  <div className="space-y-5">
    <div className="flex items-center gap-2.5 text-brand font-bold">
      <Bell className="w-5 h-5" aria-hidden="true" />
      <h2>Step 3 · SmogShield Alert Threshold</h2>
    </div>

    <div className="space-y-2">
      <label htmlFor="onb-threshold" className="flex justify-between text-sm font-semibold">
        <span>Trigger High-Priority Smog Alert At</span>
        <span className="text-brand">{aqiThreshold} NAQI</span>
      </label>
      <input
        id="onb-threshold"
        type="range"
        min={100}
        max={400}
        step={25}
        value={aqiThreshold}
        onChange={(e) => onThresholdChange(Number(e.target.value))}
        className="w-full accent-[#0F766E]"
      />
      <div className="flex justify-between text-xs text-ink-secondary">
        <span>100 (Moderate)</span>
        <span>200 (Poor)</span>
        <span>300+ (Very Poor / Severe)</span>
      </div>
    </div>

    <label className="flex items-center gap-3 p-3.5 rounded-xl border border-edge cursor-pointer">
      <input
        type="checkbox"
        checked={enablePush}
        onChange={(e) => onEnablePushChange(e.target.checked)}
        className="w-4 h-4 accent-[#0F766E]"
      />
      <span className="text-sm font-medium">
        Enable browser & in-app smog surge alerts (quiet hours 22:00 - 07:00)
      </span>
    </label>

    <div className="p-3 rounded-xl bg-canvas border border-edge text-xs text-ink-secondary flex items-center gap-2">
      <ShieldAlert className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
      <span>Public health guidance only — not medical advice.</span>
    </div>

    <div className="flex items-center justify-between pt-2">
      <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back
      </Button>
      <Button type="button" onClick={onComplete} disabled={saving}>
        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
        {saving ? 'Saving Household...' : 'Finish & Open Dashboard'}
      </Button>
    </div>
  </div>
);
