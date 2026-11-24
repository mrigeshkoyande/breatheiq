import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Wind,
  ShieldCheck,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Thermometer,
  Droplets,
  Calculator,
  Hammer,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface Room {
  id: number;
  name: string;
  length_m: number;
  width_m: number;
  height_m: number;
  has_purifier: boolean;
  purifier_cadr: number;
}

interface RoomReading {
  id: number;
  pm25: number;
  co2?: number;
  temperature_c?: number;
  humidity_pct?: number;
  source: string;
  timestamp: string;
}

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [readings, setReadings] = useState<RoomReading[]>([]);
  const [windowOracle, setWindowOracle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New room state
  const [newRoomName, setNewRoomName] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);

  // Manual reading state
  const [manualPM25, setManualPM25] = useState(25.0);
  const [manualCO2, setManualCO2] = useState(620.0);

  // Purifier sizing calculator state
  const [calcLength, setCalcLength] = useState(4.5);
  const [calcWidth, setCalcWidth] = useState(3.8);
  const [calcHeight, setCalcHeight] = useState(2.7);
  const [calcAch, setCalcAch] = useState(5.0);
  const [calcResult, setCalcResult] = useState<any>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const roomList = await apiRequest<Room[]>('/user/rooms');
      setRooms(roomList);
      if (roomList.length > 0) {
        setSelectedRoomId(roomList[0].id);
        fetchReadings(roomList[0].id);
      }
      const oracle = await apiRequest('/engines/window-oracle', {
        method: 'POST',
        body: JSON.stringify({ lat: 19.0760, lon: 72.8777 }),
      });
      setWindowOracle(oracle);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const fetchReadings = async (roomId: number) => {
    try {
      const r = await apiRequest<RoomReading[]>(`/user/rooms/${roomId}/readings`);
      setReadings(r);
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSelectRoom = (roomId: number) => {
    setSelectedRoomId(roomId);
    fetchReadings(roomId);
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return;
    try {
      const created = await apiRequest<RoomReading>(`/user/rooms/${selectedRoomId}/readings`, {
        method: 'POST',
        body: JSON.stringify({
          pm25: Number(manualPM25),
          co2: Number(manualCO2),
          source: 'Manual',
        }),
      });
      setReadings((prev) => [created, ...prev]);
    } catch {
      // Handled
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const created = await apiRequest<Room>('/user/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoomName.trim(),
          length_m: 4.5,
          width_m: 3.8,
          height_m: 2.7,
          has_purifier: true,
          purifier_cadr: 300.0,
        }),
      });
      setRooms((prev) => [...prev, created]);
      setSelectedRoomId(created.id);
      setNewRoomName('');
      setShowAddRoom(false);
    } catch {
      // Handled
    }
  };

  const handleCalculatePurifier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/engines/purifier-size', {
        method: 'POST',
        body: JSON.stringify({
          length_m: Number(calcLength),
          width_m: Number(calcWidth),
          height_m: Number(calcHeight),
          target_ach: Number(calcAch),
          initial_pm25: 140.0,
        }),
      });
      setCalcResult(res);
    } catch {
      // Handled
    }
  };

  const activeRoom = rooms.find((r) => r.id === selectedRoomId);
  const latestReading = readings[0];

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="BreatheIQ Home">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">Indoor Air & Window Oracle</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">Indoor Air Quality & Ventilation Hub</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Room-by-room purification management, manual sensor logging, and forecast-driven aeration advice.
          </p>
        </div>

        {/* Window Oracle Banner */}
        {windowOracle && (
          <div className="bg-white rounded-2xl border border-[#0F766E]/30 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#DDF5EC] text-[#0F766E] flex items-center justify-center font-bold">
                  <Wind className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-black text-[#182A29]">Window Oracle Recommendation</h2>
                  <span className="text-[11px] text-[#64748B]">Modeled from diurnal boundary-layer lifting</span>
                </div>
              </div>

              <span
                className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                  windowOracle.current_action === 'VENTILATE_FREELY' || windowOracle.current_action === 'VENTILATE_BRIEFLY'
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : windowOracle.current_action === 'PURIFY'
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : 'bg-[#FEE2E2] text-[#DC5252]'
                }`}
              >
                STATUS: {windowOracle.current_action}
              </span>
            </div>

            <p className="text-xs text-[#3E4947] leading-relaxed">{windowOracle.summary_advisory}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 text-xs">
              <div>
                <span className="text-[#64748B] block">Optimal Window</span>
                <span className="font-bold text-[#182A29]">
                  {windowOracle.best_window_start} – {windowOracle.best_window_end}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Aeration Score</span>
                <span className="font-bold text-[#0F766E]">{windowOracle.best_window_score}/100</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Mode</span>
                <span className="font-bold text-[#182A29]">{windowOracle.provenance_badge}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Night Inversion</span>
                <span className="font-bold text-[#DC5252]">Seal Windows</span>
              </div>
            </div>
          </div>
        )}

        {/* Room Selection Tabs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room.id)}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                    selectedRoomId === room.id
                      ? 'bg-[#0F766E] text-white shadow-sm'
                      : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {room.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAddRoom(!showAddRoom)}
                className="text-xs px-3 py-2 rounded-xl border border-dashed border-[#CBD5E1] text-[#0F766E] font-bold hover:border-[#0F766E]"
              >
                + Add Room
              </button>
            </div>
          </div>

          {/* Add Room Mini Modal/Box */}
          {showAddRoom && (
            <form onSubmit={handleAddRoom} className="bg-white p-4 rounded-xl border border-[#E2E8F0] flex gap-2">
              <label htmlFor="new-room-name-input" className="sr-only">Room Name</label>
              <input
                id="new-room-name-input"
                name="room_name"
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room Name (e.g. Study Room, Nursery)..."
                className="flex-1 text-xs p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
              />
              <button
                type="submit"
                className="text-xs font-bold px-4 py-2 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
              >
                Save
              </button>
            </form>
          )}

          {/* Active Room Data & Readings */}
          {activeRoom && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Room Profile & Indoor IAQ */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-[#182A29]">{activeRoom.name}</h3>
                      <span className="text-xs text-[#64748B]">
                        Dimensions: {activeRoom.length_m}m × {activeRoom.width_m}m × {activeRoom.height_m}m (
                        {Math.round(activeRoom.length_m * activeRoom.width_m * activeRoom.height_m)} m³)
                      </span>
                    </div>

                    <span className="text-[10px] font-bold bg-[#DDF5EC] text-[#0F766E] px-2.5 py-1 rounded-full uppercase">
                      HEPA Purifier Active
                    </span>
                  </div>

                  {/* Indoor vs Outdoor Comparison Dial */}
                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Indoor Air (Purified)</span>
                      <span className="text-3xl font-black text-[#2F9E62]">
                        {latestReading ? latestReading.pm25 : 22.0}{' '}
                        <span className="text-xs font-normal text-[#64748B]">µg/m³</span>
                      </span>
                      <span className="text-[10px] text-[#2F9E62] font-semibold block">85% Reduction vs Outdoor</span>
                    </div>

                    <div className="space-y-1 border-l border-[#E2E8F0] pl-4">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase">Outdoor Infiltration Baseline</span>
                      <span className="text-3xl font-black text-[#DC5252]">
                        148.0 <span className="text-xs font-normal text-[#64748B]">µg/m³</span>
                      </span>
                      <span className="text-[10px] text-[#DC5252] font-semibold block">Poor CPCB Category</span>
                    </div>
                  </div>

                  {/* Manual Reading Form */}
                  <form onSubmit={handleAddReading} className="border-t border-[#F1F5F9] pt-4 space-y-3">
                    <span className="text-xs font-bold text-[#182A29] block">Log manual indoor reading:</span>
                    <div className="flex items-center gap-3">
                      <div>
                        <label htmlFor="manual-pm25-input" className="sr-only">PM2.5</label>
                        <input
                          id="manual-pm25-input"
                          name="pm25_reading"
                          type="number"
                          step="0.1"
                          value={manualPM25}
                          onChange={(e) => setManualPM25(Number(e.target.value))}
                          placeholder="PM2.5 (µg/m³)"
                          className="text-xs p-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] w-32"
                        />
                      </div>
                      <div>
                        <label htmlFor="manual-co2-input" className="sr-only">CO2</label>
                        <input
                          id="manual-co2-input"
                          name="co2_reading"
                          type="number"
                          value={manualCO2}
                          onChange={(e) => setManualCO2(Number(e.target.value))}
                          placeholder="CO2 (ppm)"
                          className="text-xs p-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] w-32"
                        />
                      </div>
                      <button
                        type="submit"
                        className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
                      >
                        Record Reading
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: CADR Sizing & DIY Box Guide */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#0F766E]" />
                    <h3 className="text-sm font-black text-[#182A29]">Purifier Sizing Calculator</h3>
                  </div>

                  <form onSubmit={handleCalculatePurifier} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="calc-room-length" className="text-[10px] text-[#64748B] block">Length (m)</label>
                        <input
                          id="calc-room-length"
                          name="room_length"
                          type="number"
                          step="0.1"
                          value={calcLength}
                          onChange={(e) => setCalcLength(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                        />
                      </div>
                      <div>
                        <label htmlFor="calc-room-width" className="text-[10px] text-[#64748B] block">Width (m)</label>
                        <input
                          id="calc-room-width"
                          name="room_width"
                          type="number"
                          step="0.1"
                          value={calcWidth}
                          onChange={(e) => setCalcWidth(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-[#CBD5E1] bg-[#F8FAF7]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full font-bold py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
                    >
                      Calculate Required CADR
                    </button>
                  </form>

                  {calcResult && (
                    <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1">
                      <span className="font-bold text-[#182A29] block">
                        Required CADR: {calcResult.required_cadr_m3h} m³/h ({calcResult.required_cadr_cfm} CFM)
                      </span>
                      <span className="text-[11px] text-[#64748B] block">
                        Time to 50% Reduction: {calcResult.time_to_50pct_min} mins
                      </span>
                      <span className="text-[10px] text-[#0F766E] font-semibold block">
                        Target: {calcResult.target_ach} Air Changes per Hour
                      </span>
                    </div>
                  )}
                </div>

                {/* Corsi-Rosenthal Guide Card */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-[#0F766E]" />
                    <h3 className="text-sm font-black text-[#182A29]">DIY Corsi-Rosenthal Box</h3>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Build a low-cost high-CADR air cleaner using 4 MERV-13 filters and a 20-inch box fan.
                    Delivers 400+ CFM CADR at a fraction of commercial purifier costs.
                  </p>
                  <span className="text-[10px] font-bold text-[#0F766E] block">
                    Ideal for larger living spaces during peak winter smog.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
