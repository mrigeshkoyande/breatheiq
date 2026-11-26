import React from 'react';
import { Card } from '../ui/Card';
import { getNaqiTheme, toCpcbCategory } from '../../utils/calculations';

interface NaqiCategoryRow {
  category: string;
  min: number;
  max: number;
}

interface NaqiFormulaCardProps {
  categories?: NaqiCategoryRow[];
}

/** Explains CPCB linear sub-index equation and displays statutory NAQI category thresholds. */
export const NaqiFormulaCard: React.FC<NaqiFormulaCardProps> = ({ categories }) => (
  <Card className="space-y-4">
    <h2 className="text-xl font-bold">Linear Sub-Index Equation</h2>
    <p className="text-sm text-ink-secondary">
      For pollutant concentration <strong>Cₚ</strong> falling in statutory interval{' '}
      <strong>[Bₗₒ, Bₕᵢ]</strong> with index range <strong>[Iₗₒ, Iₕᵢ]</strong>:
    </p>
    <div className="p-4 rounded-xl bg-canvas border border-edge font-mono text-sm">
      Iₚ = ((Iₕᵢ - Iₗₒ) / (Bₕᵢ - Bₗₒ)) × (Cₚ - Bₗₒ) + Iₗₒ
    </div>
    <ul className="text-xs text-ink-secondary space-y-1.5 list-disc pl-5">
      <li>Composite NAQI equals the highest sub-index across monitored pollutants.</li>
      <li>Validity requires at least 3 monitored pollutants including PM2.5 or PM10.</li>
      <li>All numbers displayed are guidance estimates — not clinical medical advice.</li>
    </ul>

    {categories && (
      <div className="pt-2 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
          Statutory CPCB Index Tiers
        </h3>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {categories.map((cat) => {
            const theme = getNaqiTheme(toCpcbCategory(cat.category));
            return (
              <div
                key={cat.category}
                className="p-2.5 rounded-lg border border-edge bg-white flex items-center justify-between"
              >
                <span className={`font-bold flex items-center gap-2 ${theme.text}`}>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${theme.bg}`}
                    aria-hidden="true"
                  />
                  {cat.category}
                </span>
                <span className="text-ink-secondary">
                  {cat.min} - {cat.max > 500 ? '500+' : cat.max}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </Card>
);
