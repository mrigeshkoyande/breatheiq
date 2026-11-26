import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCities, useSaveHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';
import { SkipLink } from '../components/layout/SkipLink';

interface DraftMember {
  name: string;
  age_category: string;
  sensitivity: string;
}

export const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: cities = [] } = useCities();
  const saveHousehold = useSaveHousehold();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [city, setCity] = useState('Mumbai');
  const [neighborhood, setNeighborhood] = useState('Andheri West');

  const [members, setMembers] = useState<DraftMember[]>([
    { name: user?.full_name || 'Primary User', age_category: 'adult', sensitivity: 'none' },
  ]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('child');
  const [newMemberSens, setNewMemberSens] = useState('asthma');

  const [aqiThreshold, setAqiThreshold] = useState(200);
  const [enablePush, setEnablePush] = useState(true);

  const selectedCityMeta = cities.find((c) => c.city.toLowerCase() === city.toLowerCase());

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
    setErrorMsg('');
    try {
      await saveHousehold.mutateAsync({
        name: `${neighborhood} Residence`,
        city,
        neighborhood,
        latitude: selectedCityMeta?.latitude ?? (city === 'Delhi' ? 28.6139 : 19.076),
        longitude: selectedCityMeta?.longitude ?? (city === 'Delhi' ? 77.209 : 72.8777),
      });

      for (const m of members) {
        await apiRequest('/user/members', {
          method: 'POST',
          body: JSON.stringify(m),
        });
      }

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
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not save onboarding setup. Please verify your connection and retry.'
      );
    } finally {
      setSaving(false);
    }
  };

  const availableCities =
    cities.length > 0
      ? cities.map((c) => c.city)
      : ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune'];

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            Setup Step {step} of 3
          </span>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalize Your Family Air Defense
          </h1>
          <p className="text-sm text-[#475569]">
            Configure your city corridor, household respiratory vulnerabilities, and smog alerts.
          </p>
          <div
            className="grid grid-cols-3 gap-2 pt-2"
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={step}
          >
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full ${step >= idx ? 'bg-[#0F766E]' : 'bg-[#E2E8F0]'}`}
              />
            ))}
          </div>
        </div>

        {errorMsg && (
          <ErrorBanner message={errorMsg} onRetry={() => void handleCompleteOnboarding()} />
        )}

        <Card elevated className="p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-[#0F766E] font-bold">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                <h2>Step 1 · Select Urban Monitoring Corridor</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={city === c}
                    onClick={() => setCity(c)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      city === c
                        ? 'bg-[#DDF5EC] border-[#0F766E] text-[#0F766E]'
                        : 'bg-white border-[#CBD5E1] text-[#334155] hover:border-[#0F766E]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <Input
                label="Neighborhood / Locality"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="e.g. Andheri West, Rohini, Indiranagar"
                required
              />

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => setStep(2)}>
                  Next: Family AirTwin
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-[#0F766E] font-bold">
                <Users className="w-5 h-5" aria-hidden="true" />
                <h2>Step 2 · Household AirTwin Profiles</h2>
              </div>

              <div className="space-y-2">
                {members.map((m, idx) => (
                  <div
                    key={`${m.name}-${idx}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAF7]"
                  >
                    <div>
                      <div className="font-semibold text-sm">{m.name}</div>
                      <div className="text-xs text-[#475569] capitalize">
                        {m.age_category} · {m.sensitivity.replace('_', ' ')}
                      </div>
                    </div>
                    {idx > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(idx)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-white">
                <Input
                  label="Member Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Aarav"
                />
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-age"
                    className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
                  >
                    Age Tier
                  </label>
                  <select
                    id="onb-age"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option value="infant">Infant (0-2)</option>
                    <option value="child">Child (3-17)</option>
                    <option value="adult">Adult (18-59)</option>
                    <option value="senior">Senior (60+)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="onb-sens"
                    className="text-xs font-semibold uppercase tracking-wider text-[#334155]"
                  >
                    Sensitivity
                  </label>
                  <select
                    id="onb-sens"
                    value={newMemberSens}
                    onChange={(e) => setNewMemberSens(e.target.value)}
                    className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
                  >
                    <option value="none">None</option>
                    <option value="asthma">Asthma</option>
                    <option value="bronchitis">Bronchitis</option>
                    <option value="heart_condition">Heart Condition</option>
                    <option value="pregnancy">Pregnancy</option>
                  </select>
                </div>
                <div className="sm:col-span-3 flex justify-end">
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddMember}>
                    Add Family Member
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Next: Alert Thresholds
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 text-[#0F766E] font-bold">
                <Bell className="w-5 h-5" aria-hidden="true" />
                <h2>Step 3 · SmogShield Alert Threshold</h2>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="onb-threshold"
                  className="flex justify-between text-sm font-semibold"
                >
                  <span>Trigger High-Priority Smog Alert At</span>
                  <span className="text-[#0F766E]">{aqiThreshold} NAQI</span>
                </label>
                <input
                  id="onb-threshold"
                  type="range"
                  min={100}
                  max={400}
                  step={25}
                  value={aqiThreshold}
                  onChange={(e) => setAqiThreshold(Number(e.target.value))}
                  className="w-full accent-[#0F766E]"
                />
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>100 (Moderate)</span>
                  <span>200 (Poor)</span>
                  <span>300+ (Very Poor / Severe)</span>
                </div>
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#E2E8F0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePush}
                  onChange={(e) => setEnablePush(e.target.checked)}
                  className="w-4 h-4 accent-[#0F766E]"
                />
                <span className="text-sm font-medium">
                  Enable browser & in-app smog surge alerts (quiet hours 22:00 - 07:00)
                </span>
              </label>

              <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-xs text-[#475569] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
                <span>Public health guidance only — not medical advice.</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={saving}
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleCompleteOnboarding()}
                  disabled={saving}
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {saving ? 'Saving Household...' : 'Finish & Open Dashboard'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
