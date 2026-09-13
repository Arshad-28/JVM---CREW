import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, getLocalTodayDateString } from '../../services/api';
import { LeadDailyBrief, TeamQuestion, TeamSummaryRow, LeadMessage, Standup } from '../../types';
import {
  getTimeGreeting,
  getPersonalDailyContext,
  getFormattedTodayDate,
} from '../../utils/greetingEngine';
import {
  History,
  AlertTriangle,
  MessageSquare,
  Plus,
  ChevronRight,
  X,
  Mic,
  Bell,
  Users,
  Shield,
  CheckSquare,
  ArrowRight,
  UserCheck,
  FileDown,
  Play,
} from 'lucide-react';
import { StandupAudioPlayer } from '../../components/common/StandupAudioPlayer';

interface LeadDailyBriefViewProps {
  onNavigateTab?: (tab: string) => void;
}

const formatShortDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${months[mIdx] || parts[1]} ${parseInt(parts[2], 10)}`;
      }
      return dateStr;
    }
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return '';
  }
};

export const LeadDailyBriefView: React.FC<LeadDailyBriefViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [brief, setBrief] = useState<LeadDailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action State
  const [answeringQuestion, setAnsweringQuestion] = useState<TeamQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [playingStandupId, setPlayingStandupId] = useState<number | null>(null);
  const [teamHistoryOpen, setTeamHistoryOpen] = useState(false);
  const [teamHistoryList, setTeamHistoryList] = useState<Standup[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPlayingId, setHistoryPlayingId] = useState<number | null>(null);

  const handleOpenTeamHistory = async () => {
    setTeamHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const hist = await api.getTeamStandupHistory();
      setTeamHistoryList(hist || []);
    } catch (e) {
      console.error('Failed to load team standup history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };


  const [respondingMessage, setRespondingMessage] = useState<LeadMessage | null>(null);
  const [messageResponseText, setMessageResponseText] = useState('');
  const [submittingMessageResponse, setSubmittingMessageResponse] = useState(false);

  const [newFollowUpOpen, setNewFollowUpOpen] = useState(false);
  const [followUpUserId, setFollowUpUserId] = useState<number | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  const [selectedMemberUpdate, setSelectedMemberUpdate] = useState<TeamSummaryRow | null>(null);
  const [remindedMembers, setRemindedMembers] = useState<Record<number, boolean>>({});

  const localToday = getLocalTodayDateString();
  const { fullTitle } = getFormattedTodayDate();

  const loadBrief = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLeadDailyBrief(localToday);
      setBrief(data);
      if (data.teamSummary && data.teamSummary.length > 0 && !followUpUserId) {
        setFollowUpUserId(data.teamSummary[0].userId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrief();
    const handleStandupSubmitted = () => {
      loadBrief();
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

  const handleResolveBlocker = async (id: number) => {
    try {
      await api.resolveBlocker(id);
      loadBrief();
    } catch (err: any) {
      alert('Failed to resolve blocker: ' + err.message);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answeringQuestion || !answerText.trim()) return;
    try {
      setSubmittingAnswer(true);
      await api.answerQuestion(answeringQuestion.standupId, answerText.trim());
      setAnsweringQuestion(null);
      setAnswerText('');
      loadBrief();
    } catch (err: any) {
      alert('Failed to submit answer: ' + err.message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleMessageResponseSubmit = async () => {
    if (!respondingMessage || !messageResponseText.trim()) return;
    try {
      setSubmittingMessageResponse(true);
      await api.respondToLeadMessage(respondingMessage.id, messageResponseText.trim());
      setRespondingMessage(null);
      setMessageResponseText('');
      loadBrief();
    } catch (err: any) {
      alert('Failed to respond to message: ' + err.message);
    } finally {
      setSubmittingMessageResponse(false);
    }
  };

  const handleCreateFollowUp = async () => {
    if (!followUpUserId || !followUpNote.trim()) return;
    try {
      setSubmittingFollowUp(true);
      await api.createFollowUp(followUpUserId, followUpNote.trim());
      setNewFollowUpOpen(false);
      setFollowUpNote('');
      loadBrief();
    } catch (err: any) {
      alert('Failed to create follow-up: ' + err.message);
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleRemindMember = (userId: number) => {
    setRemindedMembers((prev) => ({ ...prev, [userId]: true }));
  };

  if (loading || !user) {
    return (
      <div className="py-24 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Loading Team Lead Workspace...</span>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="p-4 bg-attention/10 border border-attention text-attention text-xs rounded-sm">
        {error || 'Unable to load Team Today.'}
      </div>
    );
  }

  const pendingCount = Math.max(0, brief.totalMembers - brief.updatesReceived);

  // Personalized Greeting
  const greetingTitle = getTimeGreeting(user.name);
  const dailyContext = getPersonalDailyContext({
    role: user.role,
    openBlockers: brief.openBlockersCount,
    needsAttentionCount: brief.needsAttentionCount,
    totalMembers: brief.totalMembers,
    updatesReceived: brief.updatesReceived,
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans animate-fade-in pb-8">
      {/* ========================================================================= */}
      {/* 1. PERSONALIZED HERO COMMAND CENTER FOR LEAD                              */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-6 sm:p-7 shadow-2xs space-y-6 relative overflow-hidden">
        {/* TOP IDENTITY ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line pb-4">
          <div className="flex items-center space-x-2.5">
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-paper-dark border border-line text-ink">
              {user.serialNumber || 'LEAD'}
            </span>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs bg-paper-dark border border-line text-muted">
              {user.position || 'SDE Intern'}
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-accent/10 border border-accent/20 text-accent uppercase">
              {user.role}
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px] text-muted uppercase tracking-wider">
            <span>{fullTitle}</span>
            <span>·</span>
            <span className="text-ink font-semibold">{brief.teamName}</span>
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
              Your crew's workspace is ready. Here's what needs your attention.
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
                TODAY'S PULSE
              </span>
              <span className="font-mono text-[10px] text-accent font-bold">
                LIVE
              </span>
            </div>

            {/* 3 REAL METRICS */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* CREW */}
              <div className="p-2 bg-paper border border-line rounded-xs space-y-0.5">
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">Crew</span>
                <span className="font-mono text-lg font-black text-ink block leading-tight">
                  {brief.totalMembers}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">Members</span>
              </div>

              {/* DAILY STANDUP */}
              <div className="p-2 bg-paper border border-line rounded-xs space-y-0.5">
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">Daily Standup</span>
                <span className="font-mono text-lg font-black text-ink block leading-tight">
                  {brief.updatesReceived}/{brief.totalMembers}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">
                  {pendingCount > 0 ? `${pendingCount} pending` : 'Complete ✓'}
                </span>
              </div>

              {/* ATTENTION */}
              <div className={`p-2 border rounded-xs space-y-0.5 ${
                brief.needsAttentionCount > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                  : 'bg-paper border-line text-ink'
              }`}>
                <span className="font-mono text-[9px] text-muted uppercase font-bold block">Attention</span>
                <span className="font-mono text-lg font-black block leading-tight">
                  {brief.needsAttentionCount}
                </span>
                <span className="font-mono text-[9px] text-muted block truncate">
                  {brief.needsAttentionCount > 0 ? 'Review' : 'Clear ✓'}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigateTab?.('team')}
                  className="w-full px-3 py-2 bg-ink text-paper hover:bg-ink-light rounded-xs font-mono text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5 text-accent" />
                  <span>TEAM COCKPIT</span>
                </button>

                <button
                  onClick={() => onNavigateTab?.('tasks')}
                  className="w-full px-3 py-2 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-muted" />
                  <span>MY TASKS</span>
                </button>
              </div>

              <button
                onClick={() => api.downloadTeamStandupPdf(localToday)}
                className="w-full px-3 py-2 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                title="Download official PDF report of all team members' standups for today"
              >
                <FileDown className="w-3.5 h-3.5 text-accent" />
                <span>EXPORT TODAY'S TEAM STANDUP (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CREW PULSE — TODAY AT A GLANCE (5 SUMMARY CARDS)                       */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider">
            Crew Pulse & Telemetry
          </span>
          <span className="font-mono text-[10px] text-muted">
            Live PostgreSQL Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* TOTAL MEMBERS */}
          <div
            onClick={() => onNavigateTab?.('team')}
            className="p-4 bg-paper border border-line hover:border-ink rounded-xs space-y-1.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Members</span>
              <Users className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-2xl font-black text-ink">
              {brief.totalMembers}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              Active Crew Roster
            </p>
          </div>

          {/* STANDUP STATUS */}
          <div
            onClick={() => onNavigateTab?.('team')}
            className="p-4 bg-paper border border-line hover:border-ink rounded-xs space-y-1.5 transition-colors cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Standups In</span>
              <UserCheck className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-2xl font-black text-ink">
              {brief.updatesReceived}/{brief.totalMembers}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {pendingCount > 0 ? `${pendingCount} pending` : 'All submitted ✓'}
            </p>
          </div>

          {/* TEAM ATTENTION */}
          <div className={`p-4 border rounded-xs space-y-1.5 transition-colors shadow-2xs ${
            brief.needsAttentionCount > 0
              ? 'bg-amber-500/5 border-amber-500/30'
              : 'bg-paper border-line'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Attention</span>
              <AlertTriangle className="w-3.5 h-3.5 text-muted" />
            </div>
            <div className={`font-mono text-2xl font-black ${
              brief.needsAttentionCount > 0 ? 'text-amber-700' : 'text-ink'
            }`}>
              {brief.needsAttentionCount}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {brief.needsAttentionCount > 0 ? 'Requires Lead Review' : 'Clear ✓'}
            </p>
          </div>

          {/* BLOCKERS */}
          <div className={`p-4 border rounded-xs space-y-1.5 transition-colors shadow-2xs ${
            brief.openBlockersCount > 0
              ? 'bg-red-500/5 border-red-500/30'
              : 'bg-paper border-line'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">Blockers</span>
              <Shield className="w-3.5 h-3.5 text-muted" />
            </div>
            <div className={`font-mono text-2xl font-black ${
              brief.openBlockersCount > 0 ? 'text-red-700' : 'text-ink'
            }`}>
              {brief.openBlockersCount}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              {brief.openBlockersCount > 0 ? 'Roadblocks Open' : 'All unblocked ✓'}
            </p>
          </div>

          {/* LEAD MY TASKS */}
          <div
            onClick={() => onNavigateTab?.('tasks')}
            className="p-4 bg-paper border border-line hover:border-ink rounded-xs space-y-1.5 transition-colors cursor-pointer group shadow-2xs col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted uppercase font-bold">My Tasks</span>
              <CheckSquare className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="font-mono text-2xl font-black text-ink">
              {brief.leadOpenTasksCount || 0}
            </div>
            <p className="font-mono text-[10px] text-muted truncate">
              Lead Personal Tasks
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION: NEEDS YOUR ATTENTION (EMERGENCY / URGENT ITEMS)               */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-attention" />
            <h2 className="font-display text-sm font-bold text-ink">
              Needs Your Attention
            </h2>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {brief.needsAttention.length} Items
          </span>
        </div>

        {brief.needsAttention.length === 0 ? (
          <p className="text-muted font-mono text-xs py-3 text-center">
            Nothing needs your attention right now.
          </p>
        ) : (
          <div className="divide-y divide-line text-xs">
            {brief.needsAttention.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-ink">
                      {item.userName}
                    </span>
                    {item.inputMethod === 'voice' && (
                      <span className="font-mono text-[10px] text-accent flex items-center space-x-0.5">
                        <Mic className="w-3 h-3" />
                        <span>Voice</span>
                      </span>
                    )}
                    {item.type === 'URGENT_MESSAGE' && (
                      <span className="font-mono text-[10px] text-attention font-bold bg-attention/10 px-1 rounded-xs">
                        URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-muted leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="shrink-0">
                  {item.type === 'QUESTION' ? (
                    <button
                      onClick={() => {
                        const q = brief.questionsFromTeam.find((x) => x.userId === item.userId);
                        if (q) setAnsweringQuestion(q);
                      }}
                      className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors"
                    >
                      Respond
                    </button>
                  ) : item.type === 'URGENT_MESSAGE' ? (
                    <button
                      onClick={() => {
                        const msg = brief.messagesForYou?.find((x) => x.id === item.entityId);
                        if (msg) setRespondingMessage(msg);
                      }}
                      className="px-3.5 py-1.5 bg-attention text-paper hover:bg-attention-dark font-mono text-xs font-semibold rounded-sm transition-colors"
                    >
                      Respond
                    </button>
                  ) : item.type === 'BLOCKER' ? (
                    <button
                      onClick={() => {
                        if (item.entityId) {
                          handleResolveBlocker(item.entityId);
                        } else {
                          const member = brief.teamSummary.find((x) => x.userId === item.userId);
                          if (member) setSelectedMemberUpdate(member);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-attention text-paper hover:bg-attention-dark font-mono text-xs font-semibold rounded-sm transition-colors"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const member = brief.teamSummary.find((x) => x.userId === item.userId);
                        if (member) setSelectedMemberUpdate(member);
                      }}
                      className="px-3 py-1 bg-paper-dark border border-line text-ink hover:border-ink font-mono text-xs rounded-sm transition-colors"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: TODAY'S TEAM UPDATES (CLEAN ROWS/CARDS)                       */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <h2 className="font-display text-sm font-bold text-ink">
              Today's Team Updates
            </h2>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper-dark border border-line text-muted">
              {brief.date ? new Date(brief.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-mono text-[11px] text-muted">
              {brief.updatesReceived}/{brief.totalMembers} Submitted
            </span>
            <button
              type="button"
              onClick={handleOpenTeamHistory}
              className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink rounded-xs font-mono text-xs font-bold text-ink transition-colors flex items-center space-x-1.5 shadow-2xs"
              title="View all team standup history grouped by date"
            >
              <History className="w-3.5 h-3.5 text-accent" />
              <span>Standup History</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {brief.teamSummary.map((m) => {
            const isSubmitted = m.status === 'SUBMITTED';

            return (
              <React.Fragment key={m.userId}>
                <div
                  className="p-4 border border-line rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-paper-light transition-colors"
                >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-ink text-sm">
                      {m.name}
                    </span>
                    {isSubmitted ? (
                      (m.submissionType === 'VOICE' || m.hasVoiceRecording) ? (
                        <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold rounded-xs flex items-center space-x-1">
                          <Mic className="w-3 h-3" />
                          <span>VOICE STANDUP — SUBMITTED · {formatShortDate(m.submittedAt || brief.date)} · {formatLocalTime(m.submittedAt)} {m.audioDurationSeconds ? `· ${m.audioDurationSeconds}s` : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold rounded-xs">
                          SUBMITTED · {formatShortDate(m.submittedAt || brief.date)} · {formatLocalTime(m.submittedAt)}
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 bg-paper-dark border border-line text-muted font-mono text-[10px] rounded-xs">
                        NOT SUBMITTED
                      </span>
                    )}
                  </div>

                  {isSubmitted ? (
                    <div className="space-y-1 text-xs">
                      <p className="text-ink font-medium leading-relaxed">
                        {m.progress}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
                        <span>
                          Status: <strong className={m.hasBlocker ? 'text-attention' : 'text-ink font-semibold'}>
                            {m.hasBlocker ? m.blockerStatus : 'No blocker'}
                          </strong>
                        </span>

                        <span>
                          Confidence: <strong className="text-ink">{m.confidenceLabel || (m.confidence ? `${m.confidence}/5` : '—')}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted font-mono italic">
                      Today's standup has not been submitted.
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  {isSubmitted && (m.submissionType === 'VOICE' || m.hasVoiceRecording) && m.standupId && (
                    <button
                      onClick={() => setPlayingStandupId(playingStandupId === m.standupId ? null : (m.standupId ?? null))}
                      className={`px-3 py-1.5 font-mono text-xs font-semibold rounded-xs transition-colors flex items-center space-x-1.5 shadow-xs ${
                        playingStandupId === m.standupId
                          ? 'bg-accent text-paper'
                          : 'bg-ink text-paper hover:bg-ink-light'
                      }`}
                      title={playingStandupId === m.standupId ? "Close audio player" : "Listen to voice recording"}
                    >
                      {playingStandupId === m.standupId ? (
                        <span>Close Player</span>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-accent" />
                          <span>Play Voice</span>
                        </>
                      )}
                    </button>
                  )}

                  {isSubmitted ? (
                    <button
                      onClick={() => setSelectedMemberUpdate(m)}
                      className="px-3.5 py-1.5 border border-line hover:border-ink bg-paper text-ink font-mono text-xs font-medium rounded-sm transition-colors flex items-center space-x-1"
                    >
                      <span>View Update</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemindMember(m.userId)}
                      disabled={remindedMembers[m.userId]}
                      className={`px-3 py-1.5 border rounded-sm font-mono text-xs transition-colors flex items-center space-x-1 ${
                        remindedMembers[m.userId]
                          ? 'border-line bg-paper-dark text-muted cursor-default'
                          : 'border-line hover:border-ink bg-paper text-ink'
                      }`}
                    >
                      <Bell className="w-3 h-3 text-muted" />
                      <span>{remindedMembers[m.userId] ? 'Reminded' : 'Remind'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Voice Player when Play Voice is active */}
              {isSubmitted && m.standupId && playingStandupId === m.standupId && (
                <div className="p-3 bg-paper-dark border border-line rounded-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-accent flex items-center space-x-1.5">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Playing {m.name}'s voice standup · {m.audioDurationSeconds ? `${m.audioDurationSeconds}s` : 'Recorded'}</span>
                    </span>
                    <button
                      onClick={() => setPlayingStandupId(null)}
                      className="text-muted hover:text-ink font-mono text-[10px]"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <StandupAudioPlayer
                    standupId={m.standupId}
                    initialDurationSeconds={m.audioDurationSeconds || undefined}
                    title={`${m.name}'s Voice Standup`}
                    autoPlay={true}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SECTION: MY WORK (LEAD'S PERSONAL TASKS ONLY)                          */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-xs overflow-hidden shadow-2xs">
        <div className="p-4 bg-paper-dark border-b border-line flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-accent" />
            <h3 className="font-display text-sm font-bold text-ink">
              My Personal Work
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab?.('tasks')}
            className="font-mono text-xs font-bold text-ink hover:text-accent flex items-center space-x-1"
          >
            <span>Lead Task Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-line text-xs font-sans">
          {(!brief.leadTasks || brief.leadTasks.length === 0) ? (
            <div className="p-8 text-center space-y-1">
              <p className="font-display text-sm font-bold text-ink">
                Your personal task list is clear.
              </p>
              <p className="font-mono text-xs text-muted">
                No personal action items are assigned to you today.
              </p>
            </div>
          ) : (
            brief.leadTasks.slice(0, 5).map((task) => (
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
      {/* 5. SECTION: QUESTIONS FROM TEAM                                           */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm font-bold text-ink">
              Questions From Team
            </h2>
          </div>
          <span className="font-mono text-[11px] text-muted">
            {((brief.messagesForYou?.length || 0) + brief.questionsFromTeam.length)} Questions
          </span>
        </div>

        {(!brief.messagesForYou || brief.messagesForYou.length === 0) && brief.questionsFromTeam.length === 0 ? (
          <p className="text-muted font-mono text-xs py-4 text-center">
            No questions from your team.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Direct Messages */}
            {brief.messagesForYou?.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 border rounded-sm space-y-2 text-xs ${
                  msg.isUrgent ? 'bg-attention/5 border-attention/40' : 'bg-paper-dark border-line'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-ink">
                      {msg.userName}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      · {msg.inputMethod === 'voice' ? 'Voice' : 'Typed'} · {msg.isUrgent ? 'Urgent' : 'Normal'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px]">
                    {msg.status === 'ANSWERED' ? (
                      <span className="text-accent font-bold">Answered ✓</span>
                    ) : (
                      <span className="text-attention font-bold">Open</span>
                    )}
                  </span>
                </div>

                <p className="text-ink font-medium leading-relaxed">
                  "{msg.message}"
                </p>

                {msg.relatedTopic && (
                  <span className="font-mono text-[10px] text-muted block">
                    Topic: {msg.relatedTopic}
                  </span>
                )}

                {msg.leadResponse ? (
                  <div className="p-2 bg-paper border border-line rounded-xs text-[11px]">
                    <span className="font-mono font-bold text-accent block mb-0.5">
                      Your Response:
                    </span>
                    <p className="text-ink">{msg.leadResponse}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingMessage(msg)}
                    className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors"
                  >
                    Respond
                  </button>
                )}
              </div>
            ))}

            {/* Standup Questions for Lead */}
            {brief.questionsFromTeam.map((q) => (
              <div
                key={q.standupId}
                className="p-3.5 bg-paper-dark border border-line rounded-sm space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-ink">
                      {q.userName}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      · {q.inputMethod === 'voice' ? 'Voice' : 'Typed'} · Daily Standup
                    </span>
                  </div>
                  {q.answered ? (
                    <span className="font-mono text-[10px] text-accent font-bold">
                      Answered ✓
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-attention font-bold">
                      Open
                    </span>
                  )}
                </div>

                <p className="text-ink font-medium leading-relaxed">
                  "{q.question}"
                </p>

                {q.leadAnswer ? (
                  <div className="p-2 bg-paper border border-line rounded-xs text-[11px]">
                    <span className="font-mono font-bold text-accent block mb-0.5">
                      Your Answer:
                    </span>
                    <p className="text-ink">{q.leadAnswer}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnsweringQuestion(q)}
                    className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors"
                  >
                    Respond
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SECTION: LEAD FOLLOW-UPS                                               */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <h2 className="font-display text-sm font-bold text-ink">
            Lead Follow-ups
          </h2>
          <button
            onClick={() => setNewFollowUpOpen(true)}
            className="px-2.5 py-1 bg-paper-dark border border-line hover:border-ink font-mono text-[11px] font-semibold rounded-sm transition-colors flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Follow-up</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {brief.followUps.length === 0 ? (
            <p className="text-muted font-mono text-xs py-3 text-center">
              No active follow-ups. Click "+ Add Follow-up" to record a note.
            </p>
          ) : (
            brief.followUps.map((f) => (
              <div
                key={f.id}
                className={`p-2.5 border rounded-sm flex items-start justify-between gap-2 ${
                  f.status === 'COMPLETED' ? 'bg-paper-dark opacity-60' : 'bg-paper'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-ink">{f.userName}: </span>
                  <span className="text-ink">{f.note}</span>
                </div>
                {f.status === 'PENDING' && (
                  <span className="font-mono text-[10px] text-muted shrink-0">
                    Pending
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MEMBER UPDATE DETAIL MODAL                                                */}
      {/* ========================================================================= */}
      {selectedMemberUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-paper border border-line max-w-lg w-full p-5 rounded-sm shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  {selectedMemberUpdate.name}
                </h3>
                <span className="font-mono text-[11px] text-muted">
                  Daily Standup · {brief.date}
                </span>
              </div>
              <button
                onClick={() => setSelectedMemberUpdate(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-line rounded-sm divide-y divide-line text-xs">
              {selectedMemberUpdate.standupId && (selectedMemberUpdate.submissionType === 'VOICE' || selectedMemberUpdate.hasVoiceRecording) && (
                <div className="p-3 bg-paper-dark border border-line rounded-xs space-y-2">
                  <span className="font-mono text-[10px] uppercase font-bold text-accent flex items-center space-x-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Standup Recording ({selectedMemberUpdate.audioDurationSeconds ? `${selectedMemberUpdate.audioDurationSeconds}s` : 'Recorded'})</span>
                  </span>
                  <StandupAudioPlayer
                    standupId={selectedMemberUpdate.standupId}
                    initialDurationSeconds={selectedMemberUpdate.audioDurationSeconds || undefined}
                    title={`${selectedMemberUpdate.name}'s Voice Standup`}
                  />
                </div>
              )}

              <div className="p-3 bg-paper-light">
                <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-1">
                  Today's Progress {selectedMemberUpdate.primaryInputMethod === 'voice' ? '· 🎙 Voice' : '· ⌨ Typed'}
                </span>
                <p className="text-ink font-medium leading-relaxed">
                  {selectedMemberUpdate.submissionType === 'VOICE' ? 'Voice standup submitted.' : selectedMemberUpdate.progress}
                </p>
              </div>

              <div className="p-3">
                <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-1">
                  Learning / Focus
                </span>
                <p className="text-ink leading-relaxed">
                  {selectedMemberUpdate.learningSignal}
                </p>
              </div>

              <div className="p-3">
                <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-1">
                  Blocker
                </span>
                {selectedMemberUpdate.hasBlocker ? (
                  <p className="text-attention font-medium leading-relaxed">
                    {selectedMemberUpdate.blockerStatus}
                  </p>
                ) : (
                  <p className="text-muted">No blocker</p>
                )}
              </div>

              {selectedMemberUpdate.questionText && (
                <div className="p-3 bg-paper-dark">
                  <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-1">
                    Question for Lead
                  </span>
                  <p className="text-ink font-medium">
                    "{selectedMemberUpdate.questionText}"
                  </p>

                  {selectedMemberUpdate.leadAnswer ? (
                    <div className="mt-2 p-2 bg-paper border border-line rounded-xs">
                      <span className="font-mono text-[10px] font-bold text-accent block mb-0.5">
                        Your Answer:
                      </span>
                      <p className="text-ink">{selectedMemberUpdate.leadAnswer}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const q = brief.questionsFromTeam.find((x) => x.userId === selectedMemberUpdate.userId);
                        if (q) {
                          setSelectedMemberUpdate(null);
                          setAnsweringQuestion(q);
                        }
                      }}
                      className="mt-2 px-3.5 py-1.5 bg-ink text-paper font-mono text-xs rounded-xs font-semibold"
                    >
                      Respond to Question
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 gap-2">
              <button
                onClick={() => {
                  setFollowUpUserId(selectedMemberUpdate.userId);
                  setSelectedMemberUpdate(null);
                  setNewFollowUpOpen(true);
                }}
                className="px-3 py-1.5 border border-line text-ink font-mono text-xs rounded-sm hover:bg-paper-dark transition-colors"
              >
                + Add Follow-up
              </button>

              <div className="flex items-center space-x-2">
                {selectedMemberUpdate.standupId && (
                  <button
                    onClick={() => api.downloadStandupPdf(selectedMemberUpdate.standupId!)}
                    className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink text-ink font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5"
                    title="Download individual standup PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-accent" />
                    <span>Download PDF</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedMemberUpdate(null)}
                  className="px-4 py-1.5 bg-ink text-paper font-mono text-xs font-semibold rounded-sm hover:bg-ink-light"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ANSWER STANDUP QUESTION MODAL                                             */}
      {/* ========================================================================= */}
      {answeringQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-line max-w-lg w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-sm font-bold text-ink">
                Respond to {answeringQuestion.userName}
              </h3>
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-paper-dark border border-line rounded-sm text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-muted">
                Question asked ({answeringQuestion.inputMethod === 'voice' ? '🎙 Voice' : '⌨ Typed'}):
              </span>
              <p className="text-ink font-medium">"{answeringQuestion.question}"</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-muted uppercase">
                Your Answer / Guidance:
              </label>
              <textarea
                rows={4}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your explanation or advice for the member..."
                className="w-full p-3 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setAnsweringQuestion(null)}
                className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={submittingAnswer || !answerText.trim()}
                className="px-4 py-1.5 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm disabled:opacity-50"
              >
                {submittingAnswer ? 'Sending...' : 'Send Answer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESPOND TO DIRECT LEAD MESSAGE MODAL ("ASK YOUR LEAD")                    */}
      {/* ========================================================================= */}
      {respondingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-line max-w-lg w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-sm font-bold text-ink">
                  Reply to {respondingMessage.userName}
                </h3>
                {respondingMessage.isUrgent && (
                  <span className="px-1.5 py-0.2 bg-attention/10 text-attention font-mono text-[10px] font-bold rounded-xs">
                    URGENT
                  </span>
                )}
              </div>
              <button
                onClick={() => setRespondingMessage(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-paper-dark border border-line rounded-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold text-muted">
                  Message:
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {respondingMessage.inputMethod === 'voice' ? '🎙 Voice message' : '⌨ Typed'}
                </span>
              </div>
              <p className="text-ink font-medium leading-relaxed">"{respondingMessage.message}"</p>
              {respondingMessage.relatedTopic && (
                <span className="font-mono text-[10px] text-muted block pt-1">
                  Topic: {respondingMessage.relatedTopic}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-xs font-bold text-muted uppercase">
                Your Response:
              </label>
              <textarea
                rows={4}
                value={messageResponseText}
                onChange={(e) => setMessageResponseText(e.target.value)}
                placeholder="Write your response to the member..."
                className="w-full p-3 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRespondingMessage(null)}
                className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMessageResponseSubmit}
                disabled={submittingMessageResponse || !messageResponseText.trim()}
                className="px-4 py-1.5 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm disabled:opacity-50"
              >
                {submittingMessageResponse ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW FOLLOW-UP MODAL                                                       */}
      {/* ========================================================================= */}
      {newFollowUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-line max-w-md w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-sm font-bold text-ink">
                Add Leadership Follow-up
              </h3>
              <button
                onClick={() => setNewFollowUpOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[11px] font-bold text-muted uppercase block mb-1">
                  Team Member:
                </label>
                <select
                  value={followUpUserId || ''}
                  onChange={(e) => setFollowUpUserId(Number(e.target.value))}
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink"
                >
                  {brief.teamSummary.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[11px] font-bold text-muted uppercase block mb-1">
                  Follow-up Note:
                </label>
                <textarea
                  rows={3}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. Follow up on problem edge cases during next sync."
                  className="w-full p-2.5 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setNewFollowUpOpen(false)}
                className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFollowUp}
                disabled={submittingFollowUp || !followUpNote.trim()}
                className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm disabled:opacity-50"
              >
                {submittingFollowUp ? 'Saving...' : 'Save Follow-up'}
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* ========================================================================= */}
      {/* 8. TEAM STANDUP HISTORY MODAL (GROUPED BY CALENDAR DATE)                   */}
      {/* ========================================================================= */}
      {teamHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-paper border border-line max-w-3xl w-full p-6 rounded-sm shadow-xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Team Standup History
                  </h3>
                  <p className="font-mono text-xs text-muted">
                    Historical submissions grouped by calendar date · Audio recordings preserved
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTeamHistoryOpen(false)}
                className="text-muted hover:text-ink transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center font-mono text-xs text-muted space-y-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse inline-block" />
                <p>Loading historical team standups...</p>
              </div>
            ) : teamHistoryList.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-muted">
                No past standup recordings found in history.
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const groups: { [date: string]: Standup[] } = {};
                  teamHistoryList.forEach((item) => {
                    const d = item.date || 'Unknown Date';
                    if (!groups[d]) groups[d] = [];
                    groups[d].push(item);
                  });

                  return Object.keys(groups)
                    .sort((a, b) => b.localeCompare(a))
                    .map((dateKey) => {
                      const items = groups[dateKey];
                      const formattedGroupDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <div key={dateKey} className="border border-line rounded-sm overflow-hidden bg-paper">
                          {/* Group Header */}
                          <div className="bg-paper-dark p-3.5 border-b border-line flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-mono text-xs font-black text-ink uppercase">
                                {formattedGroupDate}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper border border-line text-muted">
                                {items.length} {items.length === 1 ? 'Submission' : 'Submissions'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => api.downloadTeamStandupPdf(dateKey)}
                              className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-[11px] font-bold transition-colors flex items-center space-x-1"
                              title={`Export PDF report for ${dateKey}`}
                            >
                              <FileDown className="w-3 h-3 text-accent" />
                              <span>Export Day PDF</span>
                            </button>
                          </div>

                          {/* Member Submissions on this date */}
                          <div className="divide-y divide-line">
                            {items.map((standup) => {
                              const isVoice = standup.submissionType === 'VOICE' || standup.hasVoiceRecording;
                              const isPlayingThis = historyPlayingId === standup.id;

                              return (
                                <div key={standup.id} className="p-4 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono font-bold text-ink text-sm">
                                        {standup.userName}
                                      </span>
                                      {isVoice ? (
                                        <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold rounded-xs flex items-center space-x-1">
                                          <Mic className="w-3 h-3" />
                                          <span>VOICE STANDUP · {formatShortDate(standup.submittedAt || standup.date)} · {formatLocalTime(standup.submittedAt)} {standup.audioDurationSeconds ? `· ${standup.audioDurationSeconds}s` : ''}</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-[10px] font-bold rounded-xs">
                                          WRITTEN · {formatShortDate(standup.submittedAt || standup.date)} · {formatLocalTime(standup.submittedAt)}
                                        </span>
                                      )}
                                      {standup.confidence && (
                                        <span className="font-mono text-[10px] text-muted bg-paper-dark px-1.5 py-0.5 rounded-xs border border-line">
                                          Confidence: {standup.confidenceLabel || `${standup.confidence}/5`}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      {isVoice && (
                                        <button
                                          type="button"
                                          onClick={() => setHistoryPlayingId(isPlayingThis ? null : standup.id)}
                                          className={`px-3 py-1 font-mono text-xs font-semibold rounded-xs transition-colors flex items-center space-x-1 ${
                                            isPlayingThis ? 'bg-accent text-paper' : 'bg-ink text-paper hover:bg-ink-light'
                                          }`}
                                        >
                                          {isPlayingThis ? (
                                            <span>Close Player</span>
                                          ) : (
                                            <>
                                              <Play className="w-3 h-3 fill-current text-accent" />
                                              <span>Play Voice</span>
                                            </>
                                          )}
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => api.downloadStandupPdf(standup.id)}
                                        className="p-1 text-muted hover:text-ink transition-colors border border-line rounded-xs"
                                        title="Download individual standup PDF"
                                      >
                                        <FileDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Audio Player for this historical item */}
                                  {isVoice && isPlayingThis && (
                                    <div className="p-3 bg-paper-dark border border-line rounded-xs space-y-2 animate-in fade-in duration-150">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="font-mono text-[10px] uppercase font-bold text-accent flex items-center space-x-1.5">
                                          <Mic className="w-3.5 h-3.5" />
                                          <span>Playing {standup.userName}'s recording from {standup.date} ({standup.audioDurationSeconds ? `${standup.audioDurationSeconds}s` : 'Recorded'})</span>
                                        </span>
                                        <button
                                          onClick={() => setHistoryPlayingId(null)}
                                          className="text-muted hover:text-ink font-mono text-[10px]"
                                        >
                                          ✕ Close
                                        </button>
                                      </div>
                                      <StandupAudioPlayer
                                        standupId={standup.id}
                                        initialDurationSeconds={standup.audioDurationSeconds || undefined}
                                        title={`${standup.userName} · ${standup.date} Voice Standup`}
                                        autoPlay={true}
                                      />
                                    </div>
                                  )}

                                  <div className="text-xs text-muted space-y-1 font-sans">
                                    <p>
                                      <strong className="text-ink font-medium">Update:</strong>{' '}
                                      {isVoice ? 'Voice standup submitted.' : (standup.yesterday || 'No details provided.')}
                                    </p>
                                    {standup.hasBlockers && standup.blockers && (
                                      <p className="text-rose-700 font-medium">
                                        <strong>Blocker:</strong> {standup.blockers}
                                      </p>
                                    )}
                                    {standup.questionForLead && (
                                      <p className="italic text-ink">
                                        <strong>Question:</strong> "{standup.questionForLead}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setTeamHistoryOpen(false)}
                className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
