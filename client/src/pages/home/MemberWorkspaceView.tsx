import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore, getLocalTodayDateString } from '../../services/api';
import { MemberDashboard, Standup, TeamMeeting } from '../../types';
import { DailyStandupModal } from '../standup/DailyStandupModal';
import { StandupAudioPlayer } from '../../components/common/StandupAudioPlayer';
import { AskLeadModal } from '../../components/common/AskLeadModal';
import { LeaveEmailModal } from '../../components/common/LeaveEmailModal';
import { TeamMeetingCard } from '../../components/team/TeamMeetingCard';
import {
  getTimeGreeting,
  getPersonalDailyContext,
  getFormattedTodayDate,
} from '../../utils/greetingEngine';
import {
  PenTool,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Calendar,
  MessageSquare,
  Mail,
  CheckSquare,
  Shield,
  ArrowRight,
  Zap,
  Mic,
  Video,
} from 'lucide-react';

interface MemberWorkspaceViewProps {
  onNavigateTab: (tab: string) => void;
}

export const MemberWorkspaceView: React.FC<MemberWorkspaceViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const isCurrentLead = Boolean(user?.isCurrentLead || user?.role === 'LEAD' || user?.role === 'ADMIN');
  const localToday = getLocalTodayDateString();
  const { fullTitle } = getFormattedTodayDate();

  const [data, setData] = useState<MemberDashboard | null>(() => cacheStore.get<MemberDashboard>(`member_dash_${localToday}`));
  const [history, setHistory] = useState<Standup[]>(() => cacheStore.get<Standup[]>('standup_history') || []);
  const [upcomingMeeting, setUpcomingMeeting] = useState<TeamMeeting | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !cacheStore.get<MemberDashboard>(`member_dash_${localToday}`));
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [standupModalOpen, setStandupModalOpen] = useState(false);
  const [standupModalMode, setStandupModalMode] = useState<'WRITE' | 'VOICE' | 'VIEW'>('WRITE');
  const [standupModalViewOnly, setStandupModalViewOnly] = useState(false);
  const [standupModalEditing, setStandupModalEditing] = useState(false);
  const [askLeadOpen, setAskLeadOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [viewStandupModalOpen, setViewStandupModalOpen] = useState(false);
  const [viewStandupTarget, setViewStandupTarget] = useState<Standup | null>(null);
  const [viewStandupTitle, setViewStandupTitle] = useState<string>('Daily Standup');

  // Secondary Tab for Standup & Messages
  const [activeCommsTab, setActiveCommsTab] = useState<'STANDUPS' | 'MESSAGES'>('STANDUPS');

  const loadData = async (silent = false) => {
    try {
      if (!silent && !data) {
        setLoading(true);
      }
      setError(null);
      const [dash, hist, meet] = await Promise.all([
        api.getMemberDashboard(localToday),
        api.getStandupHistory(),
        api.getUpcomingMeeting().catch(() => null),
      ]);
      setData(dash);
      setHistory(hist || []);
      setUpcomingMeeting(meet);
      const isStandupDone = Boolean(dash?.todayStandup && (dash.todayStandup.id != null || dash.todayStandup.submittedAt != null));
      window.dispatchEvent(new CustomEvent('jvm_standup_status_synced', { detail: { isDone: isStandupDone } }));
    } catch (err: any) {
      if (!data) {
        console.error('Failed to load Member workspace data:', err);
        setError(err?.message || 'Failed to connect to workspace');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(Boolean(data));
    const handleStandupSubmitted = () => {
      loadData(true);
    };
    window.addEventListener('jvm_standup_submitted', handleStandupSubmitted);
    return () => {
      window.removeEventListener('jvm_standup_submitted', handleStandupSubmitted);
    };
  }, [user?.id]);

  const formatLocalTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoString.substring(11, 16);
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted flex flex-col items-center justify-center space-y-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span>Loading workspace command center...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4 px-4">
        <div className="p-4 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-sm">
          <p className="font-bold">Workspace Connection Error</p>
          <p className="mt-1 font-mono text-[11px]">{error}</p>
        </div>
        <button
          onClick={() => loadData()}
          className="px-5 py-2.5 bg-ink text-paper text-xs font-mono font-semibold rounded-sm hover:bg-ink-light transition-all shadow-sm"
        >
          Retry Loading Workspace
        </button>
      </div>
    );
  }

  if (!data || !user) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Initializing workspace...</span>
      </div>
    );
  }

  const isSubmittedToday = Boolean(data.standupDoneToday || data.todayStandup);
  const todayStandup = data.todayStandup;

  const greetingTitle = getTimeGreeting(user.name);
  const dailyContext = getPersonalDailyContext({
    role: user.role,
    openBlockers: data.openBlockersCount,
    overdueTasks: data.overdueTasksCount,
    tasksDueToday: data.tasksDueTodayCount,
    pendingHomework: data.pendingHomeworkCount,
    openTasks: data.openTasksCount,
    standupDone: isSubmittedToday,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans animate-fade-in pb-10">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO BAR (Clean, modern, uncluttered header)                  */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-paper-light via-paper to-paper-dark/40 border border-line rounded-xl p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden transition-all duration-300 hover:shadow-card-hover group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/6 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4 group-hover:scale-105 transition-transform duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          {/* Left: Greeting & Context */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="font-bold px-2.5 py-0.5 rounded-md bg-paper border border-line text-ink shadow-2xs">
                {user.serialNumber || data.serialNumber || 'MEMBER'}
              </span>
              <span className="text-muted/60">·</span>
              <span className="text-muted font-medium">{user.position || data.position || 'SDE Intern'}</span>
              <span className="text-muted/60">·</span>
              <span className="text-ink font-semibold px-2 py-0.5 rounded-md bg-paper-dark/60 border border-line/50">
                {data.teamName}
              </span>
              <span className="text-muted/60">·</span>
              <span className="text-muted">{fullTitle}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {greetingTitle}
            </h1>

            <div className="inline-flex items-center space-x-2 text-xs font-mono text-muted bg-paper-light/90 border border-line/70 px-3 py-1 rounded-full shadow-2xs">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate">{dailyContext}</span>
            </div>
          </div>

          {/* Right: Primary Fast Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isSubmittedToday ? (
              <button
                onClick={() => {
                  setStandupModalViewOnly(false);
                  setStandupModalEditing(false);
                  setStandupModalMode('WRITE');
                  setStandupModalOpen(true);
                }}
                className="px-4.5 py-2.5 bg-primary text-paper hover:bg-primary-hover active:scale-95 rounded-lg font-mono text-xs font-bold transition-all duration-150 flex items-center space-x-2 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-paper/90 animate-pulse" />
                <span>Submit Daily Standup</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setStandupModalViewOnly(true);
                  setStandupModalEditing(false);
                  setStandupModalMode('VIEW');
                  setStandupModalOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/15 active:scale-95 rounded-lg font-mono text-xs font-semibold transition-all duration-150 flex items-center space-x-2 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Standup Recorded ✓</span>
              </button>
            )}

            {!isCurrentLead && (
              <button
                onClick={() => setAskLeadOpen(true)}
                className="px-3.5 py-2 bg-paper hover:bg-paper-light active:scale-95 border border-line hover:border-primary/40 text-ink rounded-lg font-mono text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
                title="Send a quick question to your Team Lead"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Ask Lead</span>
              </button>
            )}

            <button
              onClick={() => setLeaveModalOpen(true)}
              className="p-2.5 bg-paper hover:bg-paper-light active:scale-95 border border-line hover:border-primary/40 text-muted hover:text-ink rounded-lg transition-all duration-150 shadow-2xs hover:-translate-y-0.5 cursor-pointer"
              title="Generate Leave Request Email"
              aria-label="Generate Leave Request Email"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CORE TELEMETRY METRICS (4 balanced, interactive KPI cards)              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* CARD 1: DAILY STANDUP */}
        <div
          onClick={() => {
            if (isSubmittedToday) {
              setStandupModalViewOnly(true);
              setStandupModalEditing(false);
              setStandupModalMode('VIEW');
            } else {
              setStandupModalViewOnly(false);
              setStandupModalEditing(false);
              setStandupModalMode('WRITE');
            }
            setStandupModalOpen(true);
          }}
          className={`p-4.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-card-hover hover:-translate-y-1 flex flex-col justify-between group ${
            isSubmittedToday
              ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-600'
              : 'bg-paper border-line hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">Daily Standup</span>
            <div className={`p-2 rounded-lg transition-all duration-200 ${
              isSubmittedToday
                ? 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
                : 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          
          <div className="py-2.5">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isSubmittedToday ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className={`font-mono text-xl font-black block leading-none tracking-tight ${
                isSubmittedToday ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {isSubmittedToday ? 'DONE ✓' : 'PENDING'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-line/60">
            <span className="font-mono text-[10px] text-muted truncate block">
              {isSubmittedToday && todayStandup?.submittedAt
                ? `Logged at ${formatLocalTime(todayStandup.submittedAt)}`
                : 'Action required today'}
            </span>
            <div className="w-full h-1 bg-line/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSubmittedToday ? 'w-full bg-emerald-500' : 'w-1/4 bg-amber-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: MY TASKS */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-4.5 bg-paper border border-line hover:border-primary/50 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-card-hover hover:-translate-y-1 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">My Tasks</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          
          <div className="py-2.5">
            <span className="font-mono text-3xl font-black text-ink block leading-none tracking-tight">
              {data.openTasksCount}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="truncate">
                {data.tasksDueTodayCount > 0
                  ? `${data.tasksDueTodayCount} due today`
                  : `${data.lifetimeCompletedTasks} completed lifetime`}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="w-full h-1 bg-line/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, ((data.lifetimeCompletedTasks || 0) / Math.max(1, (data.lifetimeCompletedTasks || 0) + (data.openTasksCount || 0))) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: HOMEWORK */}
        <div
          onClick={() => onNavigateTab('homework')}
          className="p-4.5 bg-paper border border-line hover:border-ochre/50 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-card-hover hover:-translate-y-1 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">Homework</span>
            <div className="p-2 rounded-lg bg-ochre/15 text-ochre group-hover:bg-ochre group-hover:text-white transition-all duration-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2.5">
            <span className="font-mono text-3xl font-black text-ink block leading-none tracking-tight">
              {data.pendingHomeworkCount}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="truncate">
                {data.totalHomeworkCount > 0
                  ? `${data.totalHomeworkCount - data.pendingHomeworkCount}/${data.totalHomeworkCount} assignments turned in`
                  : 'No assignments due'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="w-full h-1 bg-line/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-ochre transition-all duration-500"
                style={{
                  width: `${data.totalHomeworkCount > 0 ? Math.min(100, Math.max(8, ((data.totalHomeworkCount - data.pendingHomeworkCount) / data.totalHomeworkCount) * 100)) : 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 4: BLOCKERS */}
        <div
          onClick={() => {
            if (data.openBlockersCount > 0 && !isCurrentLead) {
              setAskLeadOpen(true);
            }
          }}
          className={`p-4.5 rounded-xl border transition-all duration-200 shadow-2xs flex flex-col justify-between ${
            data.openBlockersCount > 0
              ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500 cursor-pointer hover:shadow-card-hover hover:-translate-y-1 group'
              : 'bg-paper border-line'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">Blockers</span>
            <div className={`p-2 rounded-lg transition-all duration-200 ${
              data.openBlockersCount > 0
                ? 'bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white'
                : 'bg-paper-dark text-muted'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2.5">
            <span className={`font-mono text-3xl font-black block leading-none tracking-tight ${
              data.openBlockersCount > 0 ? 'text-rose-700' : 'text-ink'
            }`}>
              {data.openBlockersCount}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-line/60">
            <span className="font-mono text-[10px] text-muted truncate block">
              {data.openBlockersCount > 0 ? 'Requires Lead assistance' : 'No blockers flagged ✓'}
            </span>
            <div className="w-full h-1 bg-line/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.openBlockersCount > 0 ? 'w-full bg-rose-500' : 'w-full bg-emerald-500/50'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UPCOMING MEETING SPOTLIGHT (Rendered only when sync exists)             */}
      {/* ========================================================================= */}
      {upcomingMeeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-primary" />
              <span>Upcoming Team Meeting</span>
            </span>
            <button
              onClick={() => onNavigateTab('meetings')}
              className="text-xs font-mono text-primary hover:underline font-semibold"
            >
              All Syncs →
            </button>
          </div>
          <TeamMeetingCard meeting={upcomingMeeting} isHero={true} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BALANCED 2-COLUMN WORKSPACE (Left: Execution, Right: Standups & Sync)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================================= */}
        {/* LEFT COLUMN (7 cols): TODAY'S FOCUS & ACTIVE TASKS                      */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION A: YOUR FOCUS TODAY */}
          <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  Your Focus Today
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted font-bold px-2 py-0.5 rounded-full bg-paper-dark border border-line/60">
                {data.focusItems?.length || 0} Priority Items
              </span>
            </div>

            {(!data.focusItems || data.focusItems.length === 0) ? (
              <div className="py-8 px-4 text-center space-y-2 bg-paper-light/70 rounded-lg border border-line/60">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Your focus board is clear
                </h3>
                <p className="font-mono text-xs text-muted max-w-sm mx-auto">
                  No urgent deadlines or blockers right now. Work through your sprint tasks or practice in the Interview Lab.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.focusItems.map((item, idx) => {
                  const isOverdue = item.type === 'OVERDUE_TASK';
                  const isDueToday = item.type === 'TASK_DUE_TODAY';
                  const isHomework = item.type === 'HOMEWORK_DUE';
                  const isBlocker = item.type === 'BLOCKER';

                  let borderAccent = 'border-l-primary';
                  let badgeStyle = 'bg-paper-dark border-line text-ink';
                  if (isOverdue) {
                    borderAccent = 'border-l-rose-500';
                    badgeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-800';
                  } else if (isDueToday) {
                    borderAccent = 'border-l-amber-500';
                    badgeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-800';
                  } else if (isHomework) {
                    borderAccent = 'border-l-ochre';
                    badgeStyle = 'bg-ochre-soft/60 border-ochre/30 text-ochre';
                  } else if (isBlocker) {
                    borderAccent = 'border-l-rose-600';
                    badgeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-800';
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 bg-paper-light border border-line hover:border-line-dark border-l-4 ${borderAccent} rounded-lg transition-all duration-200 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 group`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs border uppercase ${badgeStyle}`}>
                            {item.category}
                          </span>
                          <span className="font-mono text-[10px] text-muted">
                            {item.dueInfo}
                          </span>
                        </div>
                        <h4 className="font-sans text-xs font-semibold text-ink truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          if (isHomework) onNavigateTab('homework');
                          else if (isBlocker) setAskLeadOpen(true);
                          else onNavigateTab('tasks');
                        }}
                        className="shrink-0 px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line font-mono text-xs font-bold text-ink rounded-md transition-all duration-150 flex items-center space-x-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 text-muted group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: ACTIVE ASSIGNED TASKS */}
          <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  Active Tasks
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="font-mono text-xs font-bold text-primary hover:text-primary-hover flex items-center space-x-1.5 group cursor-pointer"
              >
                <span>Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {(!data.myTasks || data.myTasks.length === 0) ? (
              <div className="py-8 px-4 text-center space-y-1.5 bg-paper-light/70 rounded-lg border border-line/60">
                <p className="font-display text-sm font-bold text-ink">
                  No active tasks assigned
                </p>
                <p className="font-mono text-xs text-muted">
                  Check with your Team Lead or explore the curriculum backlog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line/60">
                {data.myTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-paper-light rounded-lg transition-all duration-150 group cursor-default"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-primary animate-pulse' : 'bg-line-dark'
                      }`} />
                      <div className="min-w-0">
                        <span className={`font-sans text-xs font-medium block truncate group-hover:text-primary transition-colors ${
                          task.status === 'DONE' ? 'line-through text-muted' : 'text-ink'
                        }`}>
                          {task.title}
                        </span>
                        <span className="font-mono text-[10px] text-muted">
                          Priority: <strong className="text-ink-secondary">{task.priority}</strong> {task.deadline ? `· Due: ${task.deadline}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className={`shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase shadow-2xs ${
                      task.status === 'DONE'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                        : task.status === 'IN_PROGRESS'
                        ? 'bg-primary-soft border-primary/20 text-primary'
                        : 'bg-paper-dark border-line text-muted'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (5 cols): STANDUP HUB & COMMUNICATION                      */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 space-y-6">

          {/* STANDUP HUB (Your Standup & Lead's Update in 1 sleek container) */}
          <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                  <Calendar className="w-4 h-4" />
                </div>
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  Today's Standups
                </h2>
              </div>
              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isSubmittedToday
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-800'
              }`}>
                {isSubmittedToday ? 'Updated ✓' : 'Pending Action'}
              </span>
            </div>

            {/* PART 1: YOUR STANDUP */}
            <div className={`p-4 rounded-lg border space-y-3 transition-all duration-200 ${
              isSubmittedToday ? 'bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/40' : 'bg-paper-light border-line hover:border-line-dark'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase text-ink flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSubmittedToday ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`} />
                  <span>My Daily Briefing</span>
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {isSubmittedToday && todayStandup?.submittedAt
                    ? formatLocalTime(todayStandup.submittedAt)
                    : 'Not submitted yet'}
                </span>
              </div>

              {!isSubmittedToday ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted font-sans leading-relaxed">
                    Share your yesterday progress and blockers with the team in 2 minutes.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(false);
                        setStandupModalEditing(false);
                        setStandupModalMode('WRITE');
                        setStandupModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 bg-paper hover:bg-paper-dark border border-line hover:border-ink font-mono text-xs font-semibold text-ink rounded-lg transition-all duration-150 flex items-center justify-center space-x-1.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-primary" />
                      <span>Write</span>
                    </button>
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(false);
                        setStandupModalEditing(false);
                        setStandupModalMode('VOICE');
                        setStandupModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 bg-primary text-paper hover:bg-primary-hover font-mono text-xs font-semibold rounded-lg transition-all duration-150 flex items-center justify-center space-x-1.5 shadow-xs hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-paper/90" />
                      <span>Record Voice</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayStandup?.yesterday && (
                    <p className="text-xs text-muted line-clamp-2 font-sans bg-paper-light/60 p-2.5 rounded-md border border-line/40">
                      <strong className="text-ink font-semibold">Done:</strong> {todayStandup.yesterday}
                    </p>
                  )}

                  {todayStandup && (todayStandup.submissionType === 'VOICE' || todayStandup.hasVoiceRecording) && (
                    <div className="pt-1">
                      <StandupAudioPlayer
                        standupId={todayStandup.id}
                        initialDurationSeconds={todayStandup.audioDurationSeconds || undefined}
                        title="Your Today Standup"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-line/50">
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(false);
                        setStandupModalEditing(true);
                        setStandupModalMode(todayStandup?.hasVoiceRecording || todayStandup?.submissionType === 'VOICE' ? 'VOICE' : 'WRITE');
                        setStandupModalOpen(true);
                      }}
                      className="text-xs font-mono text-muted hover:text-ink font-medium cursor-pointer transition-colors"
                    >
                      Edit Standup
                    </button>
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(true);
                        setStandupModalEditing(false);
                        setStandupModalMode('VIEW');
                        setStandupModalOpen(true);
                      }}
                      className="text-xs font-mono text-primary hover:text-primary-hover font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PART 2: TEAM LEAD'S STANDUP */}
            {!isCurrentLead && (
              <div className="p-4 rounded-lg border border-line bg-paper-light space-y-2.5 transition-all duration-200 hover:border-line-dark">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase text-ink flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Lead Standup</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted font-medium px-2 py-0.5 rounded-full bg-paper border border-line/60">
                    {data.teamLead ? data.teamLead.name : 'Team Lead'}
                  </span>
                </div>

                {data.teamLeadStandup ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-muted line-clamp-2 font-sans bg-paper p-2.5 rounded-md border border-line/50">
                      {data.teamLeadStandup.today || data.teamLeadStandup.yesterday || 'Lead daily briefing posted.'}
                    </p>

                    {(data.teamLeadStandup.submissionType === 'VOICE' || data.teamLeadStandup.hasVoiceRecording) && (
                      <div className="pt-1">
                        <StandupAudioPlayer
                          standupId={data.teamLeadStandup.id}
                          initialDurationSeconds={data.teamLeadStandup.audioDurationSeconds || undefined}
                          title={`${data.teamLead?.name || 'Lead'}'s Voice Update`}
                        />
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setViewStandupTarget(data.teamLeadStandup || null);
                          setViewStandupTitle(`${data.teamLead?.name || 'Team Lead'}'s Daily Standup`);
                          setViewStandupModalOpen(true);
                        }}
                        className="text-xs font-mono text-primary hover:text-primary-hover font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Listen / Read Lead Standup</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-muted italic py-1">
                    Lead daily update has not been submitted yet today.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* STANDUP HISTORY & DIRECT MESSAGES (Tabs: Recent logs + messages) */}
          <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-1 bg-paper-dark/80 p-1 rounded-lg border border-line font-mono text-[11px]">
                <button
                  onClick={() => setActiveCommsTab('STANDUPS')}
                  className={`px-3 py-1 rounded-md font-bold transition-all duration-150 cursor-pointer ${
                    activeCommsTab === 'STANDUPS'
                      ? 'bg-paper text-primary shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Past Standups
                </button>
                <button
                  onClick={() => setActiveCommsTab('MESSAGES')}
                  className={`px-3 py-1 rounded-md font-bold transition-all duration-150 cursor-pointer ${
                    activeCommsTab === 'MESSAGES'
                      ? 'bg-paper text-primary shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Messages ({data.directMessages?.length || 0})
                </button>
              </div>

              <span className="font-mono text-[10px] text-muted">
                {activeCommsTab === 'STANDUPS' ? 'Past 5 days' : 'Lead inbox'}
              </span>
            </div>

            {activeCommsTab === 'STANDUPS' ? (
              <div className="divide-y divide-line/60 text-xs font-mono">
                {history.filter((h) => h.date !== localToday).length === 0 ? (
                  <p className="text-muted text-xs py-5 text-center">
                    No past standup history yet.
                  </p>
                ) : (
                  history
                    .filter((h) => h.date !== localToday)
                    .slice(0, 4)
                    .map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setViewStandupTarget(h);
                          setViewStandupTitle(`Standup Log · ${h.date}`);
                          setViewStandupModalOpen(true);
                        }}
                        className="py-2.5 px-2 flex items-center justify-between hover:bg-paper-light rounded-lg transition-all duration-150 cursor-pointer group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-ink group-hover:text-primary transition-colors">{h.date}</span>
                          <span className="text-muted/60">·</span>
                          <span className="text-emerald-700 font-semibold">✓ Done</span>
                          {h.hasVoiceRecording && (
                            <Mic className="w-3 h-3 text-primary shrink-0" />
                          )}
                        </div>
                        <span className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all text-[11px] flex items-center space-x-1">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="text-xs font-sans space-y-2.5">
                {(!data.directMessages || data.directMessages.length === 0) ? (
                  <div className="py-5 text-center space-y-2">
                    <p className="font-mono text-xs text-muted">
                      No questions asked to Lead yet.
                    </p>
                    <button
                      onClick={() => setAskLeadOpen(true)}
                      className="font-mono text-xs text-primary hover:text-primary-hover font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Ask Lead a question</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-line/60 space-y-2.5">
                    {data.directMessages.slice(0, 3).map((msg) => (
                      <div key={msg.id} className="pt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-muted font-bold">{msg.relatedTopic || 'Question'}</span>
                          <span className={msg.status === 'ANSWERED' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-medium'}>
                            {msg.status === 'ANSWERED' ? 'Answered ✓' : 'Awaiting response'}
                          </span>
                        </div>
                        <p className="text-ink text-xs line-clamp-2 bg-paper-light p-2 rounded-md border border-line/40">
                          "{msg.message}"
                        </p>
                        {msg.leadResponse && (
                          <div className="p-2.5 bg-paper-light border border-line rounded-md text-[11px] space-y-1">
                            <span className="font-bold text-primary font-mono block text-[10px]">Lead Reply:</span>
                            <p className="text-ink">{msg.leadResponse}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS                                                                 */}
      {/* ========================================================================= */}
      <DailyStandupModal
        isOpen={standupModalOpen}
        initialMode={standupModalMode}
        viewOnly={standupModalViewOnly}
        isEditing={standupModalEditing}
        onClose={() => setStandupModalOpen(false)}
        onSuccess={() => {
          setStandupModalOpen(false);
          window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
          loadData();
        }}
        onSubmitted={() => {
          setStandupModalOpen(false);
          window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
          loadData();
        }}
        targetDate={localToday}
      />

      <DailyStandupModal
        isOpen={viewStandupModalOpen}
        viewOnly={true}
        initialStandup={viewStandupTarget}
        modalTitle={viewStandupTitle}
        onClose={() => {
          setViewStandupModalOpen(false);
          setViewStandupTarget(null);
        }}
      />

      <AskLeadModal
        isOpen={askLeadOpen}
        onClose={() => setAskLeadOpen(false)}
        onSent={() => loadData()}
      />

      <LeaveEmailModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
      />
    </div>
  );
};
