import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface HazardReportFormProps {
  reportType: string;
  severity: string;
  locationName: string;
  description: string;
  isSubmitting: boolean;
  onTypeChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
}

/** Form card for submitting new user-reported neighborhood smog hazards. */
export const HazardReportForm: React.FC<HazardReportFormProps> = ({
  reportType,
  severity,
  locationName,
  description,
  isSubmitting,
  onTypeChange,
  onSeverityChange,
  onLocationChange,
  onDescriptionChange,
  onSubmit,
}) => (
  <Card className="lg:col-span-4 space-y-4 h-fit">
    <h2 className="font-bold text-lg">Report Local Hazard</h2>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (locationName.trim()) onSubmit();
      }}
      className="space-y-3"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comm-type" className="text-xs font-semibold uppercase text-[#334155]">
          Hazard Type
        </label>
        <select
          id="comm-type"
          value={reportType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm"
        >
          <option value="construction_dust">Construction Dust</option>
          <option value="garbage_burning">Garbage Burning</option>
          <option value="traffic_congestion">Diesel Traffic Plume</option>
          <option value="industrial_plume">Industrial Emission</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comm-sev" className="text-xs font-semibold uppercase text-[#334155]">
          Severity
        </label>
        <select
          id="comm-sev"
          value={severity}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm"
        >
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
          <option value="hazardous">Hazardous</option>
        </select>
      </div>
      <Input
        label="Corridor / Junction"
        placeholder="e.g. Link Road & SV Road"
        value={locationName}
        onChange={(e) => onLocationChange(e.target.value)}
        required
      />
      <Input
        label="Observation Note"
        placeholder="Visible smoke or dust plume"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        <Plus className="w-4 h-4" aria-hidden="true" />
        {isSubmitting ? 'Submitting...' : 'Submit Citizen Report'}
      </Button>
    </form>
  </Card>
);
