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
  Clock,
  CheckSquare,
  Shield,
  ArrowRight,
  Zap,
  Mic,
  Circle,
  UserCheck,
  GraduationCap,
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
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span>Loading your personal workspace...</span>
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
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Initializing workspace...</span>
      </div>
    );
  }

  // Standup status
  const isSubmittedToday = Boolean(data.standupDoneToday || data.todayStandup);
  const todayStandup = data.todayStandup;

  // Personalized Greeting
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
    <div className="space-y-8 max-w-5xl mx-auto font-sans animate-fade-in pb-8">
      {/* ========================================================================= */}
      {/* 1. PERSONALIZED HERO COMMAND CENTER FOR MEMBER                            */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-6 sm:p-7 shadow-2xs space-y-6 relative overflow-hidden">
        {/* TOP IDENTITY ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-paper-dark border border-line text-ink">
              {user.serialNumber || data.serialNumber || 'MEMBER'}
            </span>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-paper-dark border border-line text-muted">
              {user.position || data.position || 'SDE Intern'}
            </span>
            {user.role === 'LEAD' ? (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/15 border border-amber-500/30 text-amber-800 uppercase">
                CURRENT LEAD
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-accent/10 border border-accent/20 text-accent uppercase">
                MEMBER
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-muted uppercase tracking-wider">
            <span>{fullTitle}</span>
            <span>·</span>
            <span className="text-ink font-semibold">{data.teamName}</span>
          </div>
        </div>

        {/* TWO-COLUMN WORKSPACE BODY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: GREETING & CONTEXT */}
          <div className="lg:col-span-7 space-y-3">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-ink tracking-tight uppercase leading-tight">
              {greetingTitle}
            </h1>

            <p className="text-xs sm:text-sm text-ink leading-relaxed font-sans">
              Your workspace is ready. Here's what matters today.
            </p>

            <div className="pt-2 flex items-center space-x-2 text-xs font-mono text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span className="leading-snug">{dailyContext}</span>
            </div>
          </div>

          {/* RIGHT COLUMN: COMPACT TODAY SNAPSHOT & ACTIONS */}
          <div className="lg:col-span-5 bg-paper-dark/70 border border-line rounded-xs p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                TODAY'S STATUS
              </span>
              <span className={`font-mono text-[10px] font-bold ${isSubmittedToday ? 'text-accent' : 'text-muted'}`}>
                {isSubmittedToday ? 'STANDUP DONE ✓' : 'STANDUP PENDING'}
              </span>
            </div>

            {/* 3 REAL METRICS */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* DAILY STANDUP */}
              <div className={`p-2 border rounded-xs space-y-0.5 ${
                isSubmittedToday
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-paper border-line'
              }`}>
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">Daily Standup</span>
                <span className={`font-mono text-xs font-black block leading-tight pt-1 ${
                  isSubmittedToday ? 'text-emerald-700' : 'text-ink'
                }`}>
                  {isSubmittedToday ? 'DONE ✓' : 'PENDING'}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">
                  {isSubmittedToday && todayStandup?.submittedAt
                    ? formatLocalTime(todayStandup.submittedAt)
                    : '—'}
                </span>
              </div>

              {/* MY TASKS */}
              <div className="p-2 bg-paper border border-line rounded-xs space-y-0.5">
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">My Tasks</span>
                <span className="font-mono text-lg font-black text-ink block leading-tight">
                  {data.openTasksCount}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">
                  {data.tasksDueTodayCount > 0 ? `${data.tasksDueTodayCount} Due Today` : 'Open'}
                </span>
              </div>

              {/* HOMEWORK */}
              <div className="p-2 bg-paper border border-line rounded-xs space-y-0.5">
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">Homework</span>
                <span className="font-mono text-lg font-black text-ink block leading-tight">
                  {data.pendingHomeworkCount}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">
                  {data.totalHomeworkCount > 0 ? `${data.pendingHomeworkCount}/${data.totalHomeworkCount} Pend` : 'None'}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 pt-1">
              {!isSubmittedToday ? (
                <button
                  onClick={() => {
                    setStandupModalViewOnly(false);
                    setStandupModalEditing(false);
                    setStandupModalMode('WRITE');
                    setStandupModalOpen(true);
                  }}
                  className="flex-1 px-3 py-2.5 bg-primary text-paper hover:bg-primary-hover active:scale-[0.99] rounded-md font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs hover-lift"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SUBMIT DAILY STANDUP</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="flex-1 px-3 py-2.5 bg-primary text-paper hover:bg-primary-hover active:scale-[0.99] rounded-md font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs hover-lift"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-primary-soft" />
                  <span>VIEW MY TASKS</span>
                </button>
              )}

              {!isCurrentLead && (
                <button
                  onClick={() => setAskLeadOpen(true)}
                  className="px-3 py-2.5 bg-surface-raised hover:bg-surface-soft border border-line hover:border-primary/30 text-ink rounded-md font-mono text-xs font-semibold transition-all flex items-center justify-center space-x-1 shadow-2xs"
                  title="Send a direct question to your Team Lead"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span>Ask Lead</span>
                </button>
              )}

              <button
                onClick={() => setLeaveModalOpen(true)}
                className="px-3 py-2.5 bg-surface-raised hover:bg-surface-soft border border-line hover:border-primary/30 text-muted hover:text-ink rounded-md font-mono text-xs font-medium transition-all flex items-center justify-center shadow-2xs"
                title="Generate professional leave email"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* UPCOMING TEAM MEETING (IF SCHEDULED)                                      */}
      {/* ========================================================================= */}
      {upcomingMeeting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-accent" />
              <span>Upcoming Team Meeting</span>
            </span>
            <button
              onClick={() => onNavigateTab('meetings')}
              className="text-xs font-mono text-accent hover:underline font-semibold"
            >
              All Syncs →
            </button>
          </div>
          <TeamMeetingCard meeting={upcomingMeeting} isHero={true} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MY DAILY STANDUP                                                       */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-xs overflow-hidden shadow-2xs">
        <div className="px-5 py-3 border-b border-line bg-paper-dark flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
              My Daily Standup
            </span>
          </div>
          <span className="font-mono text-xs text-muted font-semibold">
            {fullTitle}
          </span>
        </div>

        <div className="p-6 space-y-4">
          {!isSubmittedToday ? (
            /* PENDING STATE */
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-ink">
                  Today's standup is waiting for your update.
                </h3>
                <p className="text-xs text-muted max-w-lg leading-relaxed font-sans">
                  Takes 2–3 minutes · Share your yesterday progress, today's focus, and flag any roadblocks for your Team Lead.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setStandupModalViewOnly(false);
                    setStandupModalEditing(false);
                    setStandupModalMode('WRITE');
                    setStandupModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-surface-raised border border-line hover:border-primary/40 text-ink font-mono text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 shadow-xs hover-lift"
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
                  className="px-4 py-2.5 bg-primary text-paper hover:bg-primary-hover active:scale-[0.99] font-mono text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 shadow-xs hover-lift"
                >
                  <Mic className="w-3.5 h-3.5 text-primary-soft" />
                  <span>Record Voice</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* SUBMITTED STATE */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-display text-sm font-bold text-ink">
                        DAILY STANDUP SUBMITTED
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded-xs">
                        {todayStandup?.hasVoiceRecording || todayStandup?.submissionType === 'VOICE'
                          ? `Submitted · Voice · ${todayStandup?.audioDurationSeconds || 0}s`
                          : 'Submitted · Written'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Today's standup is complete · Submitted at {formatLocalTime(todayStandup?.submittedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      const learningText = todayStandup?.learned || todayStandup?.today || todayStandup?.yesterday || "Java programming concepts";
                      window.dispatchEvent(new CustomEvent('jvm_open_interview_lab', {
                        detail: { topic: `I learned: ${learningText}` }
                      }));
                    }}
                    className="px-3 py-1.5 bg-primary-soft text-primary border border-primary/20 hover:bg-primary hover:text-paper rounded-md font-mono text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-2xs hover-lift"
                    title="Practice what you learned today in Interview Lab"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Practice What I Learned</span>
                  </button>

                  <button
                    onClick={() => {
                      setStandupModalViewOnly(false);
                      setStandupModalEditing(true);
                      setStandupModalMode(todayStandup?.hasVoiceRecording || todayStandup?.submissionType === 'VOICE' ? 'VOICE' : 'WRITE');
                      setStandupModalOpen(true);
                    }}
                    className="px-3 py-1.5 border border-line hover:border-ink rounded-md font-mono text-xs font-medium text-ink transition-colors bg-surface-raised hover:bg-surface-soft"
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
                    className="px-3.5 py-1.5 bg-surface-soft border border-line hover:border-ink font-mono text-xs font-semibold text-ink rounded-md transition-colors flex items-center space-x-1"
                  >
                    <span>View Standup</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Voice Player Preview if Voice Submission */}
              {todayStandup && (todayStandup.submissionType === 'VOICE' || todayStandup.hasVoiceRecording) && (
                <div className="p-3 bg-paper-dark rounded-xs border border-line space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-muted flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-accent" />
                      <span>Today's Voice Standup Recording</span>
                    </span>
                    <span className="font-mono text-[11px] text-accent font-bold">
                      {todayStandup.audioDurationSeconds ? `${todayStandup.audioDurationSeconds}s` : 'Recorded'}
                    </span>
                  </div>
                  <StandupAudioPlayer
                    standupId={todayStandup.id}
                    initialDurationSeconds={todayStandup.audioDurationSeconds || undefined}
                    title="Your Today Standup"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TODAY'S TEAM LEAD STANDUP (FOR MEMBERS)                                */}
      {/* ========================================================================= */}
      {!isCurrentLead && (
        <div className="border border-line bg-paper rounded-xs overflow-hidden shadow-2xs">
          <div className="px-5 py-3 border-b border-line bg-paper-dark flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
                Today's Team Lead Standup
              </span>
              {data.teamLead && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/10 border border-amber-500/20 text-amber-800">
                  {data.teamLead.name} ({data.teamLead.position || 'SDE Intern'} · Current Team Lead)
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-muted font-semibold">
              {fullTitle}
            </span>
          </div>

          <div className="p-6 space-y-4">
            {data.teamLeadStandup ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-display text-sm font-bold text-ink">
                          {data.teamLead?.name || 'TEAM LEAD'} · DAILY UPDATE
                        </span>
                        <span className="font-mono text-[10px] text-amber-800 font-bold px-1.5 py-0.2 bg-amber-500/10 rounded-xs">
                          {data.teamLeadStandup.hasVoiceRecording || data.teamLeadStandup.submissionType === 'VOICE'
                            ? `Submitted · Voice · ${data.teamLeadStandup.audioDurationSeconds || 0}s`
                            : 'Submitted · Written'}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Submitted today at {formatLocalTime(data.teamLeadStandup.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setViewStandupTarget(data.teamLeadStandup || null);
                      setViewStandupTitle(`${data.teamLead?.name || 'Team Lead'}'s Daily Standup`);
                      setViewStandupModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-paper-dark border border-line hover:border-ink font-mono text-xs font-semibold text-ink rounded-xs transition-colors flex items-center space-x-1"
                  >
                    <span>View Standup</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Voice Player if Lead submitted Voice */}
                {(data.teamLeadStandup.submissionType === 'VOICE' || data.teamLeadStandup.hasVoiceRecording) && (
                  <div className="p-3 bg-paper-dark rounded-xs border border-line space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] uppercase font-bold text-muted flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-accent" />
                        <span>Lead's Voice Standup Recording</span>
                      </span>
                      <span className="font-mono text-[11px] text-accent font-bold">
                        {data.teamLeadStandup.audioDurationSeconds ? `${data.teamLeadStandup.audioDurationSeconds}s` : 'Recorded'}
                      </span>
                    </div>
                    <StandupAudioPlayer
                      standupId={data.teamLeadStandup.id}
                      initialDurationSeconds={data.teamLeadStandup.audioDurationSeconds || undefined}
                      title={`${data.teamLead?.name || 'Lead'}'s Voice Standup`}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* CLEAN EMPTY STATE */
              <div className="py-6 px-4 text-center space-y-2 bg-paper-dark/50 rounded-xs border border-dashed border-line">
                <div className="w-10 h-10 rounded-full bg-paper border border-line flex items-center justify-center text-muted mx-auto">
                  <Clock className="w-5 h-5 text-muted" />
                </div>
                <h4 className="font-display text-sm font-bold text-ink">
                  Today's Lead standup is pending.
                </h4>
                <p className="font-mono text-xs text-muted max-w-md mx-auto">
                  {data.teamLead ? `${data.teamLead.name} has not submitted today's standup yet.` : "Your Team Lead has not submitted today's standup yet."} Standup updates submitted by your lead will automatically appear here once posted.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STANDUP HISTORY (PAST DATES ONLY)                                      */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-ink">
              Standup History
            </h3>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {history.filter(h => h.date !== localToday).length} Previous Submissions
          </span>
        </div>

        <div className="divide-y divide-line text-xs">
          {history.filter(h => h.date !== localToday).length === 0 ? (
            <p className="text-muted font-mono text-xs py-4 text-center">
              No standup submissions yet.
            </p>
          ) : (
            history
              .filter(h => h.date !== localToday)
              .slice(0, 5)
              .map((h) => {
                const isVoice = h.hasVoiceRecording || h.submissionType === 'VOICE';
                return (
                  <div
                    key={h.id}
                    className="py-3 px-2 flex items-center justify-between hover:bg-paper-light rounded-xs transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-2 font-mono text-xs">
                        <span className="font-bold text-ink">{h.date}</span>
                        <span className="text-muted">·</span>
                        <span className="text-emerald-700 font-medium">✓ Submitted</span>
                        <span className="text-muted">·</span>
                        <span className="text-muted">
                          {isVoice
                            ? `🎙 Voice · ${h.audioDurationSeconds ? `${h.audioDurationSeconds} sec` : 'Recorded'}`
                            : '⌨ Written'}
                        </span>
                        {h.confidence && (
                          <>
                            <span className="text-muted">·</span>
                            <span className="text-muted">Confidence: {h.confidenceLabel || `${h.confidence}/5`}</span>
                          </>
                        )}
                      </div>
                      {h.yesterday && (
                        <p className="text-muted line-clamp-1 text-xs">
                          <strong className="text-ink font-medium">Progress:</strong> {h.yesterday}
                        </p>
                      )}
                      {h.blockers && (
                        <p className="text-attention text-[11px] line-clamp-1 font-medium">
                          <strong>Blocker:</strong> {h.blockers}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setViewStandupTarget(h);
                        setViewStandupTitle(`Standup Log · ${h.date}`);
                        setViewStandupModalOpen(true);
                      }}
                      className="shrink-0 px-3 py-1.5 bg-paper border border-line hover:border-ink font-mono text-xs text-ink font-semibold rounded-xs transition-colors flex items-center space-x-1"
                    >
                      <span>View Standup</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TODAY AT A GLANCE (4 REAL METRICS)                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider">
            Today at a Glance
          </span>
          <span className="font-mono text-[10px] text-muted">
            Live PostgreSQL Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* MY TASKS */}
          <div
            onClick={() => onNavigateTab('tasks')}
            className="p-4 bg-paper border border-line hover:border-ink rounded-xs space-y-1.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">My Tasks</span>
              <CheckSquare className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-2xl font-black text-ink">
              {data.openTasksCount}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {data.tasksDueTodayCount > 0 ? `${data.tasksDueTodayCount} due today` : `${data.lifetimeCompletedTasks} completed lifetime`}
            </p>
          </div>

          {/* HOMEWORK */}
          <div
            onClick={() => onNavigateTab('homework')}
            className="p-4 bg-paper border border-line hover:border-ink rounded-xs space-y-1.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Homework</span>
              <Sparkles className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-2xl font-black text-ink">
              {data.pendingHomeworkCount}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {data.totalHomeworkCount > 0 ? `${data.totalHomeworkCount - data.pendingHomeworkCount}/${data.totalHomeworkCount} submitted` : 'No homework'}
            </p>
          </div>

          {/* DAILY STANDUP */}
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
            className={`p-4 border rounded-xs space-y-1.5 transition-colors cursor-pointer shadow-2xs ${
              isSubmittedToday
                ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-600'
                : 'bg-paper border-line hover:border-ink'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Daily Standup</span>
              <Calendar className="w-3.5 h-3.5 text-muted" />
            </div>
            <div className={`font-mono text-sm sm:text-base font-bold flex items-center space-x-1.5 pt-1 ${
              isSubmittedToday ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {isSubmittedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Submitted ✓</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Pending —</span>
                </>
              )}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {isSubmittedToday && todayStandup?.submittedAt
                ? `At ${formatLocalTime(todayStandup.submittedAt)}`
                : 'Not submitted'}
            </p>
          </div>

          {/* BLOCKERS */}
          <div className={`p-4 border rounded-xs space-y-1.5 transition-colors shadow-2xs ${
            data.openBlockersCount > 0
              ? 'bg-red-500/5 border-red-500/30'
              : 'bg-paper border-line'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Blockers</span>
              <Shield className="w-3.5 h-3.5 text-muted" />
            </div>
            <div className={`font-mono text-2xl font-black ${
              data.openBlockersCount > 0 ? 'text-red-700' : 'text-ink'
            }`}>
              {data.openBlockersCount}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {data.openBlockersCount > 0 ? 'Requires Lead help' : 'Unblocked ✓'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. YOUR FOCUS TODAY (PRIORITY ENGINE)                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              Your Focus Today
            </h2>
          </div>
          <span className="font-mono text-[10px] text-muted">
            {data.focusItems?.length || 0} Priority Items
          </span>
        </div>

        {(!data.focusItems || data.focusItems.length === 0) ? (
          <div className="p-8 border border-line bg-paper rounded-xs text-center space-y-2 shadow-2xs">
            <div className="w-9 h-9 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-ink">
              Nothing requires your attention right now.
            </h3>
            <p className="font-mono text-xs text-muted max-w-md mx-auto">
              Your workspace is clear. Stay focused on your open tasks, work through your homework, or practice with the Interview Lab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.focusItems.map((item, idx) => {
              const isOverdue = item.type === 'OVERDUE_TASK';
              const isDueToday = item.type === 'TASK_DUE_TODAY';
              const isHomework = item.type === 'HOMEWORK_DUE';
              const isBlocker = item.type === 'BLOCKER';

              let borderColor = 'border-line hover:border-ink';
              let badgeColor = 'bg-paper-dark border-line text-ink';
              if (isOverdue) {
                borderColor = 'border-red-500/40 bg-red-500/5 hover:border-red-600';
                badgeColor = 'bg-red-500/10 border-red-500/30 text-red-700';
              } else if (isDueToday) {
                borderColor = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-600';
                badgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-800';
              } else if (isHomework) {
                borderColor = 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-600';
                badgeColor = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700';
              } else if (isBlocker) {
                borderColor = 'border-rose-500/40 bg-rose-500/5 hover:border-rose-600';
                badgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-700';
              }

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 border rounded-xs space-y-3 transition-colors shadow-2xs ${borderColor}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-muted">
                        0{idx + 1}
                      </span>
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs border uppercase ${badgeColor}`}>
                        {item.category}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-muted font-medium">
                      {item.dueInfo}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-ink line-clamp-2">
                      {item.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-line/60">
                    <span className="font-mono text-[10px] text-muted">
                      Status: <strong className="text-ink">{item.status}</strong>
                    </span>

                    <button
                      onClick={() => {
                        if (isHomework) {
                          onNavigateTab('homework');
                        } else if (isBlocker) {
                          setAskLeadOpen(true);
                        } else {
                          onNavigateTab('tasks');
                        }
                      }}
                      className="font-mono text-xs font-bold text-ink hover:text-accent flex items-center space-x-1 group"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. MY TASKS (COMPACT PERSONAL LIST)                                       */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-xs overflow-hidden shadow-2xs">
        <div className="p-4 bg-paper-dark border-b border-line flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-ink">
              My Tasks
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="font-mono text-xs font-bold text-ink hover:text-accent flex items-center space-x-1"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-line text-xs font-sans">
          {(!data.myTasks || data.myTasks.length === 0) ? (
            <div className="p-8 text-center space-y-1">
              <p className="font-display text-sm font-bold text-ink">
                Your task board is clear.
              </p>
              <p className="font-mono text-xs text-muted">
                No tasks are currently assigned to you.
              </p>
            </div>
          ) : (
            data.myTasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="p-3.5 flex items-center justify-between hover:bg-paper-light transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    task.status === 'DONE' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-accent' : 'bg-line-dark'
                  }`} />

                  <div className="min-w-0">
                    <span className={`font-medium block truncate ${
                      task.status === 'DONE' ? 'line-through text-muted' : 'text-ink'
                    }`}>
                      {task.title}
                    </span>
                    <div className="flex items-center space-x-2 font-mono text-[10px] text-muted">
                      <span>Priority: <strong className="text-ink">{task.priority}</strong></span>
                      <span>·</span>
                      <span>{task.deadline ? `Due: ${task.deadline}` : 'No deadline'}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pl-3">
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs border uppercase ${
                    task.status === 'DONE'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                      : task.status === 'IN_PROGRESS'
                      ? 'bg-accent/10 border-accent/30 text-ink'
                      : 'bg-paper-dark border-line text-muted'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. MY PROGRESS & DAILY WIN SNAPSHOT                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PROGRESS SNAPSHOT */}
        <div className="p-5 border border-line bg-paper rounded-xs space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-accent" />
              <h3 className="font-display text-sm font-bold text-ink">
                My Progress Snapshot
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="font-mono text-xs font-semibold text-ink hover:text-accent flex items-center space-x-1"
            >
              <span>My Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <div className="flex justify-between font-mono text-xs mb-1.5">
                <span className="text-muted">Task Completion Ratio</span>
                <span className="font-bold text-ink">{data.completedTasksTodayCount + data.lifetimeCompletedTasks > 0 ? `${data.lifetimeCompletedTasks} Tasks Done` : 'Ready to Start'}</span>
              </div>
              <div className="w-full bg-paper-dark border border-line h-2 rounded-xs overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((data.lifetimeCompletedTasks / Math.max(1, data.lifetimeCompletedTasks + data.openTasksCount)) * 100))}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted mt-1">
                {data.openTasksCount} active task{data.openTasksCount === 1 ? '' : 's'} in progress · {data.lifetimeCompletedTasks} lifetime completed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line font-mono text-xs">
              <div className="p-2.5 bg-paper-dark rounded-xs">
                <span className="text-muted text-[10px] block uppercase font-bold">Sprint Velocity</span>
                <span className="font-bold text-ink text-sm">{data.lifetimeCompletedTasks} Tasks Done</span>
              </div>
              <div className="p-2.5 bg-paper-dark rounded-xs">
                <span className="text-muted text-[10px] block uppercase font-bold">Today's Standup</span>
                <span className={`font-bold text-sm flex items-center space-x-1 ${isSubmittedToday ? 'text-emerald-700' : 'text-amber-800'}`}>
                  <span>{isSubmittedToday ? 'Submitted ✓' : 'Pending'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S WIN / STATUS */}
        <div className="p-5 border border-line bg-paper rounded-xs space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 border-b border-line pb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="font-display text-sm font-bold text-ink">
                Today's Summary
              </h3>
            </div>

            <div className="py-2">
              <p className="font-display text-base font-bold text-ink">
                {data.completedTasksTodayCount > 0
                  ? `Nice work. You've completed ${data.completedTasksTodayCount} task${data.completedTasksTodayCount > 1 ? 's' : ''} today!`
                  : isSubmittedToday
                  ? "Standup recorded. Keep making steady progress on your active board."
                  : "Your day is just getting started. One focused day at a time."}
              </p>
              <p className="font-mono text-xs text-muted mt-1 leading-relaxed">
                {data.openTasksCount === 0 && data.pendingHomeworkCount === 0
                  ? "Everything scheduled for today is complete. Outstanding execution!"
                  : `You have ${data.openTasksCount} active task${data.openTasksCount === 1 ? '' : 's'} and ${data.pendingHomeworkCount} homework item${data.pendingHomeworkCount === 1 ? '' : 's'} pending.`}
              </p>
            </div>
          </div>

          <div className="p-3 bg-paper-dark border border-line rounded-xs font-mono text-[11px] text-muted flex items-center justify-between">
            <span>Cohort: <strong className="text-ink">{data.teamName}</strong></span>
            <span>Week: <strong className="text-ink">{data.currentWeek} of {data.totalWeeks}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. MESSAGES TO YOUR LEAD ("ASK YOUR LEAD" INBOX)                          */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-ink">
              Messages to Your Lead
            </h3>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {data.directMessages?.length || 0} Messages
          </span>
        </div>

        <div className="text-xs">
          {!data.directMessages || data.directMessages.length === 0 ? (
            <p className="text-muted font-mono text-xs py-3 text-center">
              No messages sent to Lead yet. Use "Ask Your Lead" anytime to reach out.
            </p>
          ) : (
            <div className="divide-y divide-line space-y-2">
              {data.directMessages.slice(0, 4).map((msg) => (
                <div key={msg.id} className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-muted flex items-center space-x-1">
                        {msg.inputMethod === 'voice' ? <Mic className="w-3 h-3 text-accent" /> : <span>⌨</span>}
                        <span>{msg.inputMethod === 'voice' ? 'Voice' : 'Typed'}</span>
                      </span>
                      {msg.isUrgent && (
                        <span className="font-mono text-[10px] text-attention font-bold bg-attention/10 px-1.5 py-0.2 rounded-xs">
                          URGENT
                        </span>
                      )}
                      {msg.relatedTopic && (
                        <span className="font-mono text-[10px] text-muted bg-paper-dark border border-line px-1.5 py-0.2 rounded-xs">
                          {msg.relatedTopic}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px]">
                      {msg.status === 'ANSWERED' ? (
                        <span className="text-accent font-bold">Answered ✓</span>
                      ) : (
                        <span className="text-attention">Awaiting response</span>
                      )}
                    </span>
                  </div>

                  <p className="text-ink font-medium leading-relaxed">
                    "{msg.message}"
                  </p>

                  {msg.leadResponse && (
                    <div className="p-2.5 bg-paper-light border border-line rounded-xs text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-accent">
                          Lead Response:
                        </span>
                        {msg.respondedAt && (
                          <span className="font-mono text-[10px] text-muted">
                            {formatLocalTime(msg.respondedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-ink font-medium">{msg.leadResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10. TODAY'S WORK & SPRINT OBJECTIVES                                      */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm overflow-hidden">
        <div className="p-3.5 bg-paper-dark border-b border-line flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-ink">
              Today's Work
            </h2>
            <p className="text-xs text-muted">
              Assigned tasks and sprint objectives
            </p>
          </div>
          <span className="font-mono text-xs text-muted">
            {data.todayChecklist.filter((c) => c.completed).length}/{data.todayChecklist.length} Complete
          </span>
        </div>

        <div className="divide-y divide-line text-xs font-sans">
          {data.todayChecklist.length === 0 ? (
            <p className="text-muted font-mono text-xs py-4 text-center">
              No tasks assigned for today.
            </p>
          ) : (
            data.todayChecklist.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 flex items-center justify-between hover:bg-paper-light transition-colors ${
                  item.completed ? 'opacity-60 bg-paper-dark/30' : ''
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="shrink-0 text-muted">
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    ) : (
                      <Circle className="w-4 h-4 text-line-dark" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`font-medium block truncate ${
                        item.completed ? 'line-through text-muted' : 'text-ink'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="font-mono text-[10px] text-muted block">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-3">
                  {item.type === 'TASK' ? (
                    <button
                      onClick={() => onNavigateTab('tasks')}
                      className="font-mono text-[11px] text-accent hover:underline"
                    >
                      View Task →
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-paper-dark border border-line rounded-xs text-muted">
                      {item.badge || 'Sprint'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Member's Today Standup Modal */}
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

      {/* View Modal for Team Lead Standup or Standup History */}
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

      {/* Ask Lead Modal */}
      <AskLeadModal
        isOpen={askLeadOpen}
        onClose={() => setAskLeadOpen(false)}
        onSent={() => loadData()}
      />

      {/* Leave Email Generator Modal */}
      <LeaveEmailModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
      />
    </div>
  );
};
