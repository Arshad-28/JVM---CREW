import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore, getLocalTodayDateString } from '../../services/api';
import { MemberDashboard, Task, TaskStatus, TeamMeeting } from '../../types';
import { DailyStandupModal } from '../standup/DailyStandupModal';
import { AskLeadModal } from '../../components/common/AskLeadModal';
import { LeaveEmailModal } from '../../components/common/LeaveEmailModal';
import {
  Check,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Mail,
  Video,
  X,
  ExternalLink,
} from 'lucide-react';

interface MemberWorkspaceViewProps {
  onNavigateTab: (tab: string) => void;
}

export const MemberWorkspaceView: React.FC<MemberWorkspaceViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const isCurrentLead = Boolean(user?.isCurrentLead || user?.role === 'LEAD' || user?.role === 'ADMIN');
  const localToday = getLocalTodayDateString();

  const [data, setData] = useState<MemberDashboard | null>(() =>
    cacheStore.get<MemberDashboard>(`member_dash_${localToday}`)
  );
  const [upcomingMeeting, setUpcomingMeeting] = useState<TeamMeeting | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => !cacheStore.get<MemberDashboard>(`member_dash_${localToday}`)
  );
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [standupModalOpen, setStandupModalOpen] = useState(false);
  const [standupModalMode, setStandupModalMode] = useState<'WRITE' | 'VOICE' | 'VIEW'>('WRITE');
  const [standupModalViewOnly, setStandupModalViewOnly] = useState(false);
  const [standupModalEditing, setStandupModalEditing] = useState(false);
  const [askLeadOpen, setAskLeadOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Selected Task Detail Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent && !data) {
        setLoading(true);
      }
      setError(null);
      const [dash, meet] = await Promise.all([
        api.getMemberDashboard(localToday),
        api.getUpcomingMeeting().catch(() => null),
      ]);
      setData(dash);
      setUpcomingMeeting(meet);
      const isStandupDone = Boolean(
        dash?.todayStandup && (dash.todayStandup.id != null || dash.todayStandup.submittedAt != null)
      );
      window.dispatchEvent(
        new CustomEvent('jvm_standup_status_synced', { detail: { isDone: isStandupDone } })
      );
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

  // Handle task status toggle (e.g. from TODO/IN_PROGRESS to DONE and back)
  const handleToggleTaskStatus = async (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';

    // Optimistic UI update
    if (data && data.myTasks) {
      const updatedTasks = data.myTasks.map((t) =>
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      setData({ ...data, myTasks: updatedTasks });
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    }

    try {
      setUpdatingTaskId(task.id);
      await api.updateTask(task.id, { status: newStatus });
      // Invalidate cache and reload silently
      cacheStore.invalidate('tasks_list');
      cacheStore.invalidate(`member_dash_${localToday}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert if error
      loadData(true);
    } finally {
      setUpdatingTaskId(null);
    }
  };

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
      <div className="py-24 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Loading your workspace...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-16 max-w-md mx-auto text-center space-y-4 px-4">
        <div className="p-4 bg-paper-light border border-line text-ink text-xs rounded-lg">
          <p className="font-semibold">Unable to load workspace</p>
          <p className="mt-1 font-mono text-[11px] text-muted">{error}</p>
        </div>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-ink text-paper text-xs font-mono font-medium rounded-md hover:bg-ink-light transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !user) {
    return null;
  }

  // Derive time-aware greeting
  const hour = new Date().getHours();
  const timeWord =
    hour >= 0 && hour < 12
      ? 'GOOD MORNING'
      : hour >= 12 && hour < 17
      ? 'GOOD AFTERNOON'
      : 'GOOD EVENING';
  const firstName = user.name ? user.name.trim().split(' ')[0].toUpperCase() : 'ENGINEER';
  const greeting = `${timeWord}, ${firstName}.`;

  // Subtle formatted current date: e.g. "Wednesday, September 23"
  const formattedTodayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Team & Role Context
  const teamDisplayName = (data.teamName || user.teamName || 'JVM CREW').toUpperCase();
  const positionDisplayName = (user.position || data.position || 'SDE INTERN').toUpperCase();
  const contextLine = `${teamDisplayName} · ${positionDisplayName}`;

  const isSubmittedToday = Boolean(data.standupDoneToday || data.todayStandup);
  const todayStandup = data.todayStandup;

  // Real tasks from database
  const myTasks = data.myTasks || [];

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-10 sm:space-y-12 font-sans pb-16 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. HEADER (Context line, time-aware greeting, subtitle, and subtle date)   */}
      {/* ========================================================================= */}
      <header className="space-y-2 border-b border-line/70 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
            {contextLine}
          </p>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            {greeting}
          </h1>

          <p className="text-sm sm:text-base text-muted font-sans">
            Your personal workspace for today.
          </p>

          <p className="text-xs font-mono text-muted/70 pt-0.5">
            {formattedTodayDate}
          </p>
        </div>

        {/* Quiet utility actions */}
        <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
          {!isCurrentLead && (
            <button
              onClick={() => setAskLeadOpen(true)}
              className="px-3.5 py-1.5 bg-paper hover:bg-paper-light border border-line text-xs font-mono text-ink rounded-md transition-all duration-150 flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Send a question to your Team Lead"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Ask Lead</span>
            </button>
          )}

          <button
            onClick={() => setLeaveModalOpen(true)}
            className="p-2 bg-paper hover:bg-paper-light border border-line text-muted hover:text-ink rounded-md transition-all duration-150 shadow-2xs cursor-pointer"
            title="Generate Leave Request Email"
            aria-label="Generate Leave Request Email"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TODAY'S PRIORITIES (The Primary Section of the Page)                   */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
              Today's Priorities
            </h2>
            <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
              The work that needs your attention today.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-mono text-primary hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myTasks.length === 0 ? (
          /* Clean, quiet empty state */
          <div className="py-12 px-4 text-center space-y-2 border border-line/60 rounded-xl bg-paper-light/40">
            <p className="font-display text-base font-semibold text-ink">
              You're clear for today.
            </p>
            <p className="text-xs text-muted font-sans max-w-sm mx-auto">
              No tasks are currently assigned to you.
            </p>
            <div className="pt-3">
              <button
                onClick={() => onNavigateTab('tasks')}
                className="px-4 py-2 bg-paper hover:bg-paper-light border border-line text-xs font-mono font-medium text-ink rounded-md transition-all duration-150 shadow-2xs cursor-pointer"
              >
                View Tasks →
              </button>
            </div>
          </div>
        ) : (
          /* Clean vertical task list */
          <div className="divide-y divide-line/70">
            {myTasks.map((task) => {
              const isDone = task.status === 'DONE';
              const isUpdating = updatingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="py-3.5 px-3 -mx-3 rounded-lg hover:bg-paper-light/80 transition-colors duration-150 flex items-start gap-3.5 group cursor-pointer"
                >
                  {/* Interactive status checkbox */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleTaskStatus(task, e)}
                    disabled={isUpdating}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-line-dark hover:border-primary text-transparent hover:text-muted/40'
                    }`}
                    title={isDone ? 'Mark as In Progress' : 'Mark as Done'}
                    aria-label={`Mark task "${task.title}" as ${isDone ? 'incomplete' : 'complete'}`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isDone ? 'opacity-100' : 'opacity-0 hover:opacity-100'} stroke-[2.5]`} />
                  </button>

                  {/* Task details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isDone ? 'line-through text-muted' : 'text-ink group-hover:text-primary'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted font-sans line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata line: Priority · Deadline · Status */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-muted/80 pt-0.5">
                      <span className="font-medium text-ink-secondary">
                        {task.priority ? `${task.priority.charAt(0)}${task.priority.slice(1).toLowerCase()} priority` : 'Normal priority'}
                      </span>

                      {task.deadline && (
                        <>
                          <span>·</span>
                          <span className="text-muted">Due {task.deadline}</span>
                        </>
                      )}

                      <span>·</span>
                      <span
                        className={
                          isDone
                            ? 'text-emerald-700 font-semibold'
                            : task.status === 'IN_PROGRESS'
                            ? 'text-primary font-semibold'
                            : 'text-muted'
                        }
                      >
                        {task.status === 'IN_PROGRESS'
                          ? 'In progress'
                          : task.status === 'DONE'
                          ? 'Completed'
                          : task.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted/50 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. DAILY STANDUP (Second Most Important Action)                           */}
      {/* ========================================================================= */}
      <section className="border border-line/80 rounded-xl p-5 sm:p-6 bg-paper-light/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider">
              DAILY STANDUP
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSubmittedToday ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
            />
          </div>

          <p className="text-sm sm:text-base font-semibold text-ink">
            {isSubmittedToday ? "Today's standup submitted ✓" : 'STANDUP PENDING'}
          </p>

          <p className="text-xs text-muted font-sans">
            {isSubmittedToday && todayStandup?.submittedAt
              ? `Logged at ${formatLocalTime(todayStandup.submittedAt)} · Daily record on file.`
              : 'Share your yesterday progress and blockers with the team.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
          {!isSubmittedToday ? (
            <button
              onClick={() => {
                setStandupModalViewOnly(false);
                setStandupModalEditing(false);
                setStandupModalMode('WRITE');
                setStandupModalOpen(true);
              }}
              className="px-4 py-2.5 bg-primary text-paper hover:bg-primary-hover active:scale-[0.99] rounded-lg font-mono text-xs font-semibold transition-all duration-150 shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Submit today's standup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setStandupModalViewOnly(true);
                setStandupModalEditing(false);
                setStandupModalMode('VIEW');
                setStandupModalOpen(true);
              }}
              className="px-3.5 py-2 bg-paper hover:bg-paper-light border border-line text-ink rounded-lg font-mono text-xs font-semibold transition-all duration-150 shadow-2xs cursor-pointer"
            >
              <span>View / Edit</span>
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOMEWORK (Rendered only when real assignments need attention)          */}
      {/* ========================================================================= */}
      {data.pendingHomeworkCount > 0 && (
        <section className="border border-line/80 rounded-xl p-4 sm:p-5 bg-paper-light/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
              HOMEWORK
            </span>
            <p className="text-sm font-semibold text-ink">
              {data.pendingHomeworkCount} assignment{data.pendingHomeworkCount > 1 ? 's' : ''} need attention
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('homework')}
            className="px-3.5 py-2 bg-paper hover:bg-paper-light border border-line text-ink rounded-lg font-mono text-xs font-semibold transition-all duration-150 shadow-2xs flex items-center space-x-1.5 self-start sm:self-center cursor-pointer"
          >
            <span>View Homework</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOCKERS / ATTENTION (Rendered ONLY when real blockers exist)          */}
      {/* ========================================================================= */}
      {data.openBlockersCount > 0 && (
        <section className="border border-rose-500/30 rounded-xl p-4 sm:p-5 bg-rose-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span className="font-mono text-xs font-bold text-rose-800 uppercase tracking-wider">
                Needs Attention
              </span>
            </div>
            <span className="text-xs font-mono text-rose-700 font-semibold">
              {data.openBlockersCount} Active Blocker{data.openBlockersCount > 1 ? 's' : ''}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
            You have flagged items requiring Team Lead intervention. Check your standup or send a direct question.
          </p>

          {!isCurrentLead && (
            <div className="pt-1">
              <button
                onClick={() => setAskLeadOpen(true)}
                className="px-3.5 py-1.5 bg-paper hover:bg-paper-light border border-line text-xs font-mono font-semibold text-ink rounded-md transition-all duration-150 cursor-pointer"
              >
                Contact Lead →
              </button>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. UPCOMING TEAM MEETING (Rendered ONLY when a real meeting is scheduled)  */}
      {/* ========================================================================= */}
      {upcomingMeeting && (
        <section className="border border-line/80 rounded-xl p-4 sm:p-5 bg-paper-light/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-paper border border-line rounded-lg text-primary shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider block">
                UPCOMING SYNC
              </span>
              <p className="text-sm font-semibold text-ink truncate">{upcomingMeeting.title}</p>
              <p className="text-xs text-muted font-mono">
                {upcomingMeeting.startTime} {upcomingMeeting.platform ? `· ${upcomingMeeting.platform.replace('_', ' ')}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('meetings')}
            className="px-3.5 py-2 bg-paper hover:bg-paper-light border border-line text-ink rounded-lg font-mono text-xs font-semibold transition-all duration-150 shadow-2xs self-start sm:self-center cursor-pointer"
          >
            <span>Meeting Details →</span>
          </button>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. TASK DETAIL MODAL (Lightweight, focused, human-designed modal)          */}
      {/* ========================================================================= */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-2xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-lg bg-paper border border-line rounded-2xl shadow-elevated p-6 space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
              <div className="space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">
                  TASK #{selectedTask.id}
                </span>
                <h3 className="font-display text-lg font-bold text-ink">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-muted hover:text-ink rounded-md transition-colors cursor-pointer"
                aria-label="Close task details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3.5 text-xs font-sans">
              {selectedTask.description ? (
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-muted block mb-1">
                    Description
                  </span>
                  <p className="text-ink leading-relaxed whitespace-pre-wrap bg-paper-light p-3 rounded-lg border border-line/60">
                    {selectedTask.description}
                  </p>
                </div>
              ) : (
                <p className="text-muted italic">No extra description provided for this task.</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-paper-light border border-line/60">
                  <span className="text-muted block text-[10px] uppercase">Priority</span>
                  <span className="font-semibold text-ink">
                    {selectedTask.priority || 'Normal'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-paper-light border border-line/60">
                  <span className="text-muted block text-[10px] uppercase">Status</span>
                  <span
                    className={`font-semibold ${
                      selectedTask.status === 'DONE' ? 'text-emerald-700' : 'text-primary'
                    }`}
                  >
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedTask.deadline && (
                <div className="p-2.5 rounded-lg bg-paper-light border border-line/60 font-mono text-[11px]">
                  <span className="text-muted block text-[10px] uppercase">Deadline</span>
                  <span className="font-semibold text-ink">{selectedTask.deadline}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-line">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  onNavigateTab('tasks');
                }}
                className="text-xs font-mono text-primary hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <span>Open in Kanban Board</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleToggleTaskStatus(selectedTask)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  selectedTask.status === 'DONE'
                    ? 'bg-paper-light hover:bg-paper-dark border border-line text-ink'
                    : 'bg-primary text-paper hover:bg-primary-hover'
                }`}
              >
                {selectedTask.status === 'DONE' ? 'Reopen Task' : 'Mark as Done ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SHARED MODALS (DailyStandup, AskLead, LeaveEmail)                       */}
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
          loadData(true);
        }}
        onSubmitted={() => {
          setStandupModalOpen(false);
          window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
          loadData(true);
        }}
        targetDate={localToday}
      />

      <AskLeadModal
        isOpen={askLeadOpen}
        onClose={() => setAskLeadOpen(false)}
        onSent={() => loadData(true)}
      />

      <LeaveEmailModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
      />
    </div>
  );
};
