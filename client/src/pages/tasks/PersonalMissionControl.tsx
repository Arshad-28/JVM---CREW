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
  Clock,
  Rocket,
  Flame,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
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
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('ALL');

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

  // Filtered task list based on active filter tab
  const filteredMemberTasks = memberTasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS' || t.status === 'TODO';
    if (taskFilter === 'REVIEW') return t.status === 'REVIEW';
    if (taskFilter === 'DONE') return t.status === 'DONE';
    return true;
  });

  // Stages breakdown
  const stages: { id: TaskStatus; label: string; count: number; color: string; badgeBg: string }[] = [
    { id: 'BACKLOG', label: 'Backlog', count: memberTasks.filter((t) => t.status === 'BACKLOG').length, color: 'text-stone-600', badgeBg: 'bg-stone-100 text-stone-700' },
    { id: 'TODO', label: 'Assigned', count: memberTasks.filter((t) => t.status === 'TODO').length, color: 'text-blue-600', badgeBg: 'bg-blue-50 text-blue-700' },
    { id: 'IN_PROGRESS', label: 'In Progress', count: memberTasks.filter((t) => t.status === 'IN_PROGRESS').length, color: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-700' },
    { id: 'REVIEW', label: 'In Review', count: memberTasks.filter((t) => t.status === 'REVIEW').length, color: 'text-purple-600', badgeBg: 'bg-purple-50 text-purple-700' },
    { id: 'DONE', label: 'Completed', count: memberTasks.filter((t) => t.status === 'DONE').length, color: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-700' },
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
    <div className="space-y-7 animate-fade-in font-sans">
      {/* 1. MODERN HERO WORKSPACE BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-paper-light via-surface to-paper border border-line/80 rounded-2xl p-6 sm:p-7 shadow-xs">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {memberProfile?.serialNumber || user?.serialNumber || 'CREW MEMBER'}
              </span>
              <span className="text-muted/40">·</span>
              <span className="text-xs font-medium text-muted">
                {memberProfile?.internshipRole || user?.position || 'SDE Intern'}
              </span>
              {memberProfile?.characterClass && (
                <>
                  <span className="text-muted/40">·</span>
                  <span className="text-xs text-muted/80 font-mono">
                    {memberProfile.characterClass}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {user.name}
              </h1>
              <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-paper-dark border border-line text-muted">
                Personal Mission Control
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
              Track your daily engineering tasks, update work logs, and submit completed features for lead review.
            </p>
          </div>

          <button
            onClick={onCreateTask}
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-300 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Mission</span>
          </button>
        </div>
      </div>

      {/* 2. PERFORMANCE METRIC STRIP (4 MODERN ROUNDED CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Missions Card */}
        <div
          onClick={() => setTaskFilter('IN_PROGRESS')}
          className={`p-4 sm:p-5 bg-paper-light border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover group flex flex-col justify-between ${
            taskFilter === 'IN_PROGRESS' ? 'border-blue-500/50 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-line/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Active Missions</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-ink">{activeTasks.length}</span>
            <span className="text-[11px] text-muted font-medium">in progress</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-700/80 font-medium flex items-center gap-1">
            <span>View active</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* In Review Card */}
        <div
          onClick={() => setTaskFilter('REVIEW')}
          className={`p-4 sm:p-5 bg-paper-light border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover group flex flex-col justify-between ${
            taskFilter === 'REVIEW' ? 'border-amber-500/50 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-line/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">In Review</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-amber-700">{reviewTasks.length}</span>
            <span className="text-[11px] text-muted font-medium">waiting lead</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-700/80 font-medium flex items-center gap-1">
            <span>Awaiting signoff</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Approved & Done Card */}
        <div
          onClick={() => setTaskFilter('DONE')}
          className={`p-4 sm:p-5 bg-paper-light border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover group flex flex-col justify-between ${
            taskFilter === 'DONE' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-line/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Approved & Done</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-emerald-700">{completedTasks.length}</span>
            <span className="text-[11px] text-muted font-medium">signed off</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-700/80 font-medium flex items-center gap-1">
            <span>Completed milestones</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Momentum Card */}
        <div
          onClick={() => setTaskFilter('ALL')}
          className={`p-4 sm:p-5 bg-paper-light border rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover group flex flex-col justify-between ${
            taskFilter === 'ALL' ? 'border-purple-500/50 ring-2 ring-purple-500/20 bg-purple-50/20' : 'border-line/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Sprint Momentum</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-purple-700">{momentumPct}%</span>
            <span className="text-[11px] text-muted font-medium">completion rate</span>
          </div>
          <div className="mt-2 w-full bg-paper border border-line rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${momentumPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. NEXT MOVE SPOTLIGHT CARD (Featured Task) */}
      {featuredTask && (
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-paper-light to-white border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
                <Flame className="w-4 h-4 animate-bounce" />
              </span>
              <span className="uppercase tracking-wider">Next Move • Priority Engineering Task</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                TASK-{featuredTask.id}
              </span>
              <StatusBadge type="priority" value={featuredTask.priority} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
              {featuredTask.title}
            </h3>
            {featuredTask.description && (
              <p className="text-xs sm:text-sm text-muted line-clamp-2 leading-relaxed">
                {featuredTask.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted">Task Completion Progress</span>
              <span className="font-bold text-emerald-700">{featuredTask.progressPct}%</span>
            </div>
            <ProgressBar progressPct={featuredTask.progressPct} />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-emerald-500/20">
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted/70" />
                Est: {featuredTask.estHours || 4.0} hrs
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted/70" />
                Due: {featuredTask.deadline || 'Today'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {featuredTask.status === 'TODO' ? (
                <button
                  onClick={() => onStatusChange(featuredTask.id, 'IN_PROGRESS')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Rocket className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Start Task</span>
                </button>
              ) : featuredTask.status === 'IN_PROGRESS' ? (
                <>
                  <button
                    onClick={() => handleOpenUpdateModal(featuredTask)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-paper-light hover:bg-paper border border-line hover:border-primary/50 text-ink text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-muted" />
                    <span>Update Work Log</span>
                  </button>

                  <button
                    onClick={() => onStatusChange(featuredTask.id, 'REVIEW')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for Review</span>
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {featuredTask.status === 'REVIEW' ? 'Waiting for Lead Review' : 'Approved by Lead'}
                </span>
              )}

              <button
                onClick={() => onOpenTask(featuredTask)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-line hover:border-ink/50 bg-paper-light text-ink text-xs font-semibold rounded-xl hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MY ENGINEERING TASKS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                My Engineering Tasks
              </h2>
              <p className="text-xs text-muted">
                Showing {filteredMemberTasks.length} of {memberTasks.length} total assigned items
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {(
              [
                { id: 'ALL', label: 'All Tasks', count: memberTasks.length },
                { id: 'IN_PROGRESS', label: 'In Progress', count: activeTasks.length },
                { id: 'REVIEW', label: 'In Review', count: reviewTasks.length },
                { id: 'DONE', label: 'Approved', count: completedTasks.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTaskFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  taskFilter === tab.id
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'bg-paper-light border border-line text-muted hover:text-ink hover:border-line-dark'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    taskFilter === tab.id ? 'bg-white/20 text-white' : 'bg-paper-dark text-muted font-mono'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredMemberTasks.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-paper-light border border-dashed border-line rounded-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-xs">
              <Rocket className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-display text-base font-bold text-ink">
                {taskFilter === 'ALL'
                  ? 'No tasks assigned yet'
                  : `No tasks found in ${taskFilter.toLowerCase().replace('_', ' ')}`}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {taskFilter === 'ALL'
                  ? 'You are all caught up! Create a new engineering mission to start building, or sync with your team lead.'
                  : 'Switch filter tabs or create a new mission to start working.'}
              </p>
            </div>
            <button
              onClick={onCreateTask}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>Create Your First Mission</span>
            </button>
          </div>
        ) : (
          /* Task Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMemberTasks.map((task) => {
              const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < new Date().toISOString().split('T')[0];
              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTask(task)}
                  className={`p-5 bg-paper-light border rounded-2xl cursor-pointer space-y-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover group flex flex-col justify-between ${
                    isOverdue
                      ? 'border-red-300/80 bg-red-50/10'
                      : task.status === 'REVIEW'
                      ? 'border-amber-300/80 bg-amber-50/10'
                      : 'border-line/80 hover:border-primary/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-bold text-muted bg-paper px-2 py-0.5 rounded-md border border-line">
                          TASK-{task.id}
                        </span>
                        {task.status === 'REVIEW' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300/70 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Waiting Review
                          </span>
                        )}
                        {task.status === 'DONE' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300/70 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                      </div>
                      <StatusBadge type="priority" value={task.priority} />
                    </div>

                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {task.labels && task.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {task.labels.map((l) => (
                          <span
                            key={l}
                            className="text-[10px] font-medium px-2 py-0.5 bg-paper border border-line text-muted rounded-md"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-line/60">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-muted">
                        <span>Progress</span>
                        <span className="font-bold text-ink">{task.progressPct}%</span>
                      </div>
                      <ProgressBar progressPct={task.progressPct} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted/70" />
                        Due: {task.deadline || 'Today'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {task.status === 'TODO' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(task.id, 'IN_PROGRESS');
                            }}
                            className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold rounded-lg shadow-2xs hover:shadow-xs active:scale-95 transition-all"
                          >
                            Start
                          </button>
                        ) : task.status === 'IN_PROGRESS' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUpdateModal(task);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold rounded-lg active:scale-95 transition-all"
                          >
                            Update Log
                          </button>
                        ) : null}

                        <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. WORKFLOW PIPELINE STAGES OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-line pb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-ink">
              Workflow Stages Pipeline
            </h2>
            <p className="text-xs text-muted">
              Click a stage to inspect tasks currently moving through the sprint cycle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stages.map((st) => {
            const isSelected = expandedStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setExpandedStage(isSelected ? null : st.id)}
                className={`p-3.5 sm:p-4 border rounded-2xl text-left transition-all duration-200 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-paper-light border-primary/60 ring-2 ring-primary/20 shadow-xs'
                    : 'bg-paper-light border-line hover:border-line-dark hover:-translate-y-0.5 hover:shadow-2xs'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-ink">{st.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${st.badgeBg}`}>
                    {st.count}
                  </span>
                </div>
                <div className="text-[11px] text-muted">
                  {st.count === 1 ? '1 task' : `${st.count} tasks`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Task Detail View */}
        {expandedStage && (
          <div className="p-5 border border-line bg-paper-light rounded-2xl space-y-3 animate-fade-in shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <span className="font-display text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Stage: {stages.find((s) => s.id === expandedStage)?.label} (
                {memberTasks.filter((t) => t.status === expandedStage).length} Items)
              </span>
              <button
                onClick={() => setExpandedStage(null)}
                className="text-xs text-muted hover:text-ink cursor-pointer"
              >
                Close
              </button>
            </div>

            {memberTasks.filter((t) => t.status === expandedStage).length === 0 ? (
              <p className="text-muted text-xs italic py-2">
                No tasks currently in this stage.
              </p>
            ) : (
              <div className="divide-y divide-line/60">
                {memberTasks
                  .filter((t) => t.status === expandedStage)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTask(t)}
                      className="py-3 flex items-center justify-between hover:bg-paper cursor-pointer px-3 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="font-mono text-xs font-bold text-muted bg-paper px-2 py-0.5 rounded-md border border-line">
                          TASK-{t.id}
                        </span>
                        <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors truncate">
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(t.id, 'REVIEW');
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                          >
                            Submit Review
                          </button>
                        )}
                        <span className="text-xs font-bold text-emerald-700">{t.progressPct}%</span>
                        <ChevronRight className="w-4 h-4 text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. RECENT WINS & MOMENTUM SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 sm:p-6 bg-paper-light border border-line rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-line">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold text-ink">
              Approved & Completed Missions
            </h3>
          </div>

          {completedTasks.length === 0 ? (
            <div className="p-6 text-center text-muted text-xs space-y-2">
              <p>No completed missions yet this cycle.</p>
              <p className="text-[11px]">Finish your active tasks and submit them for lead approval!</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {completedTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  onClick={() => onOpenTask(t)}
                  className="flex items-center space-x-2.5 p-2.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-900 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-mono font-bold text-[11px] shrink-0">TASK-{t.id}</span>
                  <span className="truncate font-medium">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 bg-paper-light border border-line rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center space-x-2.5 pb-2 border-b border-line">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold text-ink">
              Engineering Velocity
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 bg-paper rounded-xl border border-line">
              <span className="font-display text-2xl font-black text-ink block">{completedTasks.length}</span>
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Missions Done</span>
            </div>

            <div className="p-4 bg-paper rounded-xl border border-line">
              <span className="font-display text-2xl font-black text-emerald-700 block">{momentumPct}%</span>
              <span className="text-[11px] font-medium text-muted uppercase tracking-wider">Completion Rate</span>
            </div>
          </div>

          <p className="text-xs text-muted text-center leading-relaxed">
            Great progress! Keep logging updates daily to maintain your sprint momentum and assist the team in velocity calculations.
          </p>
        </div>
      </div>

      {/* MEMBER PROGRESS & WORK LOG MODAL */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-paper-light border border-line w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">Update Work Log & Progress</h3>
                  <span className="text-xs text-muted font-mono">TASK-{updatingTask.id}</span>
                </div>
              </div>
              <button
                onClick={() => setUpdatingTask(null)}
                className="p-1.5 text-muted hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-paper rounded-xl border border-line space-y-1">
                <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Target Task</span>
                <span className="font-semibold text-ink text-sm">{updatingTask.title}</span>
              </div>

              {/* Progress percentage slider & preset chips */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-ink">Current Completion</span>
                  <span className="font-display text-sm font-bold text-emerald-700">{progressPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-2 bg-paper rounded-lg"
                />
                <div className="flex items-center gap-1.5 pt-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setProgressPct(pct)}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        progressPct === pct
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-paper border-line text-muted hover:text-ink'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">What I completed today</label>
                <textarea
                  rows={2}
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="e.g. Created database schema, implemented JPA repository layer..."
                  className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">Currently working on</label>
                <input
                  type="text"
                  value={workingOn}
                  onChange={(e) => setWorkingOn(e.target.value)}
                  placeholder="e.g. REST Controller endpoints & JWT validation"
                  className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">Blocker / Help needed (Optional)</label>
                <input
                  type="text"
                  value={blockerNote}
                  onChange={(e) => setBlockerNote(e.target.value)}
                  placeholder="Explain any issue blocking progress..."
                  className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
                />
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(false)}
                  className="px-4 py-2 border border-line hover:border-line-dark bg-paper text-ink font-semibold rounded-xl hover:shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  Save Progress
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
