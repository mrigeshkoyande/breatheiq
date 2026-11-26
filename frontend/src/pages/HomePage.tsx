import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fan, Home, Plus, ShieldAlert, Wind } from 'lucide-react';
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
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

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

  return (
    <AppShell title="Indoor Air & Purifier Oracle">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Home className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Indoor Air & CADR Purifier Sizing
            </h1>
            <p className="text-sm text-[#475569]">
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
          <Card className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
                Window Oracle Status
              </h2>
              <Badge badgeType={oracle?.is_forecast_driven ? 'FORECAST' : 'ESTIMATED'} />
            </div>
            <p className="text-sm text-[#334155]">
              Best window:{' '}
              <strong>
                {oracle?.best_window_start || '12:00'} - {oracle?.best_window_end || '15:00'}
              </strong>{' '}
              ({oracle?.current_action || 'PURIFY'})
            </p>
            <h3 className="font-bold text-sm pt-2 border-t border-[#E2E8F0]">Registered Rooms</h3>
            {isLoading ? (
              <LoadingSkeleton lines={3} label="Loading rooms..." />
            ) : (
              <div className="space-y-2">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#182A29]">{r.name}</div>
                      <div className="text-[#475569]">
                        {r.length_m}m x {r.width_m}m x {r.height_m}m
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLengthM(String(r.length_m));
                        setWidthM(String(r.width_m));
                        setHeightM(String(r.height_m));
                      }}
                    >
                      Size CADR
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roomName.trim()) return;
                setActionError('');
                addRoomMutation.mutate();
              }}
              className="flex gap-2 pt-2"
            >
              <Input
                aria-label="New room name"
                placeholder="Add room (e.g. Kids Study)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
              <Button type="submit" size="md" disabled={addRoomMutation.isPending}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Save
              </Button>
            </form>
          </Card>

          <Card elevated className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Fan className="w-5 h-5 text-[#0F766E]" aria-hidden="true" />
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

            {sizingResult && (
              <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#EBF7F0] border border-[#A3E5BA]">
                    <div className="text-xs font-bold text-[#0F766E]">Required CADR</div>
                    <div className="text-xl font-extrabold">
                      {sizingResult.required_cadr_m3h} m³/h
                    </div>
                    <div className="text-[11px] text-[#475569]">
                      {sizingResult.required_cadr_cfm} CFM
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-[#475569]">50% Reduction</div>
                    <div className="text-xl font-extrabold">
                      {sizingResult.time_to_50pct_min} min
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
                    <div className="text-xs font-bold text-[#475569]">80% Reduction</div>
                    <div className="text-xl font-extrabold">
                      {sizingResult.time_to_80pct_min} min
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#334155]">
                  <strong>Device Class:</strong> {sizingResult.recommended_device_class}
                </p>
                <div className="flex items-start gap-2 text-xs text-[#475569]">
                  <ShieldAlert
                    className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{sizingResult.limitations}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};
