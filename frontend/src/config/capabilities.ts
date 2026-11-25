import type { LucideIcon } from 'lucide-react';
import { Bot, CalendarCheck, Home, Leaf, Navigation, Users } from 'lucide-react';

export interface CapabilityItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export const LANDING_CAPABILITIES: CapabilityItem[] = [
  {
    icon: CalendarCheck,
    title: 'Adaptive Daily Routine',
    desc: 'Shifts exercise and errands out of morning/twilight inversion spikes.',
  },
  {
    icon: Home,
    title: 'Window Oracle & CADR',
    desc: 'Forecast-scored cross-ventilation slots and True HEPA sizing.',
  },
  {
    icon: Navigation,
    title: 'CleanRoute Navigator',
    desc: 'Compares arterial exhaust exposure vs Metro and green corridors.',
  },
  {
    icon: Users,
    title: 'Family AirTwin',
    desc: 'Age and respiratory vulnerability scoring (5-100 scale).',
  },
  {
    icon: Leaf,
    title: 'Personal Impact Ledger',
    desc: 'Tracks averted PM2.5 micrograms and commute CO2 savings.',
  },
  {
    icon: Bot,
    title: 'Grounded Gemini Copilot',
    desc: 'Validated responses citing retrieved NAQI telemetry and sources.',
  },
];
