import React from 'react';
import { Link } from 'react-router-dom';
import { AqiBadge } from '../components/ui/AqiBadge';
import { Badge } from '../components/ui/Badge';
import { Button, buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';

export const DevUiPage: React.FC = () => {
  const sampleCategories = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'] as const;
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29]">
      <SkipLink />
      <PublicHeader />
      <main id="main-content" className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">BreatheIQ Design System Primitives</h1>
            <p className="text-sm text-[#475569] mt-1">
              Accessible token reference with dual-channel AQI indicators and provenance badges.
            </p>
          </div>
          <Link to="/" className={buttonStyles({ variant: 'outline', size: 'sm' })}>
            Back Home
          </Link>
        </div>

        <Card className="space-y-4">
          <h2 className="font-bold text-lg">CPCB AQI Badges (Non-Color + Text + Score)</h2>
          <div className="flex flex-wrap gap-3">
            {sampleCategories.map((cat, idx) => (
              <AqiBadge key={cat} aqi={30 + idx * 80} category={cat} />
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-lg">Telemetry Provenance Badges</h2>
          <div className="flex flex-wrap gap-3">
            {(['LIVE', 'MODELED', 'FORECAST', 'ESTIMATED', 'USER-REPORTED', 'DEMO'] as const).map((b) => (
              <Badge key={b} badgeType={b} />
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-bold text-lg">Buttons & Form Controls</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <Input label="Standard Field" placeholder="Enter corridor name" helperText="Example: Andheri West" />
            <Input label="Validation Error" defaultValue="invalid" error="Must be a valid coordinate" />
          </div>
        </Card>
      </main>
    </div>
  );
};
