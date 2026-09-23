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
  getTimeGreetingEmoji,
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
  const greetingEmoji = getTimeGreetingEmoji();
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
      {/* 1. EXECUTIVE HERO BAR (Clean, Human-Designed Engineering Cockpit)          */}
      {/* ========================================================================= */}
      <div className="bg-paper border border-line rounded-xl p-6 sm:p-7 shadow-xs space-y-4 relative overflow-hidden transition-colors duration-150">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          {/* Left: Greeting & Context */}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="font-bold px-2.5 py-0.5 rounded-md bg-paper border border-line-dark/60 text-ink shadow-2xs">
                {user.serialNumber || data.serialNumber || 'MEMBER'}
              </span>
              <span className="text-muted/60">·</span>
              <span className="text-muted font-medium">{user.position || data.position || 'SDE Intern'}</span>
              <span className="text-muted/60">·</span>
              <span className="text-ink font-semibold px-2.5 py-0.5 rounded-md bg-paper-dark border border-line/70 text-[11px]">
                {data.teamName}
              </span>
              <span className="text-muted/60">·</span>
              <span className="text-muted/80">{fullTitle}</span>
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2.5">
                <span>{greetingTitle}</span>
                <span className="inline-block text-2xl sm:text-3xl select-none hover:scale-115 active:scale-95 transition-transform duration-200 cursor-default" title="Have a productive day">
                  {greetingEmoji}
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-muted bg-paper-light border border-line/80 px-3 py-1 rounded-md shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{dailyContext}</span>
              </div>
              <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary-soft border border-primary/20">
                ACTIVE SPRINT
              </span>
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
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white rounded-lg font-mono text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shadow-2xs cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-white/90" />
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
                className="px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/20 active:scale-[0.98] rounded-lg font-mono text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Standup Recorded ✓</span>
              </button>
            )}

            {!isCurrentLead && (
              <button
                onClick={() => setAskLeadOpen(true)}
                className="px-3.5 py-2.5 bg-paper hover:bg-paper-dark active:scale-[0.98] border border-line hover:border-line-dark text-ink rounded-lg font-mono text-xs font-semibold transition-colors duration-150 flex items-center space-x-2 shadow-2xs cursor-pointer"
                title="Send a quick question to your Team Lead"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Ask Lead</span>
              </button>
            )}

            <button
              onClick={() => setLeaveModalOpen(true)}
              className="p-2.5 bg-paper hover:bg-paper-dark active:scale-[0.98] border border-line hover:border-line-dark text-muted hover:text-ink rounded-lg transition-colors duration-150 shadow-2xs cursor-pointer"
              title="Generate Leave Request Email"
              aria-label="Generate Leave Request Email"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CORE TELEMETRY METRICS (Interactive, Animated KPI Cockpit)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
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
          className={`p-4 sm:p-5 rounded-xl border cursor-pointer shadow-xs flex flex-col justify-between group transition-all duration-200 ease-out hover:-translate-y-1 active:scale-[0.98] select-none ${
            isSubmittedToday
              ? 'bg-paper border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_8px_24px_rgba(16,185,129,0.15)]'
              : 'bg-paper border-line hover:border-amber-500/60 hover:shadow-[0_8px_24px_rgba(217,119,6,0.15)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider group-hover:text-ink transition-colors">
              Daily Standup
            </span>
            <div className={`p-2.5 rounded-lg transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 shadow-2xs ${
              isSubmittedToday
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 group-hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/25 group-hover:bg-amber-500/20'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          
          <div className="py-2.5">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {!isSubmittedToday && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSubmittedToday ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className={`font-mono text-xl sm:text-2xl font-black block leading-none tracking-tight group-hover:scale-[1.02] origin-left transition-transform duration-150 ${
                isSubmittedToday ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {isSubmittedToday ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="truncate">
                {isSubmittedToday && todayStandup?.submittedAt
                  ? `Logged at ${formatLocalTime(todayStandup.submittedAt)}`
                  : 'Action needed today'}
              </span>
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform duration-150">
                <span>{isSubmittedToday ? 'View' : 'Submit'}</span>
                <span>→</span>
              </span>
            </div>
            <div className="w-full h-1 group-hover:h-1.5 bg-line/60 rounded-full overflow-hidden transition-all duration-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSubmittedToday ? 'w-full bg-gradient-to-r from-emerald-500 to-teal-500' : 'w-1/3 bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: MY TASKS */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-4 sm:p-5 bg-paper border border-line hover:border-blue-500/60 rounded-xl cursor-pointer shadow-xs flex flex-col justify-between group transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)] active:scale-[0.98] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider group-hover:text-ink transition-colors">
              My Tasks
            </span>
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-700 border border-blue-500/25 group-hover:bg-blue-500/20 group-hover:scale-110 group-hover:rotate-3 shadow-2xs transition-all duration-200">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          
          <div className="py-2.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-black text-ink block leading-none tracking-tight group-hover:text-blue-700 group-hover:scale-[1.02] origin-left transition-all duration-150">
                {data.openTasksCount}
              </span>
              {data.openTasksCount === 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-mono text-[10px] font-bold">
                  CLEAR
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="truncate">
                {data.tasksDueTodayCount > 0
                  ? `${data.tasksDueTodayCount} due today`
                  : `${data.lifetimeCompletedTasks || 0} completed`}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-150" />
            </div>
            <div className="w-full h-1 group-hover:h-1.5 bg-line/60 rounded-full overflow-hidden transition-all duration-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{
                  width: `${data.openTasksCount === 0 ? 100 : Math.min(100, Math.max(15, ((data.lifetimeCompletedTasks || 0) / Math.max(1, (data.lifetimeCompletedTasks || 0) + (data.openTasksCount || 0))) * 100))}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* CARD 3: HOMEWORK */}
        <div
          onClick={() => onNavigateTab('homework')}
          className="p-4 sm:p-5 bg-paper border border-line hover:border-amber-500/60 rounded-xl cursor-pointer shadow-xs flex flex-col justify-between group transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(245,158,11,0.15)] active:scale-[0.98] select-none"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider group-hover:text-ink transition-colors">
              Homework & Labs
            </span>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/25 group-hover:bg-amber-500/20 group-hover:scale-110 group-hover:rotate-6 shadow-2xs transition-all duration-200">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-2xl sm:text-3xl font-black text-ink block leading-none tracking-tight group-hover:text-amber-700 group-hover:scale-[1.02] origin-left transition-all duration-150">
                {data.pendingHomeworkCount}
              </span>
              {data.pendingHomeworkCount === 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-mono text-[10px] font-bold">
                  CLEAR
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between font-mono text-[10px] text-muted">
              <span className="truncate">
                {data.totalHomeworkCount > 0
                  ? `${data.totalHomeworkCount - data.pendingHomeworkCount}/${data.totalHomeworkCount} submitted`
                  : 'All coursework done'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-150" />
            </div>
            <div className="w-full h-1 group-hover:h-1.5 bg-line/60 rounded-full overflow-hidden transition-all duration-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{
                  width: `${data.totalHomeworkCount > 0 ? Math.min(100, Math.max(15, ((data.totalHomeworkCount - data.pendingHomeworkCount) / data.totalHomeworkCount) * 100)) : 100}%`
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
          className={`p-4 sm:p-5 rounded-xl border shadow-xs flex flex-col justify-between group transition-all duration-200 ease-out hover:-translate-y-1 active:scale-[0.98] select-none ${
            data.openBlockersCount > 0
              ? 'bg-paper border-rose-500/40 hover:border-rose-500 hover:shadow-[0_8px_24px_rgba(244,63,94,0.15)] cursor-pointer'
              : 'bg-paper border-line hover:border-emerald-500/50 hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] cursor-default'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider group-hover:text-ink transition-colors">
              Blockers
            </span>
            <div className={`p-2.5 rounded-lg shadow-2xs transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
              data.openBlockersCount > 0
                ? 'bg-rose-500/10 text-rose-700 border border-rose-500/25 group-hover:bg-rose-500/20'
                : 'bg-paper-dark text-muted border border-line group-hover:text-emerald-700 group-hover:border-emerald-500/30'
            }`}>
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="py-2.5">
            <div className="flex items-center space-x-2">
              <span className={`font-mono text-2xl sm:text-3xl font-black block leading-none tracking-tight group-hover:scale-[1.02] origin-left transition-all duration-150 ${
                data.openBlockersCount > 0 ? 'text-rose-700' : 'text-ink'
              }`}>
                {data.openBlockersCount}
              </span>
              {data.openBlockersCount === 0 && (
                <span className="px-2 py-0.5 rounded-md bg-paper-dark border border-line text-muted font-mono text-[10px] font-semibold">
                  NONE
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-line/60">
            <span className="font-mono text-[10px] text-muted truncate block">
              {data.openBlockersCount > 0 ? 'Lead assistance requested' : 'Full velocity · No blockers'}
            </span>
            <div className="w-full h-1 group-hover:h-1.5 bg-line/60 rounded-full overflow-hidden transition-all duration-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.openBlockersCount > 0 ? 'w-full bg-rose-500' : 'w-full bg-gradient-to-r from-emerald-500 to-teal-500'
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
          <div className="bg-paper border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 transition-all duration-200 hover:shadow-card-hover">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-primary/10 text-primary rounded-md">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                  Your Focus Today
                </h2>
              </div>
              <span className="font-mono text-[10px] text-muted font-bold px-2.5 py-0.5 rounded-full bg-paper-dark border border-line/60">
                {data.focusItems?.length || 0} Priority Items
              </span>
            </div>

            {(!data.focusItems || data.focusItems.length === 0) ? (
              <div className="p-5 sm:p-6 bg-paper-light rounded-xl border border-line space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-line">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">
                        Daily Priorities Clear
                      </h3>
                      <p className="font-mono text-[11px] text-muted">
                        No urgent deadlines or pending blockers today. Recommended focus areas:
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md uppercase self-start sm:self-center shrink-0">
                    CLEAR
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Quick Action 1: Interview Lab */}
                  <div
                    onClick={() => onNavigateTab('interview')}
                    className="p-3.5 bg-paper hover:bg-paper-dark border border-line hover:border-line-dark rounded-xl transition-colors duration-150 cursor-pointer shadow-xs group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span>INTERVIEW LAB</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="font-sans text-xs font-bold text-ink group-hover:text-primary transition-colors">
                        Practice Technical Interviews
                      </h4>
                      <p className="text-[11px] text-muted font-sans leading-relaxed">
                        Sharpen Java concurrency, memory model, and backend system architecture concepts.
                      </p>
                    </div>
                    <div className="pt-3">
                      <span className="font-mono text-[11px] font-semibold text-primary flex items-center gap-1">
                        <span>Launch Lab</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>

                  {/* Quick Action 2: Kanban Board */}
                  <div
                    onClick={() => onNavigateTab('tasks')}
                    className="p-3.5 bg-paper hover:bg-paper-dark border border-line hover:border-line-dark rounded-xl transition-colors duration-150 cursor-pointer shadow-xs group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>SPRINT BACKLOG</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="font-sans text-xs font-bold text-ink group-hover:text-primary transition-colors">
                        Explore Sprint Kanban Board
                      </h4>
                      <p className="text-[11px] text-muted font-sans leading-relaxed">
                        Pick up your next development ticket, verify code reviews, or update sprint progress.
                      </p>
                    </div>
                    <div className="pt-3">
                      <span className="font-mono text-[11px] font-semibold text-primary flex items-center gap-1">
                        <span>Open Kanban</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
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
                      className={`p-3.5 bg-paper-light border border-line hover:border-line-dark border-l-4 ${borderAccent} rounded-lg transition-colors duration-150 flex items-center justify-between gap-3 shadow-2xs group`}
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
                        className="shrink-0 px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line font-mono text-xs font-semibold text-ink rounded-md transition-colors duration-150 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
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
            <div className={`p-4 sm:p-5 rounded-xl border space-y-3.5 transition-colors duration-150 ${
              isSubmittedToday ? 'bg-paper-light border-emerald-500/30' : 'bg-paper-light border-line'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase text-ink flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isSubmittedToday ? 'bg-emerald-600' : 'bg-amber-500'}`} />
                  <span>My Daily Briefing</span>
                </span>
                <span className="font-mono text-[10px] text-muted font-semibold">
                  {isSubmittedToday && todayStandup?.submittedAt
                    ? `Logged at ${formatLocalTime(todayStandup.submittedAt)}`
                    : 'Action required'}
                </span>
              </div>

              {!isSubmittedToday ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted font-sans leading-relaxed">
                    Share your yesterday progress, today's targets, and any blockers with your team in 2 minutes.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(false);
                        setStandupModalEditing(false);
                        setStandupModalMode('WRITE');
                        setStandupModalOpen(true);
                      }}
                      className="py-2.5 px-3 bg-paper hover:bg-paper-dark border border-line hover:border-line-dark font-mono text-xs font-semibold text-ink rounded-lg transition-colors duration-150 flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-primary" />
                      <span>Write Standup</span>
                    </button>
                    <button
                      onClick={() => {
                        setStandupModalViewOnly(false);
                        setStandupModalEditing(false);
                        setStandupModalMode('VOICE');
                        setStandupModalOpen(true);
                      }}
                      className="py-2.5 px-3 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-mono text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
                    >
                      <Mic className="w-3.5 h-3.5 text-white/90" />
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
