import React from 'react';
import { Plus, Wind } from 'lucide-react';
import { Room, WindowOracleOutput } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { LoadingSkeleton } from '../ui/StatusBanner';

interface RoomsPanelCardProps {
  oracle?: WindowOracleOutput;
  rooms: Room[];
  isLoading: boolean;
  roomName: string;
  isSavingRoom: boolean;
  onRoomNameChange: (value: string) => void;
  onSelectRoom: (room: Room) => void;
  onAddRoom: () => void;
}

/** Displays Window Oracle ventilation hours, saved household rooms, and room creation form. */
export const RoomsPanelCard: React.FC<RoomsPanelCardProps> = ({
  oracle,
  rooms,
  isLoading,
  roomName,
  isSavingRoom,
  onRoomNameChange,
  onSelectRoom,
  onAddRoom,
}) => (
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
            <Button type="button" size="sm" variant="outline" onClick={() => onSelectRoom(r)}>
              Size CADR
            </Button>
          </div>
        ))}
      </div>
    )}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (roomName.trim()) onAddRoom();
      }}
      className="flex gap-2 pt-2"
    >
      <Input
        aria-label="New room name"
        placeholder="Add room (e.g. Kids Study)"
        value={roomName}
        onChange={(e) => onRoomNameChange(e.target.value)}
      />
      <Button type="submit" size="md" disabled={isSavingRoom}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        Save
      </Button>
    </form>
  </Card>
);
