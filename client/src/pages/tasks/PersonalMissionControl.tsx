import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import { CrewMemberProfile } from '../../services/crewService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
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
      {/* 1. CLEAN MODERN HEADER BAR */}
      <div className="bg-paper-light border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {memberProfile?.serialNumber || user?.serialNumber || 'CREW MEMBER'}
            </span>
            <span className="text-muted/40">·</span>
            <span className="text-xs font-medium text-muted">
              {memberProfile?.internshipRole || user?.position || 'SDE Intern'}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              {user.name}’s Missions
            </h1>
            <span className="text-xs font-semibold text-muted">
              ({totalCount} {totalCount === 1 ? 'task' : 'tasks'} assigned)
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Manage your daily tasks, submit work for lead review, and track your sprint velocity.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCreateTask}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-300" />
            <span>New Mission</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT INTERACTIVE METRIC STRIP (Non-Messy Filter Pills) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* All Tasks */}
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-primary/5 border-primary ring-2 ring-primary/20 text-primary'
              : 'bg-paper-light border-line hover:border-line-dark'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">All Missions</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black text-ink">{totalCount}</span>
            <span className="text-[11px] text-muted font-medium">total</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 text-amber-700'
              : 'bg-paper-light border-line hover:border-line-dark'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">In Progress</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black text-amber-600">{inProgressTasks.length}</span>
            <span className="text-[11px] text-muted font-medium">active now</span>
          </div>
        </button>

        {/* In Review */}
        <button
          onClick={() => setStatusFilter('REVIEW')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'REVIEW'
              ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/20 text-purple-700'
              : 'bg-paper-light border-line hover:border-line-dark'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">In Review</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black text-purple-600">{reviewTasks.length}</span>
            <span className="text-[11px] text-muted font-medium">awaiting lead</span>
          </div>
        </button>

        {/* Completed */}
        <button
          onClick={() => setStatusFilter('DONE')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'DONE'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700'
              : 'bg-paper-light border-line hover:border-line-dark'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black text-emerald-600">{completedTasks.length}</span>
            <span className="text-[11px] text-muted font-medium font-mono">{momentumPct}% done</span>
          </div>
        </button>
      </div>

      {/* 3. TOOLBAR (Search, View Toggle, Filter Tag) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-paper-light border border-line p-2.5 rounded-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mission title or tag..."
            className="w-full pl-9 pr-3 py-1.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs outline-none text-ink placeholder:text-muted/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented View Switcher */}
        <div className="flex items-center gap-1 bg-paper border border-line p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('BOARD')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'BOARD'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Kanban Board View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Clean List View"
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => setViewMode('FOCUS')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'FOCUS'
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
            title="Focus Spotlight View"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA BASED ON VIEW MODE */}

      {/* VIEW A: BOARD VIEW (Clean 4-column modern Kanban) */}
      {viewMode === 'BOARD' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {/* Column 1: To Do / Assigned */}
          <div className="bg-paper-light/60 border border-line rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">To Do</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {todoTasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted italic">No tasks to do.</p>
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
          <div className="bg-paper-light/60 border border-line rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">In Progress</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted italic">No active missions.</p>
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
          <div className="bg-paper-light/60 border border-line rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">In Review</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                {reviewTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {reviewTasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted italic">No tasks in review.</p>
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
          <div className="bg-paper-light/60 border border-line rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="font-display text-xs font-bold text-ink uppercase tracking-wider">Done</h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted italic">No completed tasks yet.</p>
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
            <div className="p-10 text-center text-muted text-xs space-y-2">
              <Rocket className="w-8 h-8 mx-auto text-muted/60" />
              <p className="font-semibold text-ink">No tasks match your criteria.</p>
              <p>Adjust your search or filter pills above.</p>
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
                        className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-2xs active:scale-95 transition-all"
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
                          className="px-2.5 py-1.5 bg-paper hover:bg-paper-dark border border-line text-xs font-medium rounded-lg text-ink active:scale-95 transition-all"
                        >
                          Log
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(task.id, 'REVIEW');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs active:scale-95 transition-all"
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
            <div className="bg-paper-light border-2 border-primary/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Current Focus Mission
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
                  <p className="text-sm text-muted leading-relaxed">
                    {featuredTask.description}
                  </p>
                )}
              </div>

              <div className="p-4 bg-paper rounded-xl border border-line space-y-2">
                <div className="flex justify-between text-xs font-semibold text-ink">
                  <span>Completion Status</span>
                  <span className="text-primary font-bold">{featuredTask.progressPct || 0}%</span>
                </div>
                <ProgressBar progressPct={featuredTask.progressPct || 0} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line">
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-4 h-4 text-muted/70" />
                    Est: {featuredTask.estHours || 4.0} hrs
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-4 h-4 text-muted/70" />
                    Due: {featuredTask.deadline || 'Today'}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {featuredTask.status === 'TODO' ? (
                    <button
                      onClick={() => onStatusChange(featuredTask.id, 'IN_PROGRESS')}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Start Working</span>
                    </button>
                  ) : featuredTask.status === 'IN_PROGRESS' ? (
                    <>
                      <button
                        onClick={() => handleOpenUpdateModal(featuredTask)}
                        className="px-3.5 py-2 bg-paper hover:bg-paper-dark border border-line text-ink text-xs font-semibold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted" />
                        <span>Update Log</span>
                      </button>
                      <button
                        onClick={() => onStatusChange(featuredTask.id, 'REVIEW')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Lead Review</span>
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {featuredTask.status === 'REVIEW' ? 'Waiting for Lead Approval' : 'Mission Completed'}
                    </span>
                  )}

                  <button
                    onClick={() => onOpenTask(featuredTask)}
                    className="px-3.5 py-2 border border-line hover:border-ink bg-paper text-ink text-xs font-semibold rounded-xl active:scale-95 transition-all"
                  >
                    Details
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

      {/* MEMBER PROGRESS & WORK LOG MODAL */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-paper border border-line w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
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
                className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-paper-light rounded-xl border border-line space-y-1">
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
      className={`p-4 bg-paper border rounded-xl cursor-pointer space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group flex flex-col justify-between ${
        isOverdue
          ? 'border-red-300 bg-red-50/10'
          : task.status === 'REVIEW'
          ? 'border-purple-300/80 bg-purple-50/10'
          : 'border-line hover:border-primary/50'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] font-bold text-muted bg-paper-dark px-1.5 py-0.5 rounded border border-line">
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
                className="text-[9px] font-medium px-1.5 py-0.2 bg-paper-dark border border-line text-muted rounded"
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-line/60">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-semibold text-muted">
            <span>Progress</span>
            <span className="text-ink">{task.progressPct || 0}%</span>
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

          <div className="flex items-center gap-1 ml-auto">
            {task.status === 'TODO' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, 'IN_PROGRESS');
                }}
                className="px-2.5 py-1 bg-primary hover:bg-primary-hover text-white text-[11px] font-semibold rounded-lg shadow-2xs active:scale-95 transition-all"
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
                  className="px-2 py-1 bg-paper-dark hover:bg-paper border border-line text-[10px] font-medium rounded-lg text-ink active:scale-95 transition-all"
                >
                  Log
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, 'REVIEW');
                  }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded-lg shadow-2xs active:scale-95 transition-all"
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
