import React from 'react';

interface CorridorSelectorHeaderProps {
  title: string;
  disclaimer: string;
  corridorLabel: string;
  cities: string[];
  activeCity: string;
  onSelectCity: (city: string) => void;
}

/** Command-center header displaying page title, medical disclaimer, and city switcher pills. */
export const CorridorSelectorHeader: React.FC<CorridorSelectorHeaderProps> = ({
  title,
  disclaimer,
  corridorLabel,
  cities,
  activeCity,
  onSelectCity,
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm text-[#475569] mt-0.5">{disclaimer}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={corridorLabel}>
      {cities.map((cityName) => (
        <button
          key={cityName}
          type="button"
          aria-pressed={activeCity.toLowerCase() === cityName.toLowerCase()}
          onClick={() => onSelectCity(cityName)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
            activeCity.toLowerCase() === cityName.toLowerCase()
              ? 'bg-[#0F766E] text-white border-[#0F766E]'
              : 'bg-white text-[#334155] border-[#CBD5E1] hover:border-[#0F766E]'
          }`}
        >
          {cityName}
        </button>
      ))}
    </div>
  </div>
);
