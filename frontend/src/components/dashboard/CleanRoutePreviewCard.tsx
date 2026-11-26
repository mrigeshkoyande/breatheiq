import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, ShieldAlert } from 'lucide-react';
import { CleanRouteResponse } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button, buttonStyles } from '../ui/Button';
import { Card } from '../ui/Card';

interface CleanRoutePreviewCardProps {
  title: string;
  activeCity: string;
  medicalDisclaimer: string;
  data?: CleanRouteResponse;
  isPending: boolean;
  onCompute: () => void;
}

/** Interactive dashboard widget comparing commute exposure dosages for the active city. */
export const CleanRoutePreviewCard: React.FC<CleanRoutePreviewCardProps> = ({
  title,
  activeCity,
  medicalDisclaimer,
  data,
  isPending,
  onCompute,
}) => (
  <Card className="lg:col-span-5 space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 font-bold">
        <Navigation className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <Badge badgeType={data?.source || 'ESTIMATED'} />
    </div>

    {!data ? (
      <div className="space-y-3">
        <p className="text-sm text-[#475569]">
          Compare inhaled PM2.5 dosage and tailpipe CO2 for a 14 km commute in{' '}
          <strong>{activeCity}</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={isPending} onClick={onCompute}>
            {isPending ? 'Computing Routes...' : 'Compute Live Corridor Options'}
          </Button>
          <Link to="/app/routes" className={buttonStyles({ size: 'sm', variant: 'outline' })}>
            Open Route Planner
          </Link>
        </div>
      </div>
    ) : (
      <div className="space-y-2.5">
        {data.routes.map((route) => (
          <div
            key={route.id}
            className={`p-3 rounded-xl border text-xs ${
              route.recommended ? 'bg-[#EBF7F0] border-[#A3E5BA]' : 'bg-[#F8FAF7] border-[#E2E8F0]'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{route.name}</span>
              <span>{route.inhaled_dose_ug} µg dose</span>
            </div>
            <div className="text-[#475569] mt-0.5">
              {route.travel_time_min} min · {route.average_pm25} µg/m³ · {route.co2_emissions_kg} kg
              CO2
            </div>
          </div>
        ))}
        <div className="pt-1">
          <Link
            to="/app/routes"
            className={buttonStyles({ variant: 'outline', size: 'sm', className: 'w-full' })}
          >
            Customize Origin & Destination
          </Link>
        </div>
      </div>
    )}

    <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2 text-[11px] text-[#475569]">
      <ShieldAlert className="w-3.5 h-3.5 text-[#0F766E] shrink-0" aria-hidden="true" />
      <span>{medicalDisclaimer}</span>
    </div>
  </Card>
);
