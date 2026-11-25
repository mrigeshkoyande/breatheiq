import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { queryKeys, useImpactLedger, useRoutineTasks, useToggleRoutineTask } from '../api/hooks';
import { apiRequest } from '../services/api';
import { RoutineTask } from '../types/api';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ErrorBanner, LoadingSkeleton } from '../components/ui/StatusBanner';

export const RoutinePage: React.FC = () => {
  const qc = useQueryClient();
  const { data: tasks = [], isLoading, error, refetch } = useRoutineTasks();
  const { data: impact } = useImpactLedger();
  const toggleMutation = useToggleRoutineTask();

  const [title, setTitle] = useState('');
  const [slot, setSlot] = useState('morning');
  const [category, setCategory] = useState('ventilation');
  const [actionError, setActionError] = useState('');

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest<RoutineTask>('/user/routine', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          time_slot: slot,
          category,
          description: 'Custom family smog defense task',
        }),
      }),
    onSuccess: () => {
      setTitle('');
      void qc.invalidateQueries({ queryKey: queryKeys.routine });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to add task.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/user/routine/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.routine });
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Unable to delete task.');
    },
  });

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <AppShell title="Adaptive Smog Routine">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#0F766E]" aria-hidden="true" />
              Adaptive Daily Smog Routine
            </h1>
            <p className="text-sm text-[#475569]">
              Schedule outdoor errands around boundary layer expansion windows.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge badgeType="ESTIMATED" />
            <span className="px-3 py-1 rounded-full bg-[#DDF5EC] text-[#0F766E] text-xs font-bold">
              Ledger Streak: {impact?.clean_air_streak_days ?? tasks.length} Days
            </span>
          </div>
        </div>

        {(error || actionError) && (
          <ErrorBanner
            message={actionError || (error instanceof Error ? error.message : 'Error loading routine.')}
            onRetry={() => void refetch()}
          />
        )}

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              setActionError('');
              addMutation.mutate();
            }}
            className="grid sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-6">
              <Input
                label="New Routine Action"
                placeholder="e.g. Run bedroom HEPA before 21:00"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="routine-slot" className="text-xs font-semibold uppercase text-[#334155]">
                Time Slot
              </label>
              <select
                id="routine-slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label htmlFor="routine-cat" className="text-xs font-semibold uppercase text-[#334155]">
                Category
              </label>
              <select
                id="routine-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="ventilation">Ventilation</option>
                <option value="purifier">Purifier</option>
                <option value="exercise">Exercise</option>
                <option value="commute">Commute</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={addMutation.isPending} className="w-full h-10">
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span>Today&apos;s Scheduled Tasks</span>
            <span className="text-[#0F766E]">
              {completedCount} of {tasks.length} completed
            </span>
          </div>

          {isLoading ? (
            <LoadingSkeleton lines={4} label="Loading daily tasks..." />
          ) : tasks.length === 0 ? (
            <p className="text-sm text-[#475569] py-4">No tasks scheduled yet. Add an action above.</p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]"
                >
                  <button
                    type="button"
                    aria-label={
                      task.is_completed
                        ? `Mark "${task.title}" incomplete`
                        : `Mark "${task.title}" complete`
                    }
                    aria-pressed={task.is_completed}
                    onClick={() => toggleMutation.mutate(task.id)}
                    className="flex items-start gap-3 text-left flex-1 min-w-0"
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2F9E62] shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#475569] shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-semibold ${
                          task.is_completed ? 'line-through text-[#475569]' : 'text-[#182A29]'
                        }`}
                      >
                        {task.title}
                      </div>
                      <div className="text-xs text-[#475569] capitalize">
                        {task.time_slot} · {task.category}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete task "${task.title}"`}
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="p-2 rounded-lg text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};
