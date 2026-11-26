import React from 'react';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface DraftMember {
  name: string;
  age_category: string;
  sensitivity: string;
}

interface AirTwinMembersStepProps {
  members: DraftMember[];
  newMemberName: string;
  newMemberAge: string;
  newMemberSens: string;
  onNameChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onSensitivityChange: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Step 2 panel for managing household AirTwin profiles during onboarding. */
export const AirTwinMembersStep: React.FC<AirTwinMembersStepProps> = ({
  members,
  newMemberName,
  newMemberAge,
  newMemberSens,
  onNameChange,
  onAgeChange,
  onSensitivityChange,
  onAddMember,
  onRemoveMember,
  onBack,
  onNext,
}) => (
  <div className="space-y-5">
    <div className="flex items-center gap-2.5 text-brand font-bold">
      <Users className="w-5 h-5" aria-hidden="true" />
      <h2>Step 2 · Household AirTwin Profiles</h2>
    </div>

    <div className="space-y-2">
      {members.map((m, idx) => (
        <div
          key={`${m.name}-${idx}`}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-edge bg-canvas"
        >
          <div>
            <div className="font-semibold text-sm">{m.name}</div>
            <div className="text-xs text-ink-secondary capitalize">
              {m.age_category} · {m.sensitivity.replace('_', ' ')}
            </div>
          </div>
          {idx > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveMember(idx)}>
              Remove
            </Button>
          )}
        </div>
      ))}
    </div>

    <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl border border-edge bg-white">
      <Input
        label="Member Name"
        value={newMemberName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="e.g. Aarav"
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="onb-age"
          className="text-xs font-semibold uppercase tracking-wider text-ink-strong"
        >
          Age Tier
        </label>
        <select
          id="onb-age"
          value={newMemberAge}
          onChange={(e) => onAgeChange(e.target.value)}
          className="bg-white border border-edge-strong rounded-lg px-3 py-2.5 text-sm"
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
          className="text-xs font-semibold uppercase tracking-wider text-ink-strong"
        >
          Sensitivity
        </label>
        <select
          id="onb-sens"
          value={newMemberSens}
          onChange={(e) => onSensitivityChange(e.target.value)}
          className="bg-white border border-edge-strong rounded-lg px-3 py-2.5 text-sm"
        >
          <option value="none">None</option>
          <option value="asthma">Asthma</option>
          <option value="bronchitis">Bronchitis</option>
          <option value="heart_condition">Heart Condition</option>
          <option value="pregnancy">Pregnancy</option>
        </select>
      </div>
      <div className="sm:col-span-3 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onAddMember}>
          Add Family Member
        </Button>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back
      </Button>
      <Button type="button" onClick={onNext}>
        Next: Alert Thresholds
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Button>
    </div>
  </div>
);
