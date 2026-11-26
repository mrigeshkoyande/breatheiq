import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CityCorridorStepProps {
  availableCities: string[];
  selectedCity: string;
  neighborhood: string;
  onSelectCity: (city: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onNext: () => void;
}

/** Step 1 panel for selecting a monitored city corridor and neighborhood. */
export const CityCorridorStep: React.FC<CityCorridorStepProps> = ({
  availableCities,
  selectedCity,
  neighborhood,
  onSelectCity,
  onNeighborhoodChange,
  onNext,
}) => (
  <div className="space-y-5">
    <div className="flex items-center gap-2.5 text-brand font-bold">
      <MapPin className="w-5 h-5" aria-hidden="true" />
      <h2>Step 1 · Select Urban Monitoring Corridor</h2>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {availableCities.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={selectedCity === c}
          onClick={() => onSelectCity(c)}
          className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            selectedCity === c
              ? 'bg-brand-mint border-brand text-brand'
              : 'bg-white border-edge-strong text-ink-strong hover:border-brand'
          }`}
        >
          {c}
        </button>
      ))}
    </div>

    <Input
      label="Neighborhood / Locality"
      value={neighborhood}
      onChange={(e) => onNeighborhoodChange(e.target.value)}
      placeholder="e.g. Andheri West, Rohini, Indiranagar"
      required
    />

    <div className="flex justify-end pt-2">
      <Button type="button" onClick={onNext}>
        Next: Family AirTwin
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Button>
    </div>
  </div>
);
