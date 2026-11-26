import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Circle } from 'lucide-react';
import { RoutineTask } from '../../types/api';
import { buttonStyles } from '../ui/Button';
import { Card } from '../ui/Card';

interface RoutineChecklistCardProps {
  title: string;
  viewAllLabel: string;
  tasks: RoutineTask[];
  togglingId: number | null;
  onToggle: (taskId: number) => void;
}

export const RoutineChecklistCard: React.FC<RoutineChecklistCardProps> = ({
  title,
  viewAllLabel,
  tasks,
  togglingId,
  onToggle,
}) => (
  <Card className="space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 font-bold">
        <CalendarCheck className="w-4 h-4 text-brand" aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      <Link to="/app/routine" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
        {viewAllLabel}
      </Link>
    </div>

    {tasks.length === 0 ? (
      <div className="p-4 rounded-xl bg-canvas border border-edge text-sm text-ink-secondary flex items-center justify-between">
        <span>No adaptive tasks scheduled yet for today.</span>
        <Link to="/app/routine" className={buttonStyles({ size: 'sm', variant: 'outline' })}>
          Add Task
        </Link>
      </div>
    ) : (
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            data-testid="routine-task-toggle"
            disabled={togglingId === task.id}
            onClick={() => onToggle(task.id)}
            aria-pressed={task.is_completed}
            className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl border border-edge bg-canvas hover:border-brand transition-colors disabled:opacity-60"
          >
            {task.is_completed ? (
              <CheckCircle2
                className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <Circle className="w-5 h-5 text-ink-secondary shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-semibold ${
                  task.is_completed ? 'line-through text-ink-secondary' : 'text-ink'
                }`}
              >
                {task.title}
              </div>
              {task.description && (
                <p className="text-xs text-ink-secondary mt-0.5 line-clamp-2">{task.description}</p>
              )}
            </div>
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-edge text-ink-strong shrink-0">
              {task.time_slot}
            </span>
          </button>
        ))}
      </div>
    )}
  </Card>
);
