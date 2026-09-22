import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore, getLocalTodayDateString } from '../../services/api';
import {
  LeadDashboard,
  MemberRosterItem,
  AttentionItem,
  MemberDetailProgress,
} from '../../types';
import { MetricBox } from '../../components/common/MetricBox';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StandupAudioPlayer } from '../../components/common/StandupAudioPlayer';
import { LeadershipRotationSection } from './LeadershipRotationSection';
import { MonthlyLecturerReportSection } from './MonthlyLecturerReportSection';
import { TeamManagementSection } from './TeamManagementSection';
import { PageContainer } from '../../components/common/PageContainer';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  History,
  Clock,
  ShieldCheck,
  ListTodo,
  FileCode,
  Search,
  RefreshCw,
  ChevronRight,
  User,
  Calendar,
  Save,
  RotateCcw,
  Settings,
  Mic,
  FileDown,
} from 'lucide-react';

type SortField = 'name' | 'overallProgressPct' | 'taskCompletionPct' | 'standupSubmittedToday';

export const TeamDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const localToday = getLocalTodayDateString();
  const cachedDash = cacheStore.get<LeadDashboard>(`lead_dash_${localToday}`);

  const [dashboard, setDashboard] = useState<LeadDashboard | null>(() => cachedDash || null);
  const [loading, setLoading] = useState(!cachedDash);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Individual Member Detail State
  const [memberDetail, setMemberDetail] = useState<MemberDetailProgress | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);

  // Member Management Edit State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editRole, setEditRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [editTeamName, setEditTeamName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [memberSaveSuccess, setMemberSaveSuccess] = useState<string | null>(null);
  const [memberSaveError, setMemberSaveError] = useState<string | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(true);

  // Sorting & Search for All Members View
  const [sortField, setSortField] = useState<SortField>('overallProgressPct');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboard = async () => {
    try {
      if (!dashboard && !cacheStore.get<LeadDashboard>(`lead_dash_${localToday}`)) {
        setLoading(true);
      }
      const data = await api.getLeadDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load lead dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  // Load Member Detail when a specific member is selected in the dropdown
  useEffect(() => {
    if (!selectedMemberId) {
      setMemberDetail(null);
      return;
    }

    const fetchMemberDetail = async () => {
      try {
        setLoadingMember(true);
        const detail = await api.getMemberDetailProgress(selectedMemberId);
        setMemberDetail(detail);
      } catch (err) {
        console.error('Failed to load member detail:', err);
      } finally {
        setLoadingMember(false);
      }
    };

    fetchMemberDetail();
  }, [selectedMemberId]);

  // Sync member management form when member or dashboard changes
  useEffect(() => {
    if (selectedMemberId && dashboard) {
      const rosterItem = dashboard.memberRoster?.find((m) => m.userId === selectedMemberId);
      if (rosterItem) {
        setEditName(rosterItem.name);
        setEditEmail(rosterItem.email);
        setEditSerial(rosterItem.serialNumber || (rosterItem.teamName ? `${rosterItem.teamName.toUpperCase()}-00${rosterItem.userId}` : ''));
        setEditRole((rosterItem.role as 'LEAD' | 'MEMBER') || 'MEMBER');
        setEditTeamName(rosterItem.teamName || dashboard.teamName || '');
        setEditPosition(rosterItem.position || 'Engineering / Development');
        setMemberSaveSuccess(null);
        setMemberSaveError(null);
      }
    }
  }, [selectedMemberId, dashboard]);

  const handleSaveMemberManagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    if (!editName.trim()) {
      setMemberSaveError('Full Name cannot be empty.');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      setMemberSaveError('Please enter a valid email address.');
      return;
    }

    setSavingMember(true);
    setMemberSaveError(null);
    setMemberSaveSuccess(null);

    try {
      await api.updateTeamMember(selectedMemberId, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        serialNumber: editSerial.trim(),
        role: editRole,
        teamName: editTeamName.trim(),
        position: editPosition.trim(),
      });
      setMemberSaveSuccess('Member profile & team settings persisted successfully in PostgreSQL.');
      // Refresh lead dashboard and member telemetry
      await fetchDashboard();
      const detail = await api.getMemberDetailProgress(selectedMemberId);
      setMemberDetail(detail);
    } catch (err: any) {
      setMemberSaveError(err.message || 'Failed to update member information.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleCancelMemberManagement = () => {
    if (selectedMemberId && dashboard) {
      const rosterItem = dashboard.memberRoster?.find((m) => m.userId === selectedMemberId);
      if (rosterItem) {
        setEditName(rosterItem.name);
        setEditEmail(rosterItem.email);
        setEditSerial(rosterItem.serialNumber || (rosterItem.teamName ? `${rosterItem.teamName.toUpperCase()}-00${rosterItem.userId}` : ''));
        setEditRole((rosterItem.role as 'LEAD' | 'MEMBER') || 'MEMBER');
        setEditTeamName(rosterItem.teamName || dashboard.teamName || '');
        setEditPosition(rosterItem.position || 'Engineering / Development');
      }
    }
    setMemberSaveError(null);
    setMemberSaveSuccess(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-[11px] px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-sm font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>On Track</span>
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-[11px] px-2.5 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/30 rounded-sm font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>At Risk</span>
          </span>
        );
      case 'NEEDS_ATTENTION':
      default:
        return (
          <span className="inline-flex items-center space-x-1 font-mono text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-sm font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Needs Attention</span>
          </span>
        );
    }
  };

  if (loading || !dashboard) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center py-20 text-muted font-mono text-xs space-y-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Loading Team Cockpit telemetry...</span>
        </div>
      </div>
    );
  }

  const filteredRoster = dashboard.memberRoster.filter((m) => {
    return (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.currentTopicTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const sortedRoster = [...filteredRoster].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'boolean') {
      return sortAsc ? (valA === valB ? 0 : valA ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  return (
    <PageContainer width="wide" className="space-y-6 font-sans">
      {/* 1. TOP HEADER */}
      <div className="border border-line bg-paper-light p-4 sm:p-6 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-lg sm:text-xl font-bold text-ink uppercase tracking-tight">
              Team Cockpit — Team Progress
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-paper-dark border border-line rounded-xs text-muted">
              {dashboard.teamName}
            </span>
          </div>
          <p className="text-xs text-muted mt-1 font-normal">
            Monitor individual progress, activity, and pending work across the team.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="p-2 bg-paper-light border border-line hover:border-ink rounded-sm text-muted hover:text-ink transition-colors flex items-center space-x-1.5 text-xs font-mono shadow-2xs"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <span className="font-mono text-xs px-3 py-1.5 bg-primary-soft text-primary border border-primary/20 rounded-sm font-semibold flex items-center space-x-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>{dashboard.totalMembers} Enrolled Members</span>
          </span>
        </div>
      </div>

      {/* 2. INDIVIDUAL MEMBER SELECTOR DROPDOWN (PRIMARY CONTROL) */}
      <div className="border border-line bg-paper-light p-4 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-3 w-full sm:w-auto">
          <label className="font-mono text-xs font-bold text-ink shrink-0 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-primary" />
            <span>Select Member:</span>
          </label>
          <select
            value={selectedMemberId || 'ALL'}
            onChange={(e) => setSelectedMemberId(e.target.value === 'ALL' ? null : Number(e.target.value))}
            className="p-2.5 bg-paper-dark border border-line rounded-sm text-xs font-mono font-semibold text-ink focus-ring w-full sm:w-auto sm:min-w-[240px] cursor-pointer"
          >
            <option value="ALL">All Members ({dashboard.totalMembers})</option>
            {dashboard.memberRoster.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        {selectedMemberId && (
          <button
            onClick={() => setSelectedMemberId(null)}
            className="px-3 py-1.5 bg-paper-dark border border-line hover:border-ink rounded-sm text-xs font-mono text-muted hover:text-ink transition-colors flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>← Back to All Members Overview</span>
          </button>
        )}
      </div>

      {/* 3. VIEW MODE A: ALL MEMBERS VIEW */}
      {!selectedMemberId && (
        <div className="space-y-6">
          {/* Top Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricBox
              label="Active Today"
              value={`${dashboard.activeTodayCount}/${dashboard.totalMembers}`}
              subtext={`${dashboard.attendancePct}% attendance`}
              badge="Daily"
            />
            <MetricBox
              label="Standups Submitted"
              value={`${dashboard.standupsSubmittedToday}/${dashboard.totalMembers}`}
              subtext={`${dashboard.standupRatePct}% compliance`}
              badge="Standup"
            />
            <MetricBox
              label="Tasks Completed"
              value={`${dashboard.tasksCompleted}/${dashboard.totalTasks}`}
              subtext={`${dashboard.teamTaskCompletionPct}% done`}
              badge="Kanban"
            />
            <MetricBox
              label="Homework Submitted"
              value={`${dashboard.homeworkSubmittedCount}`}
              subtext={`${dashboard.totalHomework} active assignments`}
              badge="Homework"
            />
          </div>

          {/* TEAM OVERVIEW TABLE / CARD LIST */}
          <div className="border border-line bg-paper rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper-dark">
              <div>
                <h2 className="font-display text-sm font-bold text-ink">
                  Team Overview
                </h2>
                <p className="font-mono text-[11px] text-muted">
                  Real progress telemetry for all {dashboard.totalMembers} enrolled members
                </p>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-paper border border-line rounded-sm text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-accent w-full sm:w-48"
                />
              </div>
            </div>

            {/* Desktop Table View (hidden on md-) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-paper-light font-mono text-[11px] text-muted">
                    <th
                      onClick={() => handleSort('name')}
                      className="p-3 font-medium cursor-pointer hover:text-ink"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Member</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('taskCompletionPct')}
                      className="p-3 font-medium cursor-pointer hover:text-ink text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Kanban</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3 font-medium text-center">Homework</th>
                    <th
                      onClick={() => handleSort('standupSubmittedToday')}
                      className="p-3 font-medium cursor-pointer hover:text-ink text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Standup</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('overallProgressPct')}
                      className="p-3 font-medium cursor-pointer hover:text-ink text-center"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Overall</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="p-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-sans">
                  {sortedRoster.map((m: MemberRosterItem) => (
                    <tr
                      key={m.userId}
                      onClick={() => setSelectedMemberId(m.userId)}
                      className="hover:bg-paper-dark transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-sm bg-accent text-paper font-mono font-bold text-xs flex items-center justify-center">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-medium text-ink block">{m.name}</span>
                            <span className="font-mono text-[10px] text-muted">{m.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-ink">{m.taskCompletionPct}%</span>
                        <span className="font-mono text-[10px] text-muted block">
                          {m.completedTasks}/{m.totalTasks} done
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {m.homeworkTotalCount > 0 ? (
                          <>
                            <span className="font-mono font-bold text-ink">
                              {Math.round((m.homeworkSubmittedCount * 100) / m.homeworkTotalCount)}%
                            </span>
                            <span className="font-mono text-[10px] text-muted block">
                              {m.homeworkSubmittedCount}/{m.homeworkTotalCount} submitted
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-[10px] text-muted">No Homework</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {m.standupSubmittedToday ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-sm font-semibold inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-sm inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="w-24 mx-auto space-y-1">
                          <span className="font-mono font-bold text-accent text-xs">{m.overallProgressPct}%</span>
                          <ProgressBar progressPct={m.overallProgressPct} />
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMemberId(m.userId);
                          }}
                          className="px-2.5 py-1 bg-paper border border-line hover:border-ink rounded-sm text-[11px] font-medium text-ink transition-colors"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (shown on md-) */}
            <div className="md:hidden divide-y divide-line font-sans">
              {sortedRoster.map((m: MemberRosterItem) => (
                <div
                  key={m.userId}
                  onClick={() => setSelectedMemberId(m.userId)}
                  className="p-4 space-y-3 hover:bg-paper-dark/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-sm bg-accent text-paper font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-ink text-xs block truncate">{m.name}</span>
                        <span className="font-mono text-[10px] text-muted block truncate">{m.email}</span>
                      </div>
                    </div>
                    {m.standupSubmittedToday ? (
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-sm font-semibold inline-flex items-center space-x-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-sm inline-flex items-center space-x-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-paper-dark/40 p-2.5 rounded-xs border border-line">
                    <div>
                      <span className="text-[10px] text-muted uppercase block">Kanban</span>
                      <span className="font-bold text-ink">{m.taskCompletionPct}%</span>
                      <span className="text-[10px] text-muted block">({m.completedTasks}/{m.totalTasks} done)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted uppercase block">Homework</span>
                      <span className="font-bold text-ink">
                        {m.homeworkTotalCount > 0 ? `${Math.round((m.homeworkSubmittedCount * 100) / m.homeworkTotalCount)}%` : 'None'}
                      </span>
                      <span className="text-[10px] text-muted block">({m.homeworkSubmittedCount}/{m.homeworkTotalCount})</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-muted">Overall Progress</span>
                      <span className="font-bold text-accent">{m.overallProgressPct}%</span>
                    </div>
                    <ProgressBar progressPct={m.overallProgressPct} />
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMemberId(m.userId);
                      }}
                      className="w-full sm:w-auto px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-sm text-xs font-mono font-medium text-ink transition-colors text-center"
                    >
                      Inspect Member Progress →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Needs Attention Ledger */}
          <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-display text-sm font-bold text-ink">
                  Needs Attention
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted">
                Items requiring Lead guidance
              </span>
            </div>

            {dashboard.needsAttention && dashboard.needsAttention.length > 0 ? (
              <div className="divide-y divide-line">
                {dashboard.needsAttention.map((item: AttentionItem, idx: number) => (
                  <div
                    key={idx}
                    className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-7 h-7 rounded-sm bg-paper-dark border border-line text-ink font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {item.memberName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-ink">{item.memberName}</span>
                          <span
                            className={`font-mono text-[9px] px-1.5 py-0.2 rounded-sm uppercase font-semibold ${
                              item.severity === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                            }`}
                          >
                            {item.issueType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted font-sans mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedMemberId(item.userId)}
                      className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-sm text-xs font-medium text-ink transition-colors flex items-center space-x-1 shadow-none self-start sm:self-auto shrink-0"
                    >
                      <span>View Member</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted font-mono text-xs">
                No issues requiring attention.
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="border border-line bg-paper rounded-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between bg-paper-dark">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-muted" />
                <h2 className="font-display text-sm font-bold text-ink">
                  Recent Activity
                </h2>
              </div>
              <span className="font-mono text-xs text-muted">
                Live team telemetry
              </span>
            </div>

            <div className="divide-y divide-line font-mono text-[11px]">
              {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
                dashboard.recentActivity.slice(0, 8).map((act) => (
                  <div
                    key={act.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-paper-dark transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-ink">{act.changedByName}</span>
                      <span className="text-muted">updated</span>
                      <span className="font-medium text-ink truncate max-w-[200px]">
                        "{act.taskTitle}"
                      </span>
                      <span className="text-muted">· {act.fieldChanged}</span>
                      {act.oldValue && (
                        <span className="text-muted line-through">{act.oldValue}</span>
                      )}
                      <span className="text-accent font-semibold">→ {act.newValue}</span>
                    </div>
                    <span className="text-muted text-[10px] whitespace-nowrap self-start sm:self-auto">
                      {act.changedAt.substring(11, 16)} UTC
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted font-mono text-xs">
                  No recent activity.
                </div>
              )}
            </div>
          </div>

          {/* 4. DYNAMIC TEAM IDENTITY & MEMBER MANAGEMENT SECTION */}
          <TeamManagementSection />

          {/* 5. LEADERSHIP ROTATION & SCHEDULE SECTION */}
          <LeadershipRotationSection />

          {/* 6. MONTHLY LECTURER REPORT & PERFORMANCE EVALUATION SECTION */}
          <MonthlyLecturerReportSection />
        </div>
      )}

      {/* 4. VIEW MODE B: INDIVIDUAL MEMBER VIEW */}
      {selectedMemberId && (
        <div className="space-y-6">
          {loadingMember || !memberDetail ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted font-mono text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Loading member telemetry...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Member Banner */}
              <div className="border border-line bg-paper p-5 rounded-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-sm bg-accent text-paper font-mono font-bold text-xl flex items-center justify-center shadow-xs">
                      {memberDetail.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h2 className="font-display text-lg font-bold text-ink">
                          {memberDetail.name}
                        </h2>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-paper-dark border border-line rounded-sm text-muted">
                          {memberDetail.role}
                        </span>
                        {getStatusBadge(memberDetail.status)}
                      </div>
                      <p className="font-mono text-xs text-muted mt-0.5">
                        {memberDetail.email} · {memberDetail.teamName} Cohort
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowMemberManagement(!showMemberManagement)}
                      className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      <Settings className="w-3.5 h-3.5 text-accent" />
                      <span>{showMemberManagement ? 'Hide Management' : 'Manage Member'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-muted pt-1">
                  <span>Individual Progress & Activity Telemetry</span>
                  <span className="font-bold text-ink">Diagnosis: {memberDetail.statusReason}</span>
                </div>
              </div>

              {/* LEAD MEMBER MANAGEMENT FORM */}
              {showMemberManagement && (
                <div className="border border-line bg-paper p-6 rounded-sm space-y-5 shadow-2xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-accent" />
                      <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                        Member Management — {memberDetail.name}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] text-muted">
                      Changes persist directly to PostgreSQL
                    </span>
                  </div>

                  {memberSaveSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xs text-xs font-mono flex items-center space-x-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{memberSaveSuccess}</span>
                    </div>
                  )}

                  {memberSaveError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-800 rounded-xs text-xs font-mono flex items-center space-x-2 animate-fade-in">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{memberSaveError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveMemberManagement} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Member Full Name"
                          className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none font-medium"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="member@domain.com"
                          className="w-full px-3 py-2 text-xs font-mono bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none"
                          required
                        />
                      </div>

                      {/* Crew Serial ID */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                          <span>Crew Serial ID</span>
                          <span className="text-[9px] text-accent font-mono">e.g. STACK-002, PHOENIX-003</span>
                        </label>
                        <input
                          type="text"
                          value={editSerial}
                          onChange={(e) => setEditSerial(e.target.value)}
                          placeholder="STACK-002"
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-paper border border-line rounded-xs text-emerald-800 focus:border-ink outline-none"
                        />
                      </div>

                      {/* Role */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
                          Team Security Role
                        </label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as 'LEAD' | 'MEMBER')}
                          className="w-full px-3 py-2 text-xs font-mono bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none cursor-pointer"
                        >
                          <option value="MEMBER">MEMBER (Standard Workspace Access)</option>
                          <option value="LEAD">LEAD (Team Lead / Captain Privileges)</option>
                        </select>
                      </div>

                      {/* Organization / Team */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
                          Assigned Team / Organization
                        </label>
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          placeholder="STACK"
                          className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none font-medium"
                        />
                      </div>

                      {/* Position / Designation */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider">
                          Position / Designation
                        </label>
                        <input
                          type="text"
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          placeholder="Backend Engineer / SDE Intern"
                          className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-line">
                      <button
                        type="button"
                        onClick={handleCancelMemberManagement}
                        disabled={savingMember}
                        className="px-4 py-1.5 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-muted hover:text-ink transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>

                      <button
                        type="submit"
                        disabled={savingMember}
                        className="px-5 py-1.5 bg-ink text-paper hover:bg-ink/90 rounded-xs font-mono text-xs font-bold transition-colors shadow-2xs flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5 text-accent" />
                        <span>{savingMember ? 'Saving to Database...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 3 Member Summary Cards (REAL DATA ONLY) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Kanban Tasks Summary Card */}
                <div className="p-4 bg-paper border border-line rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted uppercase">Kanban Tasks</span>
                    <ListTodo className="w-3.5 h-3.5 text-accent" />
                  </div>
                  {memberDetail.taskList && memberDetail.taskList.length > 0 ? (
                    <>
                      <div className="font-mono text-lg font-bold text-ink">
                        {memberDetail.tasksCompletedCount} / {memberDetail.taskList.length} Completed
                      </div>
                      <span className="font-mono text-xs text-accent font-semibold block">
                        {Math.round((memberDetail.tasksCompletedCount * 100) / memberDetail.taskList.length)}% Sprint Velocity
                      </span>
                    </>
                  ) : (
                    <div className="py-2 text-xs text-muted font-mono">
                      No tasks assigned yet.
                    </div>
                  )}
                </div>

                {/* Homework Summary Card */}
                <div className="p-4 bg-paper border border-line rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted uppercase">Homework</span>
                    <FileCode className="w-3.5 h-3.5 text-accent" />
                  </div>
                  {memberDetail.homeworkList && memberDetail.homeworkList.length > 0 ? (
                    <>
                      <div className="font-mono text-lg font-bold text-ink">
                        {memberDetail.homeworkSubmittedCount} / {memberDetail.homeworkList.length} Submitted
                      </div>
                      <span className="font-mono text-xs text-accent font-semibold block">
                        {Math.round((memberDetail.homeworkSubmittedCount * 100) / memberDetail.homeworkList.length)}% Submitted
                      </span>
                    </>
                  ) : (
                    <div className="py-2 text-xs text-muted font-mono">
                      No homework assigned yet.
                    </div>
                  )}
                </div>

                {/* Daily Standup Summary Card */}
                <div className="p-4 bg-paper border border-line rounded-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted uppercase">Daily Standup</span>
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                  </div>
                  {memberDetail.recentStandupHistory && memberDetail.recentStandupHistory.length > 0 ? (
                    <>
                      <div className="font-mono text-lg font-bold text-ink">
                        {memberDetail.recentStandupHistory.length} Days Logged
                      </div>
                      <span className="font-mono text-xs text-emerald-600 font-semibold block">
                        Today: {memberDetail.standupSubmittedToday ? 'Submitted ✓' : 'Pending —'}
                      </span>
                    </>
                  ) : (
                    <div className="py-2 text-xs text-muted font-mono">
                      No standup history available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Overview Visualization (Real Data Only) */}
              <div className="border border-line bg-paper p-5 rounded-sm space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Progress Overview Breakdown
                  </h3>
                  <span className="font-mono text-xs font-bold text-accent">
                    {memberDetail.overallProgressPct}% Combined Telemetry
                  </span>
                </div>

                <div className="space-y-3">
                  {memberDetail.taskList && memberDetail.taskList.length > 0 && (
                    <div>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span className="text-ink font-medium">Kanban Sprint Velocity</span>
                        <span className="font-bold text-ink">
                          {Math.round((memberDetail.tasksCompletedCount * 100) / memberDetail.taskList.length)}%
                        </span>
                      </div>
                      <ProgressBar progressPct={Math.round((memberDetail.tasksCompletedCount * 100) / memberDetail.taskList.length)} />
                    </div>
                  )}

                  {memberDetail.homeworkList && memberDetail.homeworkList.length > 0 && (
                    <div>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span className="text-ink font-medium">Homework Submissions</span>
                        <span className="font-bold text-ink">
                          {Math.round((memberDetail.homeworkSubmittedCount * 100) / memberDetail.homeworkList.length)}%
                        </span>
                      </div>
                      <ProgressBar progressPct={Math.round((memberDetail.homeworkSubmittedCount * 100) / memberDetail.homeworkList.length)} />
                    </div>
                  )}
                </div>
              </div>

              {/* KANBAN TASK PROGRESS SECTION */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Kanban Task Progress
                  </h3>
                  <span className="font-mono text-xs text-muted">
                    {memberDetail.tasksCompletedCount} Completed · {memberDetail.tasksInProgressCount} In Progress · {memberDetail.tasksPendingCount} Pending
                  </span>
                </div>

                {memberDetail.taskList && memberDetail.taskList.length > 0 ? (
                  <div className="space-y-2">
                    {memberDetail.taskList.map((t) => (
                      <div key={t.id} className="p-3 bg-paper-light border border-line rounded-sm space-y-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-ink block">{t.title}</span>
                            {t.description && <p className="text-xs text-muted font-sans line-clamp-1">{t.description}</p>}
                          </div>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase ${
                              t.status === 'DONE'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                                : 'bg-paper-dark text-muted border border-line'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-muted pt-1 border-t border-line">
                          <span>Deadline: {t.deadline || 'No deadline'}</span>
                          <span>Progress: {t.progressPct || 0}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted font-mono text-xs">
                    No tasks assigned yet.
                  </div>
                )}
              </div>

              {/* HOMEWORK PROGRESS SECTION */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Homework Progress
                  </h3>
                  <span className="font-mono text-xs text-muted">
                    {memberDetail.homeworkList ? memberDetail.homeworkList.length : 0} Assigned · {memberDetail.homeworkSubmittedCount} Submitted
                  </span>
                </div>

                {memberDetail.homeworkList && memberDetail.homeworkList.length > 0 ? (
                  <div className="space-y-2">
                    {memberDetail.homeworkList.map((hw) => (
                      <div key={hw.homeworkId} className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-ink block">{hw.title}</span>
                            <span className="font-mono text-[10px] text-muted">Subject: {hw.subject} · Due: {hw.dueDate}</span>
                          </div>
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-sm font-semibold ${
                              hw.submissionStatus === 'REVIEWED'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                : hw.submissionStatus === 'SUBMITTED'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                            }`}
                          >
                            {hw.submissionStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted font-mono text-xs">
                    No homework assigned yet.
                  </div>
                )}
              </div>

              {/* DAILY STANDUP SECTION */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <h3 className="font-display text-sm font-bold text-ink">
                      Daily Standup Activity
                    </h3>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs border ${
                    memberDetail.standupSubmittedToday
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                      : 'bg-paper-dark border-line text-muted'
                  }`}>
                    Today: {memberDetail.standupSubmittedToday ? 'Submitted ✓' : 'Pending —'}
                  </span>
                </div>

                {/* 7-Day Dynamic Weekly Activity from Database */}
                {(() => {
                  const todayObj = new Date();
                  const currentDayOfWeek = (todayObj.getDay() + 6) % 7; // Mon=0, Sun=6
                  const monday = new Date(todayObj);
                  monday.setDate(todayObj.getDate() - currentDayOfWeek);

                  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + idx);
                    const dateStr = d.toISOString().split('T')[0];
                    const hasSubmission = (memberDetail.recentStandupHistory || []).some((s) => s.date === dateStr);
                    const isToday = idx === currentDayOfWeek;
                    const isPast = idx < currentDayOfWeek;

                    return { dayName, dateStr, hasSubmission, isToday, isPast };
                  });

                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                        <span className="uppercase font-bold">This Week's Activity (Mon–Sun)</span>
                        <span>{weekDays.filter(w => w.hasSubmission).length}/7 Active</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center font-mono text-[9px] sm:text-[10px]">
                        {weekDays.map((w, idx) => (
                          <div
                            key={idx}
                            className={`p-1 sm:p-2 border rounded-xs transition-colors ${
                              w.hasSubmission
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                                : w.isToday
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                                : 'bg-paper-dark border-line text-muted'
                            }`}
                          >
                            <span className="block font-bold">{w.dayName}</span>
                            <span className="block text-[9px] text-muted">{w.dateStr.slice(5)}</span>
                            <span className="block font-black text-xs pt-0.5">
                              {w.hasSubmission ? '✓' : w.isToday ? '—' : w.isPast ? '×' : '·'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* TODAY'S SUBMISSION DETAIL (VOICE PLAYER + WRITTEN ANSWERS) */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayStandup = (memberDetail.recentStandupHistory || []).find((s) => s.date === todayStr);

                  if (!todayStandup) {
                    return (
                      <div className="p-4 bg-paper-dark/50 border border-dashed border-line rounded-xs text-center space-y-1 font-mono text-xs text-muted">
                        <div>No standup submitted by {memberDetail.name} for today yet.</div>
                      </div>
                    );
                  }

                  const hasVoice = Boolean(todayStandup.hasVoiceRecording || todayStandup.submissionType === 'VOICE');

                  return (
                    <div className="p-4 bg-paper-light border border-line rounded-xs space-y-3 font-sans text-xs">
                      <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-ink text-xs">
                            Today's Submission ({todayStandup.date})
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xs text-[10px] font-bold">
                            ✓ Submitted
                          </span>
                          <span className="text-muted text-[10px]">
                            {hasVoice ? '🎙 Voice Standup' : '⌨ Typed Standup'}
                          </span>
                        </div>
                        {todayStandup.id && (
                          <button
                            type="button"
                            onClick={() => api.downloadStandupPdf(todayStandup.id)}
                            className="px-2 py-0.5 border border-line hover:border-ink rounded-xs text-[10px] text-ink hover:bg-paper transition-colors flex items-center space-x-1"
                            title="Download Standup PDF"
                          >
                            <FileDown className="w-3 h-3 text-accent" />
                            <span>PDF</span>
                          </button>
                        )}
                      </div>

                      {/* VOICE AUDIO PLAYER */}
                      {hasVoice && todayStandup.id && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 font-mono text-[11px] text-muted">
                            <Mic className="w-3.5 h-3.5 text-accent" />
                            <span className="font-bold text-ink">Voice Recording Playback:</span>
                          </div>
                          <StandupAudioPlayer
                            standupId={todayStandup.id}
                            initialDurationSeconds={todayStandup.audioDurationSeconds || undefined}
                            title={`Standup Voice • ${memberDetail.name}`}
                          />
                        </div>
                      )}

                      {/* WRITTEN FIELDS GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-paper rounded-xs border border-line space-y-0.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                            1. Accomplished Yesterday
                          </span>
                          <p className="text-ink font-medium leading-relaxed">
                            {todayStandup.yesterday || '(Voice update submitted)'}
                          </p>
                        </div>

                        <div className="p-2.5 bg-paper rounded-xs border border-line space-y-0.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                            2. Working on Today
                          </span>
                          <p className="text-ink font-medium leading-relaxed">
                            {todayStandup.today || '(Voice update submitted)'}
                          </p>
                        </div>

                        <div className="p-2.5 bg-paper rounded-xs border border-line space-y-0.5">
                          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                            3. Key Concept Learned
                          </span>
                          <p className="text-ink font-medium leading-relaxed">
                            {todayStandup.learned || '(Voice update submitted)'}
                          </p>
                        </div>

                        <div className={`p-2.5 bg-paper rounded-xs border space-y-0.5 ${
                          todayStandup.blockers ? 'border-red-500/40 bg-red-500/5' : 'border-line'
                        }`}>
                          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                            4. Blockers & Technical Hurdles
                          </span>
                          <p className={todayStandup.blockers ? 'text-red-700 font-bold leading-relaxed' : 'text-muted font-mono'}>
                            {todayStandup.blockers || 'None reported'}
                          </p>
                        </div>
                      </div>

                      {/* Confidence & Question for Lead */}
                      <div className="p-2.5 bg-paper rounded-xs border border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-mono text-xs">
                        <div>
                          <span className="text-muted">Confidence Rating: </span>
                          <span className="font-bold text-ink">
                            {todayStandup.confidenceLabel || `${todayStandup.confidence || 4}/5`}
                          </span>
                        </div>

                        {todayStandup.questionForLead && (
                          <div className="text-ink">
                            <span className="text-muted font-mono text-[11px]">Note for Lead: </span>
                            <span className="italic font-sans text-xs">"{todayStandup.questionForLead}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* PAST STANDUP HISTORY */}
                {memberDetail.recentStandupHistory && memberDetail.recentStandupHistory.length > 1 && (
                  <div className="space-y-2 pt-2 border-t border-line">
                    <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                      Previous Standup Logs
                    </span>
                    <div className="space-y-2">
                      {memberDetail.recentStandupHistory.slice(1, 4).map((st) => (
                        <div key={st.id} className="p-2.5 bg-paper-light border border-line rounded-xs text-xs space-y-1.5 font-sans">
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                            <span className="font-bold text-ink">{st.date}</span>
                            <div className="flex items-center space-x-2">
                              <span>{st.primaryInputMethod === 'voice' || st.hasVoiceRecording ? '🎙 Voice' : '⌨ Typed'}</span>
                              <span>·</span>
                              <span>Confidence: {st.confidence || 4}/5</span>
                            </div>
                          </div>
                          {(st.hasVoiceRecording || st.submissionType === 'VOICE') && st.id && (
                            <StandupAudioPlayer
                              standupId={st.id}
                              initialDurationSeconds={st.audioDurationSeconds || undefined}
                              compact={true}
                              title={`${st.date} Voice`}
                            />
                          )}
                          <p className="text-ink"><strong>Accomplished:</strong> {st.yesterday}</p>
                          <p className="text-ink"><strong>Focus:</strong> {st.today}</p>
                          {st.blockers && <p className="text-red-700"><strong>Blocker:</strong> {st.blockers}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RECENT ACTIVITY TIMELINE */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                <div className="border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Recent Activity
                  </h3>
                  <p className="font-mono text-[11px] text-muted">
                    Actual application events logged for {memberDetail.name}
                  </p>
                </div>

                {memberDetail.activityPoints && memberDetail.activityPoints.length > 0 ? (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-line font-mono text-xs">
                    {memberDetail.activityPoints.slice(0, 10).map((act, i) => (
                      <div key={i} className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-paper" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-ink">{act.title}</span>
                          <span className="text-[10px] text-muted">
                            {act.timestamp ? `${act.timestamp.substring(0, 10)}` : ''}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-muted font-sans text-[11px] bg-paper-dark p-2 rounded-sm border border-line">
                            {act.description}
                          </p>
                        )}
                        {act.type === 'STANDUP' && (act.hasVoiceRecording || act.submissionType === 'VOICE') && act.standupId && (
                          <StandupAudioPlayer
                            standupId={act.standupId}
                            initialDurationSeconds={act.audioDurationSeconds}
                            compact={true}
                            title="Voice Standup Recording"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted font-mono text-xs">
                    No recent activity.
                  </div>
                )}
              </div>

              {/* NEEDS ATTENTION SECTION */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                <div className="border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Needs Attention
                  </h3>
                </div>

                {memberDetail.openBlockers && memberDetail.openBlockers.length > 0 ? (
                  <div className="space-y-2">
                    {memberDetail.openBlockers.map((b) => (
                      <div key={b.id} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-sm space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-rose-600">{b.title}</span>
                          <span className="font-mono text-[10px] text-muted">{b.category}</span>
                        </div>
                        <p className="text-xs text-ink">{b.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted font-mono text-xs">
                    No issues requiring attention.
                  </div>
                )}
              </div>

              {/* PROGRESS TREND SECTION */}
              <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                <div className="border-b border-line pb-2.5">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Progress Trend
                  </h3>
                </div>
                <div className="py-6 text-center text-muted font-mono text-xs">
                  Not enough historical data for a progress trend.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
