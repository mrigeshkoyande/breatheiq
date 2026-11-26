import React from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { RoutineTask } from '../../types/api';
import { Card } from '../ui/Card';
import { LoadingSkeleton } from '../ui/StatusBanner';

interface RoutineTaskListProps {
  tasks: RoutineTask[];
  isLoading: boolean;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

/** Displays persisted daily routine tasks with completion toggles and removal controls. */
export const RoutineTaskList: React.FC<RoutineTaskListProps> = ({
  tasks,
  isLoading,
  onToggle,
  onDelete,
}) => {
  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
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
                onClick={() => onToggle(task.id)}
                className="flex items-start gap-3 text-left flex-1 min-w-0"
              >
                {task.is_completed ? (
                  <CheckCircle2
                    className="w-5 h-5 text-[#2F9E62] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
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
                onClick={() => onDelete(task.id)}
                className="p-2 rounded-lg text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
