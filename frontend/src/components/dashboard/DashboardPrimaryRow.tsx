import React from 'react';
import { AirDataPayload, WindowOracleOutput } from '../../types/api';
import { Card } from '../ui/Card';
import { LoadingSkeleton } from '../ui/StatusBanner';
import { CorridorTelemetryCard } from './CorridorTelemetryCard';
import { WindowOracleWidget } from './WindowOracleWidget';

interface DashboardPrimaryRowProps {
  airLoading: boolean;
  airData?: AirDataPayload;
  neighborhood?: string;
  oracleLoading: boolean;
  oracleData?: WindowOracleOutput;
  oracleTitle: string;
}

/** Primary command center row pairing live corridor telemetry with the hourly Window Oracle. */
export const DashboardPrimaryRow: React.FC<DashboardPrimaryRowProps> = ({
  airLoading,
  airData,
  neighborhood,
  oracleLoading,
  oracleData,
  oracleTitle,
}) => (
  <div className="grid lg:grid-cols-12 gap-6">
    <div className="lg:col-span-7">
      {airLoading || !airData ? (
        <Card>
          <LoadingSkeleton lines={4} label="Loading corridor telemetry..." />
        </Card>
      ) : (
        <CorridorTelemetryCard airData={airData} neighborhood={neighborhood} />
      )}
    </div>
    <div className="lg:col-span-5">
      {oracleLoading || !oracleData ? (
        <Card>
          <LoadingSkeleton lines={4} label="Loading Window Oracle..." />
        </Card>
      ) : (
        <WindowOracleWidget title={oracleTitle} oracle={oracleData} />
      )}
    </div>
  </div>
);
