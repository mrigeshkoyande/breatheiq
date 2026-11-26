import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquareHeart, ThumbsUp } from 'lucide-react';
import { useCommunityReports, useHousehold } from '../api/hooks';
import { apiRequest } from '../services/api';
import { CommunityReport } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { HazardReportForm } from '../components/community/HazardReportForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

/** Community air hazard reporting feed with severity filtering and confirmations. */
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
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : 'Unable to submit report.'),
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
          <HazardReportForm
            reportType={reportType}
            severity={severity}
            locationName={locationName}
            description={description}
            isSubmitting={submitMutation.isPending}
            onTypeChange={setReportType}
            onSeverityChange={setSeverity}
            onLocationChange={setLocationName}
            onDescriptionChange={setDescription}
            onSubmit={() => {
              setActionError('');
              submitMutation.mutate();
            }}
          />

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
