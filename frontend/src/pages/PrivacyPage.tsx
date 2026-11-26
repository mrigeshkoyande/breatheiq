import React, { useState } from 'react';
import { Download, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { PublicHeader } from '../components/layout/PublicHeader';
import { SkipLink } from '../components/layout/SkipLink';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner } from '../components/ui/StatusBanner';

export const PrivacyPage: React.FC = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setErrorMsg('');
    try {
      let exportPayload: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        authenticated: Boolean(user),
      };
      if (user) {
        const [profile, household, members, rooms, routine, impact] = await Promise.all([
          apiRequest('/auth/me'),
          apiRequest('/user/household'),
          apiRequest('/user/members'),
          apiRequest('/user/rooms'),
          apiRequest('/user/routine'),
          apiRequest('/user/impact'),
        ]);
        exportPayload = { ...exportPayload, profile, household, members, rooms, routine, impact };
      }
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breatheiq-privacy-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to export account records.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col">
      <SkipLink />
      <PublicHeader />

      <main
        id="main-content"
        className="flex-1 max-w-4xl w-full mx-auto px-4 lg:px-8 py-10 space-y-6"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F766E]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Privacy & Data Sovereignty
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Atmospheric & Family Data</h1>
          <p className="text-sm text-[#475569]">
            BreatheIQ stores only the location corridors, room dimensions, and sensitivity flags you
            explicitly enter to personalize smog guidance.
          </p>
        </div>

        {errorMsg && <ErrorBanner message={errorMsg} />}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <Lock className="w-4 h-4 text-[#0F766E]" aria-hidden="true" />
              <h2>Session & Credential Storage</h2>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed">
              Short-lived access JWTs (~15 minutes) remain strictly in React memory. Refresh
              sessions use rotating HttpOnly cookies hashed with SHA-256 and family reuse detection.
              Passwords are salted and hashed with Argon2id.
            </p>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-bold">Transparency & No Ad Tracking</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              BreatheIQ does not load third-party advertising trackers or sell household health
              sensitivity attributes. Copilot trace logs hash prompts before storage.
            </p>
          </Card>
        </div>

        <Card elevated className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg">Export Personal Telemetry Archive</h2>
            <p className="text-xs text-[#475569]">
              {user
                ? `Download JSON archive of profile, household, rooms, routine, and impact for ${user.email}.`
                : 'Sign in to export your household and exposure ledger records.'}
            </p>
          </div>
          <Button type="button" onClick={() => void handleExport()} disabled={exporting}>
            <Download className="w-4 h-4" aria-hidden="true" />
            {exporting ? 'Preparing JSON...' : exportDone ? 'Exported JSON' : 'Export JSON Data'}
          </Button>
        </Card>
      </main>
    </div>
  );
};
