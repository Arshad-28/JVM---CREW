import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { CrewMemberProfile } from '../../services/crewService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  ArrowRight,
  CheckCircle2,
  Layers,
  Plus,
  Target,
  Zap,
  Send,
  X,
  FileCheck,
  Edit3,
} from 'lucide-react';

interface PersonalMissionControlProps {
  user: any;
  memberProfile: CrewMemberProfile | null;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onCreateTask: () => void;
}

export const PersonalMissionControl: React.FC<PersonalMissionControlProps> = ({
  user,
  memberProfile,
  tasks,
  onOpenTask,
  onStatusChange,
  onCreateTask,
}) => {
  const [expandedStage, setExpandedStage] = useState<TaskStatus | null>('IN_PROGRESS');

  // Work Log / Progress Update Modal state
  const [updatingTask, setUpdatingTask] = useState<Task | null>(null);
  const [progressPct, setProgressPct] = useState<number>(50);
  const [workCompleted, setWorkCompleted] = useState<string>('');
  const [workingOn, setWorkingOn] = useState<string>('');
  const [blockerNote, setBlockerNote] = useState<string>('');

  // Filter tasks to ONLY those belonging to the currently logged-in member
  const memberTasks = tasks.filter((t) => t.assigneeId === user.id);

  // Performance metrics calculated from real data
  const activeTasks = memberTasks.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'TODO');
  const reviewTasks = memberTasks.filter((t) => t.status === 'REVIEW');
  const completedTasks = memberTasks.filter((t) => t.status === 'DONE');
  const totalCount = memberTasks.length;

  const momentumPct = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  // Identify top featured task for "NEXT MOVE"
  const inProgressTasks = memberTasks.filter((t) => t.status === 'IN_PROGRESS');
  const todoTasks = memberTasks.filter((t) => t.status === 'TODO');
  const featuredTask = inProgressTasks[0] || todoTasks[0] || memberTasks[0] || null;

  // Stages breakdown
  const stages: { id: TaskStatus; label: string; count: number }[] = [
    { id: 'BACKLOG', label: 'BACKLOG', count: memberTasks.filter((t) => t.status === 'BACKLOG').length },
    { id: 'TODO', label: 'ASSIGNED', count: memberTasks.filter((t) => t.status === 'TODO').length },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS', count: memberTasks.filter((t) => t.status === 'IN_PROGRESS').length },
    { id: 'REVIEW', label: 'SUBMITTED / REVIEW', count: memberTasks.filter((t) => t.status === 'REVIEW').length },
    { id: 'DONE', label: 'APPROVED / DONE', count: memberTasks.filter((t) => t.status === 'DONE').length },
  ];

  const handleOpenUpdateModal = (task: Task) => {
    setUpdatingTask(task);
    setProgressPct(task.progressPct || 50);
    setWorkCompleted('');
    setWorkingOn('');
    setBlockerNote('');
  };

  const handleSaveProgressUpdate = (submitForReview: boolean = false) => {
    if (!updatingTask) return;

    const newStatus: TaskStatus = submitForReview
      ? 'REVIEW'
      : progressPct === 100
      ? 'REVIEW'
      : 'IN_PROGRESS';

    onStatusChange(updatingTask.id, newStatus);
    setUpdatingTask(null);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* 1. PERSONAL HEADER */}
      <div className="border border-line bg-paper p-6 rounded-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 px-2 py-0.5 rounded-xs">
              {memberProfile?.serialNumber || user?.serialNumber || 'MEMBER'}
            </span>
            <span className="font-mono text-xs text-muted font-semibold uppercase">
              PERSONAL MISSION CONTROL
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight">
            {user.name}
          </h1>

          <p className="font-mono text-xs text-muted">
            {memberProfile?.identityTitle || 'THE ACE'} • {memberProfile?.characterClass || 'PRECISION / PROBLEM SOLVING'} • {memberProfile?.internshipRole || 'SDE Intern'}
          </p>
        </div>

        <button
          onClick={onCreateTask}
          className="px-4 py-2.5 bg-ink text-paper hover:bg-ink/90 rounded-sm font-mono text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Mission</span>
        </button>
      </div>

      {/* 2. PERFORMANCE SNAPSHOT METRIC STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-line bg-paper p-4 rounded-sm space-y-1">
          <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">ACTIVE MISSIONS</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-display text-2xl font-black text-ink">{activeTasks.length}</span>
            <span className="font-mono text-[10px] text-muted">in progress / assigned</span>
          </div>
        </div>

        <div className="border border-line bg-paper p-4 rounded-sm space-y-1">
          <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">IN REVIEW</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-display text-2xl font-black text-amber-700">{reviewTasks.length}</span>
            <span className="font-mono text-[10px] text-muted">waiting lead review</span>
          </div>
        </div>

        <div className="border border-line bg-paper p-4 rounded-sm space-y-1">
          <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">APPROVED & DONE</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-display text-2xl font-black text-emerald-700">{completedTasks.length}</span>
            <span className="font-mono text-[10px] text-muted">approved by lead</span>
          </div>
        </div>

        <div className="border border-line bg-paper p-4 rounded-sm space-y-1">
          <span className="font-mono text-[10px] uppercase font-bold text-muted tracking-wider">MOMENTUM</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-display text-2xl font-black text-amber-700">{momentumPct}%</span>
            <span className="font-mono text-[10px] text-muted">completion rate</span>
          </div>
        </div>
      </div>

      {/* 3. NEXT MOVE (Spotlight Task) */}
      {featuredTask && (
        <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono text-xs font-bold text-emerald-800 uppercase">
              <Zap className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>NEXT MOVE • FEATURED ENGINEERING TASK</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700 font-semibold">
              TASK-{featuredTask.id}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-ink">{featuredTask.title}</h3>
            <p className="text-xs text-muted font-sans line-clamp-2">
              {featuredTask.description || 'Focus on completing this core engineering item.'}
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted">Current Progress</span>
              <span className="font-bold text-ink">{featuredTask.progressPct}%</span>
            </div>
            <ProgressBar progressPct={featuredTask.progressPct} />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-muted">
              Est: {featuredTask.estHours || 4.0} hrs • Due: {featuredTask.deadline || 'Today'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {featuredTask.status === 'TODO' ? (
                <button
                  onClick={() => onStatusChange(featuredTask.id, 'IN_PROGRESS')}
                  className="px-4 py-2 bg-ink text-paper font-mono text-xs font-bold rounded-sm shadow-xs"
                >
                  START TASK
                </button>
              ) : featuredTask.status === 'IN_PROGRESS' ? (
                <>
                  <button
                    onClick={() => handleOpenUpdateModal(featuredTask)}
                    className="px-3 py-2 bg-paper border border-line hover:border-ink text-ink font-mono text-xs font-bold rounded-sm flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-muted" />
                    <span>Update Work Log</span>
                  </button>

                  <button
                    onClick={() => onStatusChange(featuredTask.id, 'REVIEW')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-bold rounded-sm shadow-xs flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                </>
              ) : (
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-500/20 px-3 py-1.5 rounded-xs">
                  {featuredTask.status === 'REVIEW' ? 'WAITING FOR LEAD REVIEW' : 'APPROVED BY LEAD'}
                </span>
              )}

              <button
                onClick={() => onOpenTask(featuredTask)}
                className="px-3 py-2 border border-line hover:border-ink text-ink font-mono text-xs font-bold rounded-sm"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TODAY'S MISSIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-ink" />
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-tight">
              MY ENGINEERING TASKS ({memberTasks.length})
            </h2>
          </div>
          <span className="font-mono text-xs text-muted">
            Assigned to {user.name.split(' ')[0]}
          </span>
        </div>

        {memberTasks.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono text-xs border border-dashed border-line bg-paper rounded-sm">
            No engineering tasks assigned to you yet. Click "New Mission" above to add your first task.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTask(task)}
                className="border border-line hover:border-ink bg-paper p-5 rounded-sm cursor-pointer space-y-3 transition-all duration-150 shadow-xs hover:shadow-md group"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted font-semibold">TASK-{task.id}</span>
                  <div className="flex items-center space-x-1.5">
                    {task.status === 'REVIEW' && (
                      <span className="font-mono text-[9px] font-bold text-amber-800 bg-amber-500/20 px-1.5 py-0.2 rounded-xs border border-amber-500/40">
                        WAITING REVIEW
                      </span>
                    )}
                    <StatusBadge type="priority" value={task.priority} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-sm font-bold text-ink group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {task.title}
                  </h3>
                  {task.labels && task.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {task.labels.map((l) => (
                        <span key={l} className="font-mono text-[9px] px-1.5 py-0.2 bg-paper-dark border border-line text-muted rounded-xs">
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-muted">
                    <span>Progress</span>
                    <span>{task.progressPct}%</span>
                  </div>
                  <ProgressBar progressPct={task.progressPct} />
                </div>

                <div className="pt-2 border-t border-line flex items-center justify-between text-xs font-mono text-muted">
                  <span className="text-[10px]">Due: {task.deadline || 'Today'}</span>

                  <div className="flex items-center space-x-2">
                    {task.status === 'TODO' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(task.id, 'IN_PROGRESS');
                        }}
                        className="text-[10px] font-bold text-ink hover:underline"
                      >
                        Start Task
                      </button>
                    ) : task.status === 'IN_PROGRESS' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenUpdateModal(task);
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        Update Log / Submit
                      </button>
                    ) : null}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTask(task);
                      }}
                      className="text-xs font-bold text-ink group-hover:text-emerald-700 flex items-center space-x-1 transition-colors"
                    >
                      <span>OPEN</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. WORKFLOW STAGES OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-line pb-2">
          <Layers className="w-4 h-4 text-ink" />
          <h2 className="font-display text-sm font-bold text-ink uppercase tracking-tight">
            MY WORKFLOW STAGES
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stages.map((st) => {
            const isSelected = expandedStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setExpandedStage(isSelected ? null : st.id)}
                className={`p-3 border text-left rounded-sm font-mono text-xs transition-all ${
                  isSelected
                    ? 'bg-ink text-paper border-ink font-bold shadow-xs'
                    : 'bg-paper text-ink border-line hover:border-ink'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold">{st.label}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 bg-paper-dark/20 rounded-xs">
                    {st.count}
                  </span>
                </div>
                <div className="text-[10px] text-muted truncate">
                  {st.count === 1 ? '1 task' : `${st.count} tasks`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Task Detail Dropdown */}
        {expandedStage && (
          <div className="p-4 border border-line bg-paper-dark/30 rounded-sm space-y-2 font-mono text-xs">
            <span className="font-bold text-ink block uppercase mb-2">
              Stage: {expandedStage} ({memberTasks.filter((t) => t.status === expandedStage).length} Items)
            </span>

            {memberTasks.filter((t) => t.status === expandedStage).length === 0 ? (
              <p className="text-muted text-xs italic">No tasks currently in this stage.</p>
            ) : (
              <div className="divide-y divide-line">
                {memberTasks.filter((t) => t.status === expandedStage).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTask(t)}
                    className="py-2.5 flex items-center justify-between hover:bg-paper cursor-pointer px-2 rounded-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-bold text-ink">TASK-{t.id}</span>
                      <span className="truncate">{t.title}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {t.status === 'IN_PROGRESS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(t.id, 'REVIEW');
                          }}
                          className="px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xs font-mono text-[10px] font-bold"
                        >
                          Submit for Review
                        </button>
                      )}
                      <span className="font-bold text-emerald-700">{t.progressPct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. RECENT WINS & MOMENTUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-line bg-paper p-5 rounded-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-line pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-display text-xs font-bold text-ink uppercase tracking-tight">
              APPROVED & COMPLETED MISSIONS
            </h3>
          </div>

          {completedTasks.length === 0 ? (
            <p className="text-muted font-mono text-xs py-4 text-center">
              No completed missions yet. Finish active tasks and submit for Lead review!
            </p>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {completedTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center space-x-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold shrink-0">TASK-{t.id}</span>
                  <span className="truncate">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-line bg-paper p-5 rounded-sm space-y-3">
          <div className="flex items-center space-x-2 border-b border-line pb-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="font-display text-xs font-bold text-ink uppercase tracking-tight">
              YOUR ENGINEERING MOMENTUM
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 border border-line bg-paper-dark/30 rounded-xs">
              <span className="font-display text-xl font-black text-ink">{completedTasks.length}</span>
              <span className="font-mono text-[10px] text-muted block uppercase">TOTAL FINISHED</span>
            </div>

            <div className="p-3 border border-line bg-paper-dark/30 rounded-xs">
              <span className="font-display text-xl font-black text-amber-700">{momentumPct}%</span>
              <span className="font-mono text-[10px] text-muted block uppercase">COMPLETION RATE</span>
            </div>
          </div>

          <div className="p-3 border border-line bg-paper-dark/20 rounded-xs font-mono text-xs text-center text-muted">
            {user.name} • Assigned Tasks: {memberTasks.length} • Finished: {completedTasks.length}
          </div>
        </div>
      </div>

      {/* MEMBER PROGRESS & WORK LOG MODAL */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-paper border border-line w-full sm:max-w-md rounded-t-lg sm:rounded-sm shadow-xl p-4 sm:p-6 space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center space-x-2 font-mono text-xs">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-ink uppercase">UPDATE WORK LOG & PROGRESS</span>
              </div>
              <button onClick={() => setUpdatingTask(null)} className="p-1 text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] text-muted font-bold block">TASK:</span>
                <span className="font-bold text-ink">TASK-{updatingTask.id}: {updatingTask.title}</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>PROGRESS PERCENTAGE</span>
                  <span className="text-emerald-700">{progressPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">WHAT I COMPLETED TODAY</label>
                <textarea
                  rows={2}
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="e.g. Created database schema, implemented JPA repository layer..."
                  className="w-full px-3 py-1.5 bg-paper border border-line focus:border-ink rounded-xs outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">CURRENTLY WORKING ON</label>
                <input
                  type="text"
                  value={workingOn}
                  onChange={(e) => setWorkingOn(e.target.value)}
                  placeholder="e.g. REST Controller endpoints & JWT validation"
                  className="w-full px-3 py-1.5 bg-paper border border-line focus:border-ink rounded-xs outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">BLOCKER / HELP NEEDED (OPTIONAL)</label>
                <input
                  type="text"
                  value={blockerNote}
                  onChange={(e) => setBlockerNote(e.target.value)}
                  placeholder="Explain any issue blocking progress..."
                  className="w-full px-3 py-1.5 bg-paper border border-line focus:border-ink rounded-xs outline-none font-sans"
                />
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(false)}
                  className="px-3 py-1.5 border border-line hover:border-ink rounded-xs text-ink font-bold"
                >
                  Save Progress
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(true)}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Submit For Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
