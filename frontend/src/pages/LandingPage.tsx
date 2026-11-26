import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useCities, useCurrentAirQuality, useWindowOracle } from '../api/hooks';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIfSimulatorSection } from '../components/landing/WhatIfSimulatorSection';
import { BentoCapabilitiesSection } from '../components/landing/BentoCapabilitiesSection';
import { Badge } from '../components/ui/Badge';
import { buttonStyles } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';

/** Public landing page presenting live backend telemetry, Window Oracle preview, and simulator. */
export const LandingPage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  const { data: cities = [] } = useCities();
  const {
    data: airPayload,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useCurrentAirQuality(selectedCity);

  const activeLat = airPayload?.latitude ?? 19.076;
  const activeLon = airPayload?.longitude ?? 72.8777;
  const { data: oracleData } = useWindowOracle(activeLat, activeLon);

  const bestWindowLabel = oracleData?.best_window_start
    ? `${oracleData.best_window_start} - ${oracleData.best_window_end}`
    : '12:00 - 15:00';

  const comparisonRows = [
    {
      gap: 'Static overall index leaves families unsure when to ventilate',
      solution: `Window Oracle identifies safer aeration slots (${bestWindowLabel}) using forecast physics`,
    },
    {
      gap: 'One-size-fits-all alerts ignore infants, children, and seniors',
      solution: 'AirTwin calculates per-member sensitivity weights and room CADR purifier targets',
    },
    {
      gap: 'No visibility into commute inhalation dose or carbon savings',
      solution: 'CleanRoute quantifies Metro vs Arterial PM2.5 exposure and CO2 avoided',
    },
    {
      gap: 'Opaque AI chat responses risk invented pollutant claims',
      solution:
        'Server-side Gemini 2.5 Flash validated against retrieved station & model telemetry',
    },
  ];

  const faqItems = [
    {
      q: 'How does BreatheIQ distinguish LIVE observations from modeled forecasts?',
      a: 'Every card carries a provenance badge (LIVE for OpenAQ ground stations, MODELED for Open-Meteo grid outputs, FORECAST for hourly projections, ESTIMATED for physical calculations, and DEMO when running offline).',
    },
    {
      q: 'Does BreatheIQ replace medical consultation for asthma or respiratory symptoms?',
      a: 'No. Guidance reflects public advisories published by CPCB and WHO for daily activity planning only — never clinical diagnosis or treatment.',
    },
    {
      q: 'How are account passwords and sessions protected?',
      a: 'Passwords use Argon2id hashing; short-lived access JWTs stay strictly in memory while rotating refresh sessions use HttpOnly cookies with reuse detection.',
    },
  ];

  return (
    <div className="min-h-screen text-ink flex flex-col bg-gradient-to-br from-[#EDFAF5] via-[#F8FAF7] to-[#E6F7F5]">
      <SkipLink />
      <PublicHeader />

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {airError && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
            <ErrorBanner
              message={
                airError instanceof Error ? airError.message : 'Unable to load city preview.'
              }
              onRetry={() => void refetchAir()}
            />
          </div>
        )}

        <HeroSection
          cities={cities}
          selectedCity={selectedCity}
          onSelectCity={setSelectedCity}
          airPayload={airPayload}
          isLoading={airLoading}
        />

        {/* Problem vs BreatheIQ Comparison Section */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Why Standard AQI Apps Are Not Enough During Winter Smog
                </h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Translating ambient particulate spikes into specific indoor and commute actions.
                </p>
              </div>
              <Badge badgeType={oracleData?.is_forecast_driven ? 'FORECAST' : 'ESTIMATED'} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {comparisonRows.map((row) => (
                <div
                  key={row.gap}
                  className="p-4 rounded-xl bg-canvas border border-edge space-y-2"
                >
                  <div className="text-xs font-bold uppercase tracking-wider text-danger">
                    Challenge
                  </div>
                  <p className="text-sm text-ink-strong font-medium">{row.gap}</p>
                  <div className="text-xs font-bold uppercase tracking-wider text-brand pt-1">
                    BreatheIQ Response
                  </div>
                  <p className="text-sm text-ink font-semibold">{row.solution}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <WhatIfSimulatorSection />

        {/* FAQ & Advisory Boundary */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="grid md:grid-cols-3 gap-4">
            {faqItems.map((item) => (
              <Card key={item.q} className="space-y-2">
                <h3 className="font-bold text-base text-ink">{item.q}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{item.a}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Card
            elevated
            className="p-6 sm:p-8 bg-brand text-white border-0 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DDF5EC]">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                Challenge 6 · Urban Air Quality Defense
              </div>
              <h2 className="text-2xl font-extrabold">
                Configure Your Family Air Command Center Today
              </h2>
              <p className="text-sm text-[#DDF5EC]">
                Set up local corridor monitoring, bedroom HEPA CADR sizing, and threshold alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link to="/signup" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
                Get Started Free
              </Link>
              <Link
                to="/login"
                className={buttonStyles({
                  variant: 'outline',
                  size: 'lg',
                  className: 'bg-transparent text-white border-white/50 hover:bg-white/10',
                })}
              >
                Sign In
              </Link>
            </div>
          </Card>
        </section>

        <BentoCapabilitiesSection />
      </main>
    </div>
  );
};
