import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface RoutineTask {
  id: number;
  time_slot: string;
  title: string;
  description: string;
  category: string;
  is_completed: boolean;
}

export const RoutinePage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSlot, setNewTaskSlot] = useState('morning');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<RoutineTask[]>('/user/routine');
      setTasks(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggle = async (taskId: number) => {
    try {
      await apiRequest(`/user/routine/${taskId}/toggle`, { method: 'PATCH' });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, is_completed: !t.is_completed } : t))
      );
    } catch {
      // Handled
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const created = await apiRequest<RoutineTask>('/user/routine', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          time_slot: newTaskSlot,
          category: 'routine',
        }),
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle('');
    } catch {
      // Handled
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await apiRequest(`/user/routine/${taskId}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // Handled
    }
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const filteredTasks = selectedSlot === 'all' ? tasks : tasks.filter((t) => t.time_slot === selectedSlot);

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
            <span className="text-xs font-bold text-[#182A29]">Adaptive Daily Routine</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Header Strip & Progress */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#182A29]">Adaptive Inversion-Proof Routine</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Synchronized with diurnal thermal inversion cycles to minimize personal inhaled PM2.5 dosage.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl px-4 py-3 shrink-0">
            <div className="text-right">
              <span className="text-xs font-bold text-[#182A29] block">
                {completedCount} of {tasks.length} Done
              </span>
              <span className="text-[10px] text-[#0F766E] font-semibold">Streak: 7 Days</span>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-[#0F766E] border-t-[#DDF5EC] flex items-center justify-center font-bold text-xs text-[#0F766E]">
              {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Time Slot Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
          {[
            { id: 'all', label: 'All Day' },
            { id: 'morning', label: 'Morning (06:00-11:00)', icon: Sun },
            { id: 'afternoon', label: 'Midday (12:00-16:00)', icon: Sunset },
            { id: 'evening', label: 'Night (17:00-23:00)', icon: Moon },
          ].map((slot) => (
            <button
              key={slot.id}
              onClick={() => setSelectedSlot(slot.id)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedSlot === slot.id
                  ? 'bg-[#0F766E] text-white shadow-sm'
                  : 'text-[#64748B] hover:bg-[#F1F5F9]'
              }`}
            >
              <span>{slot.label}</span>
            </button>
          ))}
        </div>

        {/* Task List */}
        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Synchronizing Daily Plan...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-4 transition shadow-sm ${
                  t.is_completed ? 'border-[#86EFAC] bg-[#F0FDF4]/30' : 'border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(t.id)}
                    className="mt-0.5 text-[#0F766E] hover:opacity-80"
                  >
                    {t.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2F9E62]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#CBD5E1]" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <span
                      className={`text-xs font-bold block ${
                        t.is_completed ? 'line-through text-[#64748B]' : 'text-[#182A29]'
                      }`}
                    >
                      {t.title}
                    </span>
                    {t.description && (
                      <p className="text-[11px] text-[#64748B] leading-relaxed">{t.description}</p>
                    )}
                    <span className="text-[10px] font-semibold text-[#0F766E] bg-[#DDF5EC] px-2 py-0.5 rounded-full inline-block uppercase">
                      {t.time_slot}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(t.id)}
                  className="text-[#94A3B8] hover:text-[#DC5252] transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Task Form */}
        <form
          onSubmit={handleAddTask}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm"
        >
          <label htmlFor="routine-task-input" className="sr-only">New task title</label>
          <input
            id="routine-task-input"
            name="task_title"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add new task (e.g. Check HEPA filter pre-mesh)..."
            className="flex-1 w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
          />
          <label htmlFor="routine-task-slot-select" className="sr-only">Task time slot</label>
          <select
            id="routine-task-slot-select"
            name="task_slot"
            value={newTaskSlot}
            onChange={(e) => setNewTaskSlot(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7] w-full sm:w-auto"
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
          <button
            type="submit"
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center gap-1.5 transition w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </form>
      </main>
    </div>
  );
};
