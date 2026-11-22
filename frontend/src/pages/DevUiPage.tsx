import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge, SourceBadgeType } from '../components/ui/Badge';
import { AqiBadge, CpcbCategory } from '../components/ui/AqiBadge';
import { Input } from '../components/ui/Input';

export const DevUiPage: React.FC = () => {
  const badgeTypes: SourceBadgeType[] = ['LIVE', 'MODELED', 'FORECAST', 'ESTIMATED', 'USER-REPORTED', 'DEMO'];
  const cpcbCategories: { cat: CpcbCategory; aqi: number }[] = [
    { cat: 'Good', aqi: 35 },
    { cat: 'Satisfactory', aqi: 75 },
    { cat: 'Moderate', aqi: 145 },
    { cat: 'Poor', aqi: 242 },
    { cat: 'Very Poor', aqi: 340 },
    { cat: 'Severe', aqi: 460 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF7] p-8 lg:p-12 space-y-12 max-w-6xl mx-auto">
      <div>
        <h1 className="font-heading font-bold text-3xl text-[#182A29]">
          BreatheIQ Atmospheric Precision — Component Sandbox (/dev/ui)
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Visual verification harness for shared tokens, buttons, cards, CPCB AQI chips, and data attribution badges.
        </p>
      </div>

      {/* Buttons */}
      <Card className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#182A29]">Buttons & Actions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Mint</Button>
          <Button variant="outline">Outline Border</Button>
          <Button variant="ghost">Ghost Action</Button>
          <Button variant="danger">Emergency Alert</Button>
          <Button variant="primary" disabled>Disabled State</Button>
        </div>
      </Card>

      {/* CPCB Scale */}
      <Card className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#182A29]">Official CPCB NAQI Categories</h2>
        <div className="flex flex-wrap items-center gap-3">
          {cpcbCategories.map(({ cat, aqi }) => (
            <AqiBadge key={cat} category={cat} aqi={aqi} />
          ))}
        </div>
      </Card>

      {/* Data Source Provenance Badges */}
      <Card className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#182A29]">Data Source & Telemetry Provenance Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          {badgeTypes.map((type) => (
            <Badge key={type} badgeType={type} />
          ))}
        </div>
      </Card>

      {/* Form Controls */}
      <Card className="space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#182A29]">Form Inputs & States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Station Name" placeholder="e.g., Andheri West CPCB" />
          <Input label="With Validation Error" error="Station telemetry offline" value="Invalid ID" readOnly />
        </div>
      </Card>
    </div>
  );
};
