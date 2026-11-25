import React, { useState } from 'react';
import { calculateInhaledDosageUg, calculateTransitSavings } from '../../utils/calculations';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const WhatIfSimulatorSection: React.FC = () => {
  const [metroDays, setMetroDays] = useState(4);
  const [purifierHours, setPurifierHours] = useState(10);
  const [commuteKm, setCommuteKm] = useState(14);

  const weeklySavings = calculateTransitSavings(commuteKm * metroDays * 2, 'car_ice', 'metro');
  const dailyDosageSaved =
    calculateInhaledDosageUg(160, purifierHours, 'resting') -
    calculateInhaledDosageUg(25, purifierHours, 'resting');

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <Card elevated className="p-6 sm:p-8 grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Interactive Winter Impact Simulator
            </h2>
            <Badge badgeType="ESTIMATED" />
          </div>
          <p className="text-sm text-[#475569]">
            Preview estimated weekly vehicular CO2 avoided (ARAI/CPCB baseline) and daily inhaled
            PM2.5 reduction using sourced USEPA ventilation factors.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="sim-metro" className="flex justify-between text-xs font-bold mb-1">
                <span>Metro Commute Days / Week</span>
                <span className="text-[#0F766E]">{metroDays} days</span>
              </label>
              <input
                id="sim-metro"
                type="range"
                min={0}
                max={7}
                value={metroDays}
                onChange={(e) => setMetroDays(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>

            <div>
              <label htmlFor="sim-km" className="flex justify-between text-xs font-bold mb-1">
                <span>One-Way Distance</span>
                <span className="text-[#0F766E]">{commuteKm} km</span>
              </label>
              <input
                id="sim-km"
                type="range"
                min={2}
                max={40}
                value={commuteKm}
                onChange={(e) => setCommuteKm(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>

            <div>
              <label htmlFor="sim-purifier" className="flex justify-between text-xs font-bold mb-1">
                <span>HEPA Filtration Hours / Day</span>
                <span className="text-[#0F766E]">{purifierHours} hrs</span>
              </label>
              <input
                id="sim-purifier"
                type="range"
                min={0}
                max={24}
                value={purifierHours}
                onChange={(e) => setPurifierHours(Number(e.target.value))}
                className="w-full accent-[#0F766E]"
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#DDF5EC]/50 border border-[#A7E8C6]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Weekly CO2 Avoided
            </div>
            <div className="text-3xl font-extrabold mt-2">
              {(weeklySavings.co2SavingsG / 1000).toFixed(2)} kg
            </div>
            <p className="text-xs text-[#475569] mt-1">Compared vs solo petrol car (180 g/km)</p>
          </div>
          <div className="p-5 rounded-2xl bg-[#FEF8E7] border border-[#FCE28E]">
            <div className="text-xs font-bold uppercase tracking-wider text-[#92400E]">
              Daily PM2.5 Intake Saved
            </div>
            <div className="text-3xl font-extrabold mt-2">{Math.round(dailyDosageSaved)} µg</div>
            <p className="text-xs text-[#475569] mt-1">At 0.50 m³/h adult resting minute volume</p>
          </div>
        </div>
      </Card>
    </section>
  );
};
