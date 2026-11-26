import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { useLanguage } from '../i18n/translations';
import { User } from '../types/auth';
import { AppShell } from '../components/layout/AppShell';
import { PasswordLanguageCard, ProfileSettingsCard } from '../components/settings/SettingsPanels';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ErrorBanner } from '../components/ui/StatusBanner';

/** User account profile, password management, locale switcher, and deletion controls. */
export const SettingsPage: React.FC = () => {
  const { user, logout, setUserProfile } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }
    setErrorMsg('');
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const updated = await apiRequest<User>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      setUserProfile(updated);
      setProfileSaved(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPwdSuccess('');
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }
    setPwdSaving(true);
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setPwdSuccess('Password updated and active sessions rotated.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to change password.');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMsg('');
    try {
      await apiRequest('/auth/me', { method: 'DELETE' });
      await logout();
      navigate('/');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete account.');
      setDeleting(false);
    }
  };

  return (
    <AppShell title="Settings & Preferences">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
            Account, Language & Data Controls
          </h1>
          <p className="text-sm text-[#475569]">
            Manage your persisted profile, password, and display language.
          </p>
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <div className="grid md:grid-cols-2 gap-6">
          <ProfileSettingsCard
            email={user?.email || ''}
            fullName={fullName}
            saving={profileSaving}
            saved={profileSaved}
            onFullNameChange={setFullName}
            onSubmit={(e) => void handleUpdateProfile(e)}
          />
          <PasswordLanguageCard
            currentPassword={currentPassword}
            newPassword={newPassword}
            pwdSaving={pwdSaving}
            pwdSuccess={pwdSuccess}
            lang={lang}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onChangePassword={(e) => void handleChangePassword(e)}
            onLangChange={setLang}
          />
        </div>

        <Card className="border-[#FECACA] bg-[#FEF2F2]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base text-[#991B1B]">Permanent Account Deletion</h2>
            <p className="text-xs text-[#475569]">
              Deletes your user record, refresh sessions, rooms, family profiles, and impact
              history.
            </p>
          </div>
          <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Delete Account
          </Button>
        </Card>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Permanently Delete Account?"
        description="This action permanently deletes your account, sessions, household members, rooms, routines, and impact logs from the database."
        confirmLabel="Confirm Permanent Deletion"
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppShell>
  );
};
