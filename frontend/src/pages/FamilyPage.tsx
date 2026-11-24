import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldAlert,
  UserPlus,
  Trash2,
  HeartPulse,
  Activity,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface Member {
  id: number;
  name: string;
  age_category: string;
  sensitivity: string;
  vulnerability_score: number;
}

export const FamilyPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member modal form
  const [name, setName] = useState('');
  const [ageCategory, setAgeCategory] = useState('child');
  const [sensitivity, setSensitivity] = useState('asthma');
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Member[]>('/user/members');
      setMembers(data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await apiRequest<Member>('/user/members', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          age_category: ageCategory,
          sensitivity,
        }),
      });
      setMembers((prev) => [...prev, created]);
      setName('');
      setShowAddForm(false);
    } catch {
      // Handled
    }
  };

  const handleDeleteMember = async (id: number) => {
    try {
      await apiRequest(`/user/members/${id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // Handled
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#182A29] flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/app/dashboard" className="flex items-center gap-2.5">
              <img src="/logo-mark.webp" alt="BreatheIQ" className="w-8 h-8 rounded-lg" />
              <span className="font-extrabold text-lg tracking-tight text-[#0F766E]">BreatheIQ</span>
            </Link>
            <span className="text-xs text-[#94A3B8]">/</span>
            <span className="text-xs font-bold text-[#182A29]">Family AirTwin Profiles</span>
          </div>

          <Link
            to="/app/dashboard"
            className="text-xs px-3 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#182A29]">Family Profiles & Sensitivities</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Physiological sensitivity mapping, daily inhaled dosage thresholds, and tailored advisories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] flex items-center gap-2 transition self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>

        {/* Add Member Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddMember}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 max-w-xl"
          >
            <h3 className="text-sm font-black text-[#182A29]">Add Family Member to AirTwin</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#64748B] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya, Kabir"
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">Age Category</label>
                  <select
                    value={ageCategory}
                    onChange={(e) => setAgeCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                  >
                    <option value="infant">Infant (0-2y)</option>
                    <option value="child">Child (3-12y)</option>
                    <option value="adult">Adult (13-64y)</option>
                    <option value="senior">Senior (65y+)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#64748B] block mb-1">Sensitivity</label>
                  <select
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAF7]"
                  >
                    <option value="none">No known sensitivity</option>
                    <option value="asthma">Asthma</option>
                    <option value="bronchitis">Bronchitis</option>
                    <option value="heart_condition">Cardiovascular</option>
                    <option value="pregnancy">Pregnancy</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59]"
              >
                Save Member
              </button>
            </div>
          </form>
        )}

        {/* Member Cards Grid */}
        {loading ? (
          <div className="py-20 flex justify-center items-center gap-2 text-xs font-bold text-[#0F766E]">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading Family Profiles...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-[#182A29]">{m.name}</h3>
                      <span className="text-[11px] text-[#64748B] capitalize">
                        {m.age_category} · {m.sensitivity === 'none' ? 'Standard profile' : m.sensitivity}
                      </span>
                    </div>

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                        m.vulnerability_score > 70
                          ? 'bg-[#DC5252]'
                          : m.vulnerability_score > 40
                          ? 'bg-[#F28C28]'
                          : 'bg-[#2F9E62]'
                      }`}
                    >
                      {m.vulnerability_score}
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#F8FAF7] border border-[#E2E8F0] rounded-xl p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Inhalation Standard:</span>
                      <span className="font-bold text-[#182A29]">
                        {m.age_category === 'child' ? '10 m³/day' : m.age_category === 'infant' ? '4.5 m³/day' : '12 m³/day'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Daily Averted PM2.5:</span>
                      <span className="font-bold text-[#0F766E]">~480 µg averted</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Action Priority:</span>
                      <span className="font-bold text-[#DC5252]">
                        {m.vulnerability_score > 70 ? 'N95 Respirator Required' : 'Standard Routine'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F1F5F9] pt-3 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#64748B]">AirTwin Active</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMember(m.id)}
                    className="text-[#94A3B8] hover:text-[#DC5252] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
