import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquareHeart, Plus, ThumbsUp } from 'lucide-react';
import { useCommunityReports, useHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { CommunityReport } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const CommunityPage: React.FC = () => {
  const qc = useQueryClient();
  const { data: household } = useHousehold();
  const [filterSeverity, setFilterSeverity] = useState('');
  const {
    data: reports = [],
    isLoading,
    error,
    refetch,
  } = useCommunityReports(undefined, filterSeverity);

  const [reportType, setReportType] = useState('construction_dust');
  const [severity, setSeverity] = useState('severe');
  const [locationName, setLocationName] = useState('');
  const [description, setDescription] = useState('');
  const [actionError, setActionError] = useState('');

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest<CommunityReport>('/community/reports', {
        method: 'POST',
        body: JSON.stringify({
          report_type: reportType,
          severity,
          location_name: locationName.trim(),
          latitude: household?.latitude ?? 19.076,
          longitude: household?.longitude ?? 72.8777,
          description: description.trim(),
        }),
      }),
    onSuccess: () => {
      setLocationName('');
      setDescription('');
      void qc.invalidateQueries({ queryKey: ['community', 'reports'] });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to submit report.');
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<CommunityReport>(`/community/reports/${id}/verify`, { method: 'POST' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['community', 'reports'] }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Unable to upvote report.'),
  });

  return (
    <AppShell title="Community Air Watch">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <MessageSquareHeart className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Community Smog Watch Feed
            </h1>
            <p className="text-sm text-[#475569]">
              Citizen hazard reports marked UNVERIFIED until reviewed by community moderators.
            </p>
          </div>
          <Badge badgeType="USER-REPORTED" />
        </div>

        {(error || actionError) && (
          <ErrorBanner
            message={
              actionError || (error instanceof Error ? error.message : 'Unable to fetch reports.')
            }
            onRetry={() => void refetch()}
          />
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 space-y-4 h-fit">
            <h2 className="font-bold text-lg">Report Local Hazard</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!locationName.trim()) return;
                setActionError('');
                submitMutation.mutate();
              }}
              className="space-y-3"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="comm-type"
                  className="text-xs font-semibold uppercase text-[#334155]"
                >
                  Hazard Type
                </label>
                <select
                  id="comm-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="construction_dust">Construction Dust</option>
                  <option value="garbage_burning">Garbage Burning</option>
                  <option value="traffic_congestion">Diesel Traffic Plume</option>
                  <option value="industrial_plume">Industrial Emission</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="comm-sev"
                  className="text-xs font-semibold uppercase text-[#334155]"
                >
                  Severity
                </label>
                <select
                  id="comm-sev"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>
              <Input
                label="Corridor / Junction"
                placeholder="e.g. Link Road & SV Road"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
              />
              <Input
                label="Observation Note"
                placeholder="Visible smoke or dust plume"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                <Plus className="w-4 h-4" aria-hidden="true" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Citizen Report'}
              </Button>
            </form>
          </Card>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-sm">Recent Corridor Reports</span>
              <select
                aria-label="Filter reports by severity"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <option value="">All Severities</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="hazardous">Hazardous</option>
              </select>
            </div>

            {isLoading ? (
              <LoadingSkeleton lines={4} label="Loading community reports..." />
            ) : reports.length === 0 ? (
              <Card>
                <p className="text-sm text-[#475569]">No community reports match this filter.</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base">{report.location_name}</div>
                      <div className="text-xs text-[#475569] capitalize">
                        {report.report_type.replace('_', ' ')} · Severity: {report.severity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          report.status === 'VERIFIED'
                            ? 'bg-[#DDF5EC] text-[#0F766E]'
                            : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}
                      >
                        {report.status}
                      </span>
                      <Badge badgeType="USER-REPORTED" />
                    </div>
                  </div>
                  {report.description && (
                    <p className="text-sm text-[#334155]">{report.description}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => upvoteMutation.mutate(report.id)}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                      Confirm ({report.upvote_count})
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
