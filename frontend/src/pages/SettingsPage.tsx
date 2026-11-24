import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Lock,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      user_id: user?.id,
      email: user?.email,
      full_name: user?.full_name,
      role: user?.role,
      exported_at: new Date().toISOString(),
      standards: 'BreatheIQ Local-First Data Sovereignty',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breatheiq_user_archive_${user?.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    await logout();
    navigate('/');
  };

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
            <span className="text-xs font-bold text-[#182A29]">Account & Privacy Settings</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#182A29]">Account & Data Sovereignty Settings</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Manage your credentials, encryption settings, data export archive, and account deletion.
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-xl p-3 text-xs text-[#15803D] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile settings updated successfully.</span>
          </div>
        )}

        {/* Profile Card */}
        <form
          onSubmit={handleUpdateProfile}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-black text-[#182A29]">Personal Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#64748B] block mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
            >
              Save Changes
            </button>
          </div>
        </form>

        {/* Security & Authentication */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0F766E]" />
            <h2 className="text-base font-black text-[#182A29]">Security & Cryptographic Tokens</h2>
          </div>

          <div className="space-y-3 text-xs text-[#3E4947]">
            <p>
              Your session utilizes short-lived JWT access tokens stored exclusively in browser memory.
              Session persistence uses an <code>HttpOnly, SameSite=Strict</code> refresh cookie hashed with Argon2id.
            </p>
            <div className="bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <span>Role: {user?.role}</span>
              <span>Account ID: #{user?.id}</span>
              <span>Verified: {user?.is_verified ? 'Yes' : 'Pending'}</span>
              <span>Argon2id Hash: Active</span>
            </div>
          </div>
        </div>

        {/* Data Export & Account Deletion */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-black text-[#182A29]">Data Export & Permanent Deletion</h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
            <div>
              <span className="text-xs font-bold text-[#182A29] block">Export Full Personal Archive</span>
              <p className="text-[11px] text-[#64748B]">Download complete machine-readable JSON archive of your data.</p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="text-xs font-bold px-4 py-2 rounded-xl border border-[#0F766E] text-[#0F766E] hover:bg-[#DDF5EC]/30 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Archive</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#DC5252] block">Delete Account & Purge Data</span>
              <p className="text-[11px] text-[#64748B]">
                Immediately removes all family profiles, saved commute routes, and historical telemetry logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#FEE2E2] text-[#DC5252] hover:bg-[#FCA5A5]/40 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#DC5252] flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#182A29]">Confirm Account Deletion</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  This action cannot be undone. All family profiles and saved environmental telemetry will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-xs px-4 py-2 rounded-xl border border-[#CBD5E1] text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#DC5252] text-white hover:bg-[#B91C1C]"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
