import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LeadershipAssignment, CurrentLeadInfo } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';

export const LeadershipRotationSection: React.FC = () => {
  const { user } = useAuth();
  const [currentLead, setCurrentLead] = useState<CurrentLeadInfo | null>(null);
  const [history, setHistory] = useState<LeadershipAssignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state for scheduling new rotation
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [notes, setNotes] = useState('October 2026 Rotation Lead');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLeadershipData = async () => {
    try {
      setLoading(true);
      const [lead, hist, teamData] = await Promise.all([
        api.getCurrentLead(),
        api.getLeadershipHistory(),
        api.getMyTeam(),
      ]);
      setCurrentLead(lead);
      setHistory(hist);
      if (teamData && teamData.members && teamData.members.length > 0) {
        setTeamMembers(teamData.members);
        setSelectedUserId(teamData.members[0].userId);
      }
    } catch (err) {
      console.error('Failed to load leadership rotation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadershipData();
  }, []);

  const handleScheduleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      await api.createLeadershipAssignment({
        userId: selectedUserId,
        startDate,
        endDate,
        notes,
      });
      setModalOpen(false);
      await loadLeadershipData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to schedule rotation');
    } finally {
      setSubmitting(false);
    }
  };

  const isLead = user?.role === 'LEAD' || user?.role === 'ADMIN';

  return (
    <div className="border border-line bg-paper rounded-sm p-5 space-y-5 font-sans shadow-2xs">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center space-x-2.5">
          <Shield className="w-5 h-5 text-accent shrink-0" />
          <div>
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-tight">
              Monthly Leadership Rotation & Schedule
            </h2>
            <p className="font-mono text-[11px] text-muted">
              Every engineer is an SDE Intern. Leadership rotates monthly with full historical tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadLeadershipData}
            className="p-1.5 border border-line hover:border-ink rounded-xs text-muted hover:text-ink transition-colors"
            title="Refresh Rotation Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isLead && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-ink text-paper hover:bg-ink/90 font-mono text-xs font-bold rounded-xs flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>SCHEDULE NEXT ROTATION</span>
            </button>
          )}
        </div>
      </div>

      {/* CURRENT ACTIVE LEAD CARD */}
      <div className="bg-paper-dark/70 border border-line rounded-xs p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-accent text-paper font-mono font-black text-xl flex items-center justify-center shadow-xs">
            {currentLead?.name ? currentLead.name.charAt(0) : 'L'}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-display text-base font-black text-ink uppercase">
                {currentLead?.name || user?.name || 'Team Lead'}
              </span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper border border-line text-muted">
                {currentLead?.serialNumber || user?.serialNumber || 'LEAD'}
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 uppercase">
                ACTIVE ROTATION
              </span>
            </div>
            <div className="font-mono text-xs text-muted flex items-center space-x-2">
              <span className="text-ink font-semibold">{currentLead?.position || user?.position || 'SDE Intern'}</span>
              <span>·</span>
              <span>Designated Lead for {currentLead?.monthName || 'Current Month'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-paper border border-line rounded-xs p-2.5 text-right font-mono text-xs space-y-0.5">
          <span className="text-[10px] text-muted block uppercase font-bold">Rotation Term</span>
          <span className="font-bold text-ink block">{currentLead?.periodLabel || 'Active Rotation'}</span>
          <span className="text-[10px] text-emerald-700 block">✓ Validated via PostgreSQL</span>
        </div>
      </div>

      {/* ROTATION HISTORY TABLE */}
      <div className="space-y-2">
        <span className="font-mono text-xs font-bold text-muted uppercase tracking-wider block">
          LEADERSHIP TIMELINE & HISTORICAL RECORDS
        </span>

        <div className="border border-line rounded-xs overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-paper-dark border-b border-line text-muted uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Lead Engineer</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">End Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {history.length > 0 ? (
                history.map((row) => (
                  <tr key={row.id} className={row.isCurrent ? 'bg-amber-500/5 font-semibold' : 'hover:bg-paper-dark/30'}>
                    <td className="py-2.5 px-3 font-bold text-ink">{row.monthLabel}</td>
                    <td className="py-2.5 px-3 text-ink">
                      {row.userName} ({row.serialNumber})
                    </td>
                    <td className="py-2.5 px-3 text-muted">{row.position}</td>
                    <td className="py-2.5 px-3 text-muted">{row.startDate}</td>
                    <td className="py-2.5 px-3 text-muted">{row.endDate}</td>
                    <td className="py-2.5 px-3">
                      {row.isCurrent ? (
                        <span className="px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 font-bold text-[10px]">
                          CURRENT LEAD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-xs bg-paper-dark text-muted border border-line text-[10px]">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted text-[11px] truncate max-w-[150px]">{row.notes || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted">
                    No leadership records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-lg rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-bold text-ink text-sm">SCHEDULE LEADERSHIP ROTATION</span>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-700 rounded-xs text-[11px]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleScheduleLead} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Assignee (SDE Intern)</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-semibold"
                >
                  {teamMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.serialNumber || 'MEMBER'}) - {m.position || 'SDE Intern'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Notes / Agenda</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. October 2026 Rotation Lead"
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-line rounded-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink/90 font-bold rounded-xs"
                >
                  {submitting ? 'Saving...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
