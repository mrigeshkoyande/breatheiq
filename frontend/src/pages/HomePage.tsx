import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fan, Home } from 'lucide-react';
import {
  queryKeys,
  useCurrentAirQuality,
  useHousehold,
  useRooms,
  useWindowOracle,
} from '../api/hooks';
import { apiRequest } from '../services/api';
import { PurifierSizingResult, Room } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { RoomsPanelCard } from '../components/home/RoomsPanelCard';
import { CadrResultPanel } from '../components/home/CadrResultPanel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner } from '../components/ui/StatusBanner';

/** Indoor air defense & HEPA CADR purifier sizing workspace. */
export const HomePage: React.FC = () => {
  const qc = useQueryClient();
  const { data: household } = useHousehold();
  const city = household?.city || 'Mumbai';
  const { data: currentAir } = useCurrentAirQuality(city);
  const { data: rooms = [], isLoading, error, refetch } = useRooms();
  const { data: oracle } = useWindowOracle(
    household?.latitude ?? 19.076,
    household?.longitude ?? 72.8777
  );

  const [roomName, setRoomName] = useState('');
  const [lengthM, setLengthM] = useState('4.5');
  const [widthM, setWidthM] = useState('3.8');
  const [heightM, setHeightM] = useState('2.7');
  const [targetAch, setTargetAch] = useState('5');
  const [sizingResult, setSizingResult] = useState<PurifierSizingResult | null>(null);
  const [actionError, setActionError] = useState('');

  const outdoorPm25 = currentAir?.pm25 ?? 118.0;

  const addRoomMutation = useMutation({
    mutationFn: () =>
      apiRequest<Room>('/user/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: roomName.trim(),
          length_m: Number(lengthM),
          width_m: Number(widthM),
          height_m: Number(heightM),
          has_purifier: false,
          purifier_cadr: 0,
        }),
      }),
    onSuccess: () => {
      setRoomName('');
      void qc.invalidateQueries({ queryKey: queryKeys.rooms });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to save room.');
    },
  });

  const sizingMutation = useMutation({
    mutationFn: () =>
      apiRequest<PurifierSizingResult>('/engines/purifier-size', {
        method: 'POST',
        body: JSON.stringify({
          length_m: Number(lengthM),
          width_m: Number(widthM),
          height_m: Number(heightM),
          target_ach: Number(targetAch),
          initial_pm25: Math.round(outdoorPm25 * 0.75),
          outdoor_pm25: outdoorPm25,
        }),
      }),
    onSuccess: (res) => setSizingResult(res),
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to calculate CADR sizing.');
    },
  });

  const selectRoomForSizing = (room: Room) => {
    setLengthM(String(room.length_m));
    setWidthM(String(room.width_m));
    setHeightM(String(room.height_m));
  };

  return (
    <AppShell title="Indoor Air & Purifier Oracle">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Home className="w-6 h-6 text-brand" aria-hidden="true" />
              Indoor Air & CADR Purifier Sizing
            </h1>
            <p className="text-sm text-ink-secondary">
              Grounded against current {city} ambient PM2.5 ({outdoorPm25} µg/m³).
            </p>
          </div>
          <Badge badgeType={currentAir?.source || 'ESTIMATED'} />
        </div>

        {(error || actionError) && (
          <ErrorBanner
            message={
              actionError || (error instanceof Error ? error.message : 'Failed to load rooms.')
            }
            onRetry={() => void refetch()}
          />
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <RoomsPanelCard
            oracle={oracle}
            rooms={rooms}
            isLoading={isLoading}
            roomName={roomName}
            isSavingRoom={addRoomMutation.isPending}
            onRoomNameChange={setRoomName}
            onSelectRoom={selectRoomForSizing}
            onAddRoom={() => {
              setActionError('');
              addRoomMutation.mutate();
            }}
          />

          <Card elevated className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Fan className="w-5 h-5 text-brand" aria-hidden="true" />
                Single-Zone HEPA CADR Calculator
              </h2>
              <Badge badgeType="ESTIMATED" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActionError('');
                sizingMutation.mutate();
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end"
            >
              <Input
                label="Length (m)"
                type="number"
                step="0.1"
                min="1"
                value={lengthM}
                onChange={(e) => setLengthM(e.target.value)}
              />
              <Input
                label="Width (m)"
                type="number"
                step="0.1"
                min="1"
                value={widthM}
                onChange={(e) => setWidthM(e.target.value)}
              />
              <Input
                label="Height (m)"
                type="number"
                step="0.1"
                min="1.5"
                value={heightM}
                onChange={(e) => setHeightM(e.target.value)}
              />
              <Input
                label="Target ACH"
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={targetAch}
                onChange={(e) => setTargetAch(e.target.value)}
              />
              <div className="col-span-2 sm:col-span-4">
                <Button type="submit" disabled={sizingMutation.isPending} className="w-full">
                  {sizingMutation.isPending
                    ? 'Calculating Decay...'
                    : 'Calculate Required CADR & Decay Curve'}
                </Button>
              </div>
            </form>

            {sizingResult && <CadrResultPanel result={sizingResult} />}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
