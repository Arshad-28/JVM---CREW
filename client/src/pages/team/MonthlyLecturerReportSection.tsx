import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MonthlyEvaluation } from '../../types';
import {
  Calendar,
  Award,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';

export const MonthlyLecturerReportSection: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [evaluation, setEvaluation] = useState<MonthlyEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  const handleOpenIntelligenceReport = () => {
    window.history.pushState({ tab: 'reports' }, '', '/reports');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const fetchEvaluation = async (month: string) => {
    try {
      setLoading(true);
      const data = await api.getMonthlyEvaluation(month);
      setEvaluation(data);
    } catch (err) {
      console.error('Failed to load monthly evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="border border-line bg-paper rounded-sm p-5 space-y-5 font-sans shadow-2xs">
      {/* HEADER & MONTH SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center space-x-2.5">
          <Award className="w-5 h-5 text-accent shrink-0" />
          <div>
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-tight">
              Monthly Evaluation & Lecturer Report
            </h2>
            <p className="font-mono text-[11px] text-muted">
              Official monthly performance report for mentors, lecturers, and academic reviewers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center space-x-1.5 bg-paper-dark border border-line px-2.5 py-1.5 rounded-xs">
            <Calendar className="w-3.5 h-3.5 text-muted" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-ink outline-none cursor-pointer text-xs"
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-11">November 2026</option>
            </select>
          </div>

          <button
            onClick={handleOpenIntelligenceReport}
            className="px-4 py-2 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-mono text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-xs transition-all hover-lift"
            title="Open Team Performance Intelligence Dashboard"
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary-soft" />
            <span>OPEN FULL PERFORMANCE REPORT →</span>
          </button>
        </div>
      </div>

      {loading || !evaluation ? (
        <div className="py-12 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Deriving authentic monthly report from PostgreSQL...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TWO COLUMN PERFORMANCE OVERVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. PERSONAL PERFORMANCE CARD */}
            {evaluation.personalPerformance && (
              <div className="lg:col-span-6 bg-paper-dark/50 border border-line rounded-xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
                  <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-accent" />
                    <span>Your Personal Deliverables ({evaluation.personalPerformance.name})</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-800 border border-emerald-500/30">
                    {evaluation.personalPerformance.performanceRating}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">Tasks Done</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.personalPerformance.tasksCompleted} / {evaluation.personalPerformance.tasksAssigned}
                    </span>
                    <span className="text-[9px] text-muted block">{evaluation.personalPerformance.taskCompletionPct}% Rate</span>
                  </div>

                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">Homework</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.personalPerformance.homeworkSubmitted} / {evaluation.personalPerformance.homeworkAssigned}
                    </span>
                    <span className="text-[9px] text-emerald-700 block">{evaluation.personalPerformance.homeworkReviewed} Reviewed</span>
                  </div>

                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">Standups</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.personalPerformance.standupsSubmitted}
                    </span>
                    <span className="text-[9px] text-muted block">{evaluation.personalPerformance.standupConsistencyPct}% Consistency</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LEADERSHIP PERFORMANCE CARD */}
            {evaluation.leadershipPerformance && (
              <div className="lg:col-span-6 bg-paper-dark/50 border border-line rounded-xs p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
                  <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Rotation Leadership Execution ({evaluation.leadershipPerformance.leadName})</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/15 text-amber-800 border border-amber-500/30">
                    {evaluation.leadershipPerformance.leadershipRating}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">Tasks Created</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.leadershipPerformance.tasksCreatedForTeam}
                    </span>
                    <span className="text-[9px] text-emerald-700 block">{evaluation.leadershipPerformance.tasksApproved} Approved</span>
                  </div>

                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">HW Managed</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.leadershipPerformance.homeworkCreated}
                    </span>
                    <span className="text-[9px] text-muted block">{evaluation.leadershipPerformance.homeworkReviewed} Reviews</span>
                  </div>

                  <div className="p-2.5 bg-paper border border-line rounded-xs space-y-0.5">
                    <span className="text-[10px] text-muted uppercase font-bold block">Standups Monitored</span>
                    <span className="text-sm font-black text-ink block">
                      {evaluation.leadershipPerformance.memberStandupsMonitored}
                    </span>
                    <span className="text-[9px] text-muted block">{evaluation.leadershipPerformance.cohortStandupSubmissionPct}% Cohort</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. COHORT ALL MEMBERS MATRIX */}
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-muted uppercase tracking-wider block">
              COHORT PERFORMANCE MATRIX ({evaluation.monthLabel})
            </span>

            {/* Desktop Table View (hidden on md-) */}
            <div className="hidden md:block border border-line rounded-xs overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-paper-dark border-b border-line text-muted uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">SDE Intern</th>
                    <th className="py-2.5 px-3">Monthly Role</th>
                    <th className="py-2.5 px-3">Tasks Completed</th>
                    <th className="py-2.5 px-3">HW Submitted</th>
                    <th className="py-2.5 px-3">Standups Logged</th>
                    <th className="py-2.5 px-3">Progress Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {evaluation.cohortSummaries.map((m) => (
                    <tr key={m.userId} className="hover:bg-paper-dark/30">
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {m.name} <span className="text-[10px] text-muted">({m.serialNumber})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold ${
                          m.roleInMonth.includes('LEAD')
                            ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                            : 'bg-paper-dark text-muted border border-line'
                        }`}>
                          {m.roleInMonth}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-ink">{m.tasksCompleted} / {m.tasksTotal}</td>
                      <td className="py-2.5 px-3 text-ink">{m.homeworkSubmitted} / {m.homeworkTotal}</td>
                      <td className="py-2.5 px-3 text-ink">{m.standupsSubmitted}</td>
                      <td className="py-2.5 px-3 font-bold text-ink">{m.progressPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (hidden on md+) */}
            <div className="md:hidden divide-y divide-line border border-line rounded-xs">
              {evaluation.cohortSummaries.map((m) => (
                <div key={m.userId} className="p-3.5 space-y-2 bg-paper font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-ink">{m.name}</span>
                      <span className="text-[10px] text-muted ml-1">({m.serialNumber})</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-xs text-[10px] font-bold ${
                      m.roleInMonth.includes('LEAD')
                        ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                        : 'bg-paper-dark text-muted border border-line'
                    }`}>
                      {m.roleInMonth}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] bg-paper-dark/40 p-2 rounded-xs border border-line">
                    <div>
                      <span className="text-[9px] text-muted block uppercase">Tasks</span>
                      <span className="font-bold text-ink">{m.tasksCompleted}/{m.tasksTotal}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted block uppercase">HW</span>
                      <span className="font-bold text-ink">{m.homeworkSubmitted}/{m.homeworkTotal}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-muted block uppercase">Standups</span>
                      <span className="font-bold text-ink">{m.standupsSubmitted}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
                    <span className="text-muted">Monthly Progress Rate:</span>
                    <span className="font-bold text-accent">{m.progressPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
