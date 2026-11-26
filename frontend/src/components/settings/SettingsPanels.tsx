import React from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { SupportedLang } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface ProfileCardProps {
  email: string;
  fullName: string;
  saving: boolean;
  saved: boolean;
  onFullNameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

/** Account profile display name update form card. */
export const ProfileSettingsCard: React.FC<ProfileCardProps> = ({
  email,
  fullName,
  saving,
  saved,
  onFullNameChange,
  onSubmit,
}) => (
  <Card className="space-y-4">
    <h2 className="font-bold text-lg">Profile Information</h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Account Email" value={email} disabled />
      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
        required
      />
      {saved && (
        <div className="flex items-center gap-2 text-xs font-bold text-brand-emerald" role="status">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Profile saved to database.
        </div>
      )}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Saving Profile...' : 'Save Profile Changes'}
      </Button>
    </form>
  </Card>
);

interface PasswordLanguageCardProps {
  currentPassword: string;
  newPassword: string;
  pwdSaving: boolean;
  pwdSuccess: string;
  lang: SupportedLang;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onChangePassword: (e: React.FormEvent) => void;
  onLangChange: (lang: SupportedLang) => void;
}

const LANG_OPTIONS: Array<{ code: SupportedLang; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
];

/** Password rotation form and EN/HI/MR UI language selector card. */
export const PasswordLanguageCard: React.FC<PasswordLanguageCardProps> = ({
  currentPassword,
  newPassword,
  pwdSaving,
  pwdSuccess,
  lang,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onChangePassword,
  onLangChange,
}) => (
  <Card className="space-y-4">
    <h2 className="font-bold text-lg">Password & Language</h2>
    <form onSubmit={onChangePassword} className="space-y-3">
      <Input
        label="Current Password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => onCurrentPasswordChange(e.target.value)}
        required
      />
      <Input
        label="New Password"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        placeholder="Minimum 8 characters"
        required
      />
      {pwdSuccess && (
        <div className="text-xs font-bold text-brand-emerald" role="status">
          {pwdSuccess}
        </div>
      )}
      <Button type="submit" variant="secondary" disabled={pwdSaving} className="w-full">
        <KeyRound className="w-4 h-4" aria-hidden="true" />
        {pwdSaving ? 'Updating Password...' : 'Update Password'}
      </Button>
    </form>

    <div className="pt-3 border-t border-edge space-y-2">
      <span className="text-xs font-bold uppercase text-ink-strong">Interface Language</span>
      <div className="grid grid-cols-3 gap-2">
        {LANG_OPTIONS.map((item) => (
          <button
            key={item.code}
            type="button"
            aria-pressed={lang === item.code}
            onClick={() => onLangChange(item.code)}
            className={`py-2 px-3 rounded-lg text-xs font-bold border ${
              lang === item.code
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-ink-strong border-edge-strong'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  </Card>
);
