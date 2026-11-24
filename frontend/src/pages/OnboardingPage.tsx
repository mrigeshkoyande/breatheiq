import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Users,
  ShieldAlert,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Location state
  const [city, setCity] = useState('Mumbai');
  const [neighborhood, setNeighborhood] = useState('Andheri West');

  // Step 2: Household members
  const [members, setMembers] = useState([
    { name: user?.full_name || 'Primary User', age_category: 'adult', sensitivity: 'none' },
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('child');
  const [newMemberSens, setNewMemberSens] = useState('asthma');

  // Step 3: Alert thresholds
  const [aqiThreshold, setAqiThreshold] = useState(200);
  const [enablePush, setEnablePush] = useState(true);

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers((prev) => [
      ...prev,
      { name: newMemberName.trim(), age_category: newMemberAge, sensitivity: newMemberSens },
    ]);
    setNewMemberName('');
  };

  const handleRemoveMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCompleteOnboarding = async () => {
    setSaving(true);
    try {
      // 1. Save household
      await apiRequest('/user/household', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Home',
          city,
          neighborhood,
          latitude: city === 'Mumbai' ? 19.0760 : 28.6139,
          longitude: city === 'Mumbai' ? 72.8777 : 77.2090,
        }),
      });

      // 2. Save members
      for (const m of members) {
        await apiRequest('/user/members', {
          method: 'POST',
          body: JSON.stringify(m),
        });
      }

      // 3. Save alert rules
      await apiRequest('/user/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          aqi_threshold: aqiThreshold,
          target_member: 'All Members',
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          channels: enablePush ? 'in_app,push' : 'in_app',
        }),
      });

      navigate('/app/dashboard');
    } catch {
      navigate('/app/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
            <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">Family AirTwin Setup</span>
          </div>
          <span className="text-xs font-bold text-[#0F766E]">Step {currentStep} of 3</span>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 1 ? 'bg-[#0F766E] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}
              >
                1
              </div>
              <span className="text-xs font-bold text-[#182A29] hidden sm:inline">Location</span>
            </div>
            <div className="h-0.5 flex-1 mx-3 bg-[#E2E8F0]">
              <div
                className={`h-full bg-[#0F766E] transition-all ${
                  currentStep === 1 ? 'w-0' : currentStep === 2 ? 'w-1/2' : 'w-full'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 2 ? 'bg-[#0F766E] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}
              >
                2
              </div>
              <span className="text-xs font-bold text-[#182A29] hidden sm:inline">Household</span>
            </div>
            <div className="h-0.5 flex-1 mx-3 bg-[#E2E8F0]">
              <div
                className={`h-full bg-[#0F766E] transition-all ${
                  currentStep === 3 ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3 ? 'bg-[#0F766E] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                }`}
              >
                3
              </div>
              <span className="text-xs font-bold text-[#182A29] hidden sm:inline">Alerts</span>
            </div>
          </div>

          {/* Step 1: Location Setup */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-black text-[#182A29]">
                  Select your monitoring corridor
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  BreatheIQ connects your home with the closest official CAAQMS station and atmospheric models.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#334155] block mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] focus:ring-2 focus:ring-[#0F766E]"
                  >
                    <option value="Mumbai">Mumbai (Maharashtra)</option>
                    <option value="Delhi">Delhi (NCT of Delhi)</option>
                    <option value="Bengaluru">Bengaluru (Karnataka)</option>
                    <option value="Kolkata">Kolkata (West Bengal)</option>
                    <option value="Pune">Pune (Maharashtra)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155] block mb-1">
                    Neighborhood / Ward
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Andheri West, Connaught Place, Koramangala"
                    className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] focus:ring-2 focus:ring-[#0F766E]"
                  />
                </div>
              </div>

              <div className="bg-[#DDF5EC]/30 border border-[#A7E8C6]/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#0F766E]">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Location data is stored locally and used exclusively to fetch boundary layer forecasts.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Household Members & Sensitivities */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-black text-[#182A29]">
                  Configure family vulnerability profiles
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Tailors exposure dosage warnings for children, seniors, and respiratory sensitivities.
                </p>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                {members.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#182A29] block">{m.name}</span>
                      <span className="text-[11px] text-[#64748B] capitalize">
                        {m.age_category} · {m.sensitivity === 'none' ? 'Standard profile' : m.sensitivity}
                      </span>
                    </div>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-[11px] text-[#DC5252] font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Member Mini Form */}
              <div className="border-t border-[#F1F5F9] pt-4 space-y-3">
                <span className="text-xs font-bold text-[#182A29] block">Add another member:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Name"
                    className="text-xs p-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                  />
                  <select
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                  >
                    <option value="infant">Infant (0-2y)</option>
                    <option value="child">Child (3-12y)</option>
                    <option value="adult">Adult (13-64y)</option>
                    <option value="senior">Senior (65y+)</option>
                  </select>
                  <select
                    value={newMemberSens}
                    onChange={(e) => setNewMemberSens(e.target.value)}
                    className="text-xs p-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                  >
                    <option value="none">No sensitivities</option>
                    <option value="asthma">Asthma</option>
                    <option value="bronchitis">Bronchitis</option>
                    <option value="heart_condition">Cardiovascular</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-xs font-bold text-[#0F766E] hover:underline block"
                >
                  + Add Member to Household
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Alert Thresholds & Channels */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-black text-[#182A29]">
                  Set SmogShield notification triggers
                </h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Receive proactive alerts before peak twilight and nocturnal inversion stagnation hits.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="font-bold text-[#334155]">Alert Threshold (NAQI):</label>
                    <span className="font-bold text-[#0F766E]">{aqiThreshold} NAQI</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="350"
                    step="25"
                    value={aqiThreshold}
                    onChange={(e) => setAqiThreshold(Number(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#0F766E]"
                  />
                  <div className="flex justify-between text-[10px] text-[#64748B] mt-1">
                    <span>100 (Moderate)</span>
                    <span>200 (Poor)</span>
                    <span>300 (Very Poor)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-[#182A29] block">Push & In-App Alerts</span>
                    <span className="text-[11px] text-[#64748B]">Notify on rapid PM2.5 spikes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePush}
                    onChange={(e) => setEnablePush(e.target.checked)}
                    className="w-4 h-4 text-[#0F766E] rounded accent-[#0F766E]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="text-xs font-bold px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s + 1)}
                className="text-xs font-bold px-5 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center gap-1.5 transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={saving}
                className="text-xs font-bold px-6 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <span>{saving ? 'Configuring AirTwin...' : 'Complete & Open Dashboard'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
