import React, { useState } from 'react';
import { Compass, Search } from 'lucide-react';
import { useAirQualityForecast, useCities, useCurrentAirQuality } from '../api/hooks';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';
import { ExploreTelemetryGrid } from '../components/explore/ExploreTelemetryGrid';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

/** Public urban air quality corridor explorer with 24-hour pollutant and meteorology outlook. */
export const ExplorePage: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: cities = [] } = useCities();
  const {
    data: currentAir,
    isLoading: airLoading,
    error: airError,
    refetch: refetchAir,
  } = useCurrentAirQuality(selectedCity);

  const activeLat = currentAir?.latitude ?? 19.076;
  const activeLon = currentAir?.longitude ?? 72.8777;
  const { data: forecast = [] } = useAirQualityForecast(activeLat, activeLon, 24);

  const filteredCities = cities.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <PublicHeader />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">
              <Compass className="w-4 h-4" aria-hidden="true" />
              Metropolitan Air Explorer
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Indian Urban Air Quality Corridors
            </h1>
            <p className="text-sm text-[#475569] mt-1">
              Inspect CPCB NAQI sub-indices, raw pollutant concentrations, and 24-hour forecasts.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <label htmlFor="city-search" className="sr-only">
              Search monitoring cities
            </label>
            <Search className="w-4 h-4 text-[#475569] absolute left-3 top-3" aria-hidden="true" />
            <input
              id="city-search"
              type="text"
              placeholder="Filter city or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Select city corridor">
          {filteredCities.map((c) => (
            <button
              key={c.city}
              type="button"
              aria-pressed={selectedCity.toLowerCase() === c.city.toLowerCase()}
              onClick={() => setSelectedCity(c.city)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectedCity.toLowerCase() === c.city.toLowerCase()
                  ? 'bg-[#0F766E] text-white border-[#0F766E]'
                  : 'bg-white text-[#182A29] border-[#CBD5E1] hover:border-[#0F766E]'
              }`}
            >
              {c.city}
            </button>
          ))}
        </div>

        {airLoading && <LoadingSkeleton lines={4} label="Fetching metropolitan air telemetry..." />}
        {airError && (
          <ErrorBanner
            message={
              airError instanceof Error ? airError.message : 'Unable to fetch city telemetry.'
            }
            onRetry={() => void refetchAir()}
          />
        )}

        {currentAir && !airLoading && (
          <ExploreTelemetryGrid currentAir={currentAir} forecast={forecast} />
        )}
      </main>
    </div>
  );
};
