import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LANDING_CAPABILITIES } from '../../config/capabilities';
import { Card } from '../ui/Card';

type AudienceKey = 'families' | 'seniors' | 'commuters';

const AUDIENCE_DETAILS: Record<AudienceKey, { title: string; points: string[] }> = {
  families: {
    title: 'Parents & Young Children',
    points: [
      'Higher respiratory sensitivity weights for infants and school-age children.',
      'Bedroom CADR purifier sizing with 60-minute single-zone decay curves.',
      'Morning school-bus vs indoor shift recommendations before thermal inversions lift.',
    ],
  },
  seniors: {
    title: 'Seniors & Respiratory Conditions',
    points: [
      'Configurable SmogShield threshold alerts with quiet-hour respect.',
      'Grounded Copilot advice carrying explicit CPCB/WHO non-medical disclaimers.',
      'Room-by-room ventilation vs window-sealing guidance.',
    ],
  },
  commuters: {
    title: 'Daily Urban Commuters',
    points: [
      'Side-by-side inhaled PM2.5 dosage estimates across Metro, Green Corridor, and Highway.',
      'ARAI/DMRC-sourced tailpipe carbon comparisons per trip.',
      'Twilight rush-hour plume warnings verified from community reports.',
    ],
  },
};

export const BentoCapabilitiesSection: React.FC = () => {
  const [audienceTab, setAudienceTab] = useState<AudienceKey>('families');

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Built Around Actionable Urban Air Defense
          </h2>
          <p className="text-sm text-[#475569] mt-2">
            Every capability maps deterministic calculation engines to daily household habits.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LANDING_CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.title} className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-base">{cap.title}</h3>
                <p className="text-sm text-[#475569]">{cap.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Tailored Protection Profiles</h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Audience protection tabs">
            {(Object.keys(AUDIENCE_DETAILS) as AudienceKey[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={audienceTab === key}
                onClick={() => setAudienceTab(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize border transition-colors ${
                  audienceTab === key
                    ? 'bg-[#0F766E] text-white border-[#0F766E]'
                    : 'bg-white text-[#334155] border-[#CBD5E1]'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel" className="space-y-2">
          <h3 className="font-bold text-[#0F766E]">{AUDIENCE_DETAILS[audienceTab].title}</h3>
          <ul className="grid sm:grid-cols-3 gap-3 text-sm text-[#475569]">
            {AUDIENCE_DETAILS[audienceTab].points.map((pt) => (
              <li key={pt} className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <footer className="border-t border-[#E2E8F0] pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569]">
        <div>
          <strong>BreatheIQ</strong> · CPCB NAQI & Open-Meteo / OpenAQ Provenance · Guidance only, not medical advice.
        </div>
        <div className="flex items-center gap-5 font-medium">
          <Link to="/explore" className="hover:text-[#0F766E]">
            Explore Cities
          </Link>
          <Link to="/methodology" className="hover:text-[#0F766E]">
            CPCB Methodology
          </Link>
          <Link to="/privacy" className="hover:text-[#0F766E]">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </section>
  );
};
