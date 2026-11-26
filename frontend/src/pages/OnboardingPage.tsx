import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCities, useSaveHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';
import { SkipLink } from '../components/layout/SkipLink';
import { CityCorridorStep } from '../components/onboarding/CityCorridorStep';
import { AirTwinMembersStep, DraftMember } from '../components/onboarding/AirTwinMembersStep';
import { AlertThresholdStep } from '../components/onboarding/AlertThresholdStep';

const FALLBACK_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune'];

/** Three-step onboarding wizard persisting household corridor, members, and alert rules. */
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
  const availableCities = cities.length > 0 ? cities.map((c) => c.city) : FALLBACK_CITIES;

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    setMembers((prev) => [
      ...prev,
      { name: newMemberName.trim(), age_category: newMemberAge, sensitivity: newMemberSens },
    ]);
    setNewMemberName('');
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
        await apiRequest('/user/members', { method: 'POST', body: JSON.stringify(m) });
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

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <SkipLink />
      <header className="bg-white border-b border-edge px-4 lg:px-8 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight">BreatheIQ</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Setup Step {step} of 3
          </span>
        </div>
      </header>
      <main id="main-content" className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personalize Your Family Air Defense
          </h1>
          <p className="text-sm text-ink-secondary">
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
                className={`h-2 rounded-full ${step >= idx ? 'bg-brand' : 'bg-[#E2E8F0]'}`}
              />
            ))}
          </div>
        </div>
        {errorMsg && (
          <ErrorBanner message={errorMsg} onRetry={() => void handleCompleteOnboarding()} />
        )}
        <Card elevated className="p-6 sm:p-8 space-y-6">
          {step === 1 && (
            <CityCorridorStep
              availableCities={availableCities}
              selectedCity={city}
              neighborhood={neighborhood}
              onSelectCity={setCity}
              onNeighborhoodChange={setNeighborhood}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <AirTwinMembersStep
              members={members}
              newMemberName={newMemberName}
              newMemberAge={newMemberAge}
              newMemberSens={newMemberSens}
              onNameChange={setNewMemberName}
              onAgeChange={setNewMemberAge}
              onSensitivityChange={setNewMemberSens}
              onAddMember={handleAddMember}
              onRemoveMember={(idx) => setMembers((prev) => prev.filter((_, i) => i !== idx))}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <AlertThresholdStep
              aqiThreshold={aqiThreshold}
              enablePush={enablePush}
              saving={saving}
              onThresholdChange={setAqiThreshold}
              onEnablePushChange={setEnablePush}
              onBack={() => setStep(2)}
              onComplete={() => void handleCompleteOnboarding()}
            />
          )}
        </Card>
      </main>
    </div>
  );
};
