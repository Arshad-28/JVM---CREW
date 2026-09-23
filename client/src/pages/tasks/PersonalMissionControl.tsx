import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import { CrewMemberProfile } from '../../services/crewService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircle2,
  Plus,
  Target,
  Send,
  X,
  FileCheck,
  Edit3,
  Clock,
  Rocket,
  Flame,
  ChevronRight,
  Calendar,
  LayoutGrid,
  List,
  Sparkles,
  Search,
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
  // View mode: 'BOARD' (Kanban columns) | 'LIST' (Clean list) | 'FOCUS' (Spotlight on current task)
  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST' | 'FOCUS'>('BOARD');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Work Log / Progress Update Modal state
  const [updatingTask, setUpdatingTask] = useState<Task | null>(null);
  const [progressPct, setProgressPct] = useState<number>(50);
  const [workCompleted, setWorkCompleted] = useState<string>('');
  const [workingOn, setWorkingOn] = useState<string>('');
  const [blockerNote, setBlockerNote] = useState<string>('');

  // Filter tasks belonging to current logged-in member
  const memberTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user.id);
  }, [tasks, user.id]);

  // Performance metrics
  const todoTasks = useMemo(() => memberTasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG'), [memberTasks]);
  const inProgressTasks = useMemo(() => memberTasks.filter((t) => t.status === 'IN_PROGRESS'), [memberTasks]);
  const reviewTasks = useMemo(() => memberTasks.filter((t) => t.status === 'REVIEW'), [memberTasks]);
  const completedTasks = useMemo(() => memberTasks.filter((t) => t.status === 'DONE'), [memberTasks]);

  const totalCount = memberTasks.length;
  const momentumPct = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  // Next move / Top priority task
  const featuredTask = inProgressTasks[0] || todoTasks[0] || memberTasks[0] || null;

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return memberTasks.filter((t) => {
      // Status filter
      if (statusFilter === 'TODO' && t.status !== 'TODO' && t.status !== 'BACKLOG') return false;
      if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'REVIEW' && t.status !== 'REVIEW') return false;
      if (statusFilter === 'DONE' && t.status !== 'DONE') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchTag = t.labels?.some((l) => l.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }

      return true;
    });
  }, [memberTasks, statusFilter, searchQuery]);

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
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* 1. HERO HEADER: CLEAN, INSPIRING & MODERN */}
      <div className="relative overflow-hidden bg-gradient-to-br from-paper-light via-surface to-paper border border-line/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        {/* Subtle radial ambient highlight */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {memberProfile?.serialNumber || user?.serialNumber || 'CREW MEMBER'}
              </span>
              <span className="text-muted/40">·</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-paper border border-line text-muted">
                {memberProfile?.internshipRole || user?.position || 'Software Engineering Intern'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {user.name}’s Mission Control
              </h1>
              <span className="text-xs font-semibold text-muted bg-paper-dark/60 px-2 py-0.5 rounded-full">
                {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
              Track your daily engineering deliverables, submit completed work for lead review, and keep momentum high.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onCreateTask}
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-300 group-hover:rotate-90 transition-transform duration-200" />
              <span>Create Mission</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE METRIC STRIP (Attractive Clickable Filter Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* All Missions */}
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
            statusFilter === 'ALL'
              ? 'bg-paper-light border-primary ring-2 ring-primary/20 shadow-xs'
              : 'bg-paper-light/90 border-line hover:border-line-dark hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-ink transition-colors">
              All Missions
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              statusFilter === 'ALL' ? 'bg-primary text-white' : 'bg-paper border border-line text-primary'
            }`}>
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-ink">{totalCount}</span>
            <span className="text-xs text-muted font-medium">total assigned</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-amber-500/5 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-paper-light/90 border-line hover:border-line-dark hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-amber-800 transition-colors">
              In Progress
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              statusFilter === 'IN_PROGRESS' ? 'bg-amber-600 text-white' : 'bg-paper border border-line text-amber-600'
            }`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-amber-600">{inProgressTasks.length}</span>
            <span className="text-xs text-muted font-medium">active sprint</span>
          </div>
        </button>

        {/* In Review */}
        <button
          onClick={() => setStatusFilter('REVIEW')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
            statusFilter === 'REVIEW'
              ? 'bg-purple-500/5 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'bg-paper-light/90 border-line hover:border-line-dark hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-purple-800 transition-colors">
              In Review
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              statusFilter === 'REVIEW' ? 'bg-purple-600 text-white' : 'bg-paper border border-line text-purple-600'
            }`}>
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-purple-600">{reviewTasks.length}</span>
            <span className="text-xs text-muted font-medium">with lead</span>
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => setStatusFilter('DONE')}
          className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
            statusFilter === 'DONE'
              ? 'bg-emerald-500/5 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-paper-light/90 border-line hover:border-line-dark hover:shadow-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-emerald-800 transition-colors">
              Completed
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              statusFilter === 'DONE' ? 'bg-emerald-600 text-white' : 'bg-paper border border-line text-emerald-600'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-black text-emerald-600">{completedTasks.length}</span>
            <span className="text-xs text-muted font-medium font-mono">{momentumPct}% rate</span>
          </div>
        </button>
      </div>

      {/* 3. TOOLBAR: SEARCH, VIEW SWITCHER & FILTER BADGES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper-light border border-line p-3 rounded-2xl shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by mission title, description, or tag..."
            className="w-full pl-9 pr-8 py-2 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented View Switcher */}
        <div className="flex items-center gap-1 bg-paper border border-line p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('BOARD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'BOARD'
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
            title="Kanban Board View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
            title="Clean List View"
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => setViewMode('FOCUS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'FOCUS'
                ? 'bg-primary text-white shadow-xs font-bold'
                : 'text-muted hover:text-ink'
            }`}
            title="Focus Spotlight View"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Focus Mode</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE CONTENT */}

      {/* VIEW A: BOARD VIEW (Modern, calm, 4 columns) */}
      {viewMode === 'BOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {/* Column 1: To Do / Backlog */}
          <div className="bg-paper-light/70 border border-line rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">To Do</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {todoTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted space-y-1">
                  <p className="font-medium text-ink/70">No pending missions</p>
                  <p className="text-[11px]">All assigned tasks have been started.</p>
                </div>
              ) : (
                todoTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onStatusChange={onStatusChange}
                    onOpenUpdateModal={handleOpenUpdateModal}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-paper-light/70 border border-line rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">In Progress</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted space-y-1">
                  <p className="font-medium text-ink/70">No active work in progress</p>
                  <p className="text-[11px]">Click 'Start' on a To Do task to begin.</p>
                </div>
              ) : (
                inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onStatusChange={onStatusChange}
                    onOpenUpdateModal={handleOpenUpdateModal}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: In Review */}
          <div className="bg-paper-light/70 border border-line rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">In Review</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                {reviewTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {reviewTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted space-y-1">
                  <p className="font-medium text-ink/70">No tasks in review</p>
                  <p className="text-[11px]">Submit completed missions for approval.</p>
                </div>
              ) : (
                reviewTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onStatusChange={onStatusChange}
                    onOpenUpdateModal={handleOpenUpdateModal}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div className="bg-paper-light/70 border border-line rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">Done</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted space-y-1">
                  <p className="font-medium text-ink/70">No completed tasks yet</p>
                  <p className="text-[11px]">Lead-approved missions will appear here.</p>
                </div>
              ) : (
                completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onStatusChange={onStatusChange}
                    onOpenUpdateModal={handleOpenUpdateModal}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: CLEAN LIST VIEW */}
      {viewMode === 'LIST' && (
        <div className="bg-paper-light border border-line rounded-2xl overflow-hidden shadow-xs divide-y divide-line">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-muted text-xs space-y-2">
              <Rocket className="w-8 h-8 mx-auto text-muted/60" />
              <p className="font-bold text-ink text-sm">No missions match your filters</p>
              <p>Try clearing your search query or selecting a different status filter.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTask(task)}
                className="p-4 hover:bg-paper cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-muted bg-paper px-2 py-0.5 rounded border border-line">
                      TASK-{task.id}
                    </span>
                    <StatusBadge type="status" value={task.status} />
                    <StatusBadge type="priority" value={task.priority} />
                    {task.deadline && (
                      <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-muted/70" />
                        {task.deadline}
                      </span>
                    )}
                  </div>
                  <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors truncate">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-muted line-clamp-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-muted">
                      <span>Progress</span>
                      <span>{task.progressPct || 0}%</span>
                    </div>
                    <ProgressBar progressPct={task.progressPct || 0} />
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status === 'TODO' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(task.id, 'IN_PROGRESS');
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        Start
                      </button>
                    ) : task.status === 'IN_PROGRESS' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenUpdateModal(task);
                          }}
                          className="px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line text-xs font-medium rounded-xl text-ink active:scale-95 transition-all cursor-pointer"
                        >
                          Log
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id, 'REVIEW');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          Review
                        </button>
                      </>
                    ) : null}

                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW C: FOCUS SPOTLIGHT VIEW */}
      {viewMode === 'FOCUS' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {featuredTask ? (
            <div className="bg-paper-light border-2 border-primary/20 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Sprint Focus Mission
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-muted bg-paper px-2 py-0.5 rounded border border-line">
                    TASK-{featuredTask.id}
                  </span>
                  <StatusBadge type="priority" value={featuredTask.priority} />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
                  {featuredTask.title}
                </h2>
                {featuredTask.description && (
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    {featuredTask.description}
                  </p>
                )}
              </div>

              <div className="p-4 bg-paper rounded-xl border border-line space-y-2">
                <div className="flex justify-between text-xs font-semibold text-ink">
                  <span>Sprint Completion</span>
                  <span className="text-primary font-bold">{featuredTask.progressPct || 0}%</span>
                </div>
                <ProgressBar progressPct={featuredTask.progressPct || 0} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-line">
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-4 h-4 text-muted/70" />
                    Est: {featuredTask.estHours || 4.0}h
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-4 h-4 text-muted/70" />
                    Due: {featuredTask.deadline || 'Today'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {featuredTask.status === 'TODO' ? (
                    <button
                      onClick={() => onStatusChange(featuredTask.id, 'IN_PROGRESS')}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Start Working</span>
                    </button>
                  ) : featuredTask.status === 'IN_PROGRESS' ? (
                    <>
                      <button
                        onClick={() => handleOpenUpdateModal(featuredTask)}
                        className="px-4 py-2 bg-paper hover:bg-paper-dark border border-line text-ink text-xs font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted" />
                        <span>Update Progress</span>
                      </button>
                      <button
                        onClick={() => onStatusChange(featuredTask.id, 'REVIEW')}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Submit for Lead Review</span>
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {featuredTask.status === 'REVIEW' ? 'Awaiting Lead Approval' : 'Mission Approved'}
                    </span>
                  )}

                  <button
                    onClick={() => onOpenTask(featuredTask)}
                    className="px-4 py-2 border border-line hover:border-ink bg-paper text-ink text-xs font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-paper-light border border-dashed border-line rounded-2xl space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <h3 className="font-display text-base font-bold text-ink">All Missions Clear</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                You have no active pending tasks. Create a new engineering mission to start building.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. WORK LOG & PROGRESS UPDATE MODAL (Re-architected with Modal.tsx) */}
      {updatingTask && (
        <Modal
          isOpen={true}
          onClose={() => setUpdatingTask(null)}
          size="md"
          kicker={`LOG PROGRESS · TASK-${updatingTask.id}`}
          title="Update Work Log & Progress"
          subtitle={updatingTask.title}
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setUpdatingTask(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark/70 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(false)}
                  className="px-4 py-2 border border-line hover:border-line-dark bg-paper text-ink text-xs font-semibold rounded-xl hover:shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  Save Progress
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProgressUpdate(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Progress Slider */}
            <div className="space-y-2 p-3.5 bg-paper rounded-xl border border-line">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-ink">Current Completion</span>
                <span className="font-display text-sm font-bold text-primary">{progressPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPct}
                onChange={(e) => setProgressPct(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-paper-dark rounded-lg"
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
                        : 'bg-paper-light border-line text-muted hover:text-ink'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">What I completed today</label>
              <textarea
                rows={2}
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                placeholder="e.g. Created database schema, implemented JPA repository layer..."
                className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">Currently working on</label>
              <input
                type="text"
                value={workingOn}
                onChange={(e) => setWorkingOn(e.target.value)}
                placeholder="e.g. REST Controller endpoints & JWT validation"
                className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">Blocker / Help needed (Optional)</label>
              <input
                type="text"
                value={blockerNote}
                onChange={(e) => setBlockerNote(e.target.value)}
                placeholder="Explain any issue blocking progress..."
                className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl outline-none text-xs text-ink placeholder:text-muted/60 transition-all font-sans"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Reusable clean Task Card for Board View
interface TaskCardProps {
  task: Task;
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onOpenUpdateModal: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenTask,
  onStatusChange,
  onOpenUpdateModal,
}) => {
  const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < new Date().toISOString().split('T')[0];

  return (
    <div
      onClick={() => onOpenTask(task)}
      className={`p-4 bg-paper-light border rounded-2xl cursor-pointer space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card group flex flex-col justify-between ${
        isOverdue
          ? 'border-red-300 bg-red-50/10'
          : task.status === 'REVIEW'
          ? 'border-purple-300/80 bg-purple-50/10'
          : 'border-line hover:border-primary/50'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] font-bold text-muted bg-paper px-2 py-0.5 rounded-md border border-line">
            TASK-{task.id}
          </span>
          <StatusBadge type="priority" value={task.priority} />
        </div>

        <h4 className="font-display text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.labels.slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[9px] font-semibold px-2 py-0.5 bg-paper border border-line text-muted rounded-md"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2.5 border-t border-line/60">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-muted">
            <span>Progress</span>
            <span className="text-ink font-bold">{task.progressPct || 0}%</span>
          </div>
          <ProgressBar progressPct={task.progressPct || 0} />
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          {task.deadline && (
            <span className="text-[10px] text-muted flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-muted/70" />
              {task.deadline}
            </span>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {task.status === 'TODO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'IN_PROGRESS');
                }}
                className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                Start
              </button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenUpdateModal(task);
                  }}
                  className="px-2 py-1 bg-paper hover:bg-paper-dark border border-line text-[10px] font-medium rounded-lg text-ink active:scale-95 transition-all cursor-pointer"
                >
                  Log
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, 'REVIEW');
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  Review
                </button>
              </>
            )}

            <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
};
