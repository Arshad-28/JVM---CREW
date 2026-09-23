import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { mapTeamMemberToCrewProfile, CrewMemberProfile } from '../../services/crewService';
import { Task, TaskComment, TaskHistoryItem, TaskPriority, TaskStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { PageContainer } from '../../components/common/PageContainer';
import { Modal } from '../../components/common/Modal';
import { PersonalMissionControl } from './PersonalMissionControl';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import {
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  Users,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Trash2,
  Layers,
  Target,
  Check,
  X,
} from 'lucide-react';

const COLUMNS: {
  id: TaskStatus | 'BLOCKED';
  title: string;
  dotColor: string;
}[] = [
  { id: 'BACKLOG', title: 'Backlog', dotColor: 'bg-muted' },
  { id: 'TODO', title: 'Assigned', dotColor: 'bg-ink' },
  { id: 'IN_PROGRESS', title: 'In Progress', dotColor: 'bg-attention' },
  { id: 'BLOCKED', title: 'Blocked', dotColor: 'bg-red-500' },
  { id: 'REVIEW', title: 'In Review', dotColor: 'bg-amber-500' },
  { id: 'DONE', title: 'Completed', dotColor: 'bg-emerald-600' },
];

export interface LabelCategory {
  name: string;
  labels: string[];
}

export const LABEL_CATEGORIES: LabelCategory[] = [
  {
    name: 'TASK TYPE',
    labels: ['Development', 'Bug Fix', 'Debugging', 'Practice', 'Research', 'Documentation', 'Code Review'],
  },
  {
    name: 'TECHNOLOGY / TOPIC',
    labels: ['Java', 'Core Java', 'DSA', 'OOP', 'SQL', 'Spring Boot', 'Git', 'Database', 'Frontend', 'Backend'],
  },
  {
    name: 'WORK CATEGORY',
    labels: ['Problem Solving', 'Feature', 'Testing', 'Optimization', 'Learning'],
  },
];

export const KanbanBoardPage: React.FC = () => {
  const { user } = useAuth();
  const cachedTasks = cacheStore.get<Task[]>('tasks_list');
  const cachedTeam = cacheStore.get<any>('my_team');

  const [tasks, setTasks] = useState<Task[]>(() => cachedTasks || []);
  const [crewMembers, setCrewMembers] = useState<CrewMemberProfile[]>(() => {
    if (cachedTeam && cachedTeam.members && cachedTeam.members.length > 0) {
      return cachedTeam.members.map(mapTeamMemberToCrewProfile);
    }
    return [];
  });
  const [, setLoading] = useState(!cachedTasks);

  // Selected task detail state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([]);

  // Modal open states
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('TODO');
  const [createModalAssigneeId, setCreateModalAssigneeId] = useState<number | undefined>(undefined);

  // Filters state
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attentionFilter, setAttentionFilter] = useState<'OVERDUE' | 'REVIEW' | 'BLOCKED' | null>(null);
  const [mobileColumnTab, setMobileColumnTab] = useState<'ALL' | TaskStatus | 'BLOCKED'>('ALL');

  // Task Deletion State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      if (!tasks.length && !cacheStore.get<Task[]>('tasks_list')) {
        setLoading(true);
      }
      const [tasksData, teamData] = await Promise.all([
        api.getTasks(),
        api.getMyTeam().catch(() => null),
      ]);
      setTasks(tasksData);
      if (teamData && teamData.members && teamData.members.length > 0) {
        setCrewMembers(teamData.members.map(mapTeamMemberToCrewProfile));
      } else if (user) {
        setCrewMembers([
          {
            id: user.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'LEAD' ? 'LEAD' : 'MEMBER',
            serialNumber: user.serialNumber || 'CREW-001',
            roleTitle: user.position || 'SDE Intern',
            identityTitle: user.role === 'LEAD' ? 'CURRENT LEAD' : 'MEMBER',
            characterClass: user.role === 'LEAD' ? 'LEADERSHIP' : 'ENGINEERING',
            symbol: user.name ? user.name.charAt(0).toUpperCase() : 'M',
            isCurrentLead: user.role === 'LEAD',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load tasks / team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openTaskDrawer = async (task: Task) => {
    setSelectedTask(task);
    try {
      const [comments, history] = await Promise.all([
        api.getTaskComments(task.id),
        api.getTaskHistory(task.id),
      ]);
      setTaskComments(comments);
      setTaskHistory(history);
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const updated = await api.updateTaskStatus(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
        const history = await api.getTaskHistory(taskId);
        setTaskHistory(history);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleProgressChange = async (taskId: number, progressPct: number) => {
    try {
      const updated = await api.updateTaskStatus(taskId, { progressPct });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
        const history = await api.getTaskHistory(taskId);
        setTaskHistory(history);
      }
    } catch (err) {
      console.error('Failed to update task progress:', err);
    }
  };

  const handleReassignTask = async (taskId: number, newAssigneeId: number) => {
    try {
      const updated = await api.updateTask(taskId, { assigneeId: newAssigneeId });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
        const history = await api.getTaskHistory(taskId);
        setTaskHistory(history);
      }
    } catch (err) {
      console.error('Failed to reassign task:', err);
    }
  };

  const handleRequestRevisions = async (taskId: number, feedback: string) => {
    try {
      await api.addTaskComment(taskId, `[REVISION REQUESTED]: ${feedback}`);
      const updated = await api.updateTaskStatus(taskId, { status: 'IN_PROGRESS' });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
        const [comments, history] = await Promise.all([
          api.getTaskComments(taskId),
          api.getTaskHistory(taskId),
        ]);
        setTaskComments(comments);
        setTaskHistory(history);
      }
    } catch (err) {
      console.error('Failed to request revisions:', err);
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!selectedTask || !comment.trim()) return;
    try {
      await api.addTaskComment(selectedTask.id, comment.trim());
      const comments = await api.getTaskComments(selectedTask.id);
      setTaskComments(comments);
      fetchTasks();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    targetAssigneeIds: number[];
    deadline?: string;
    estHours?: number;
    labels: string[];
  }) => {
    await Promise.all(
      taskData.targetAssigneeIds.map((memberUserId) =>
        api.createTask({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          assigneeId: memberUserId,
          deadline: taskData.deadline,
          estHours: taskData.estHours,
          labels: taskData.labels,
        })
      )
    );
    fetchTasks();
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setIsDeletingTask(true);
      setDeleteError(null);
      await api.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
      setTaskToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const openCreateForColumn = (colId: TaskStatus) => {
    setCreateModalStatus(colId);
    setCreateModalAssigneeId(undefined);
    setIsCreatingTask(true);
  };

  // Metrics Calculations
  const isLead = user?.role === 'LEAD' || user?.role === 'ADMIN';
  const memberProfile = crewMembers.find((m) => m.userId === user?.id) || null;
  const memberAccounts = crewMembers.filter((m) => m.role !== 'LEAD');

  const todayStr = new Date().toISOString().substring(0, 10);
  const totalActiveCount = tasks.filter((t) => t.status !== 'DONE').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW');
  const reviewCount = reviewTasks.length;
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const blockedTasks = tasks.filter((t) => t.labels?.includes('BLOCKED'));
  const blockedCount = blockedTasks.length;

  const overdueTasks = tasks.filter(
    (t) => t.status !== 'DONE' && t.deadline && t.deadline < todayStr
  );

  const overallTeamPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filtered Tasks for Board
  const filteredTasks = tasks.filter((task) => {
    if (assigneeFilter !== 'ALL' && task.assigneeId !== Number(assigneeFilter)) return false;
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (attentionFilter === 'OVERDUE') {
      const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < todayStr;
      if (!isOverdue) return false;
    }
    if (attentionFilter === 'REVIEW' && task.status !== 'REVIEW') return false;
    if (attentionFilter === 'BLOCKED' && !task.labels?.includes('BLOCKED')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchAssignee = task.assigneeName?.toLowerCase().includes(q);
      const matchLabel = task.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchAssignee && !matchLabel) return false;
    }
    return true;
  });

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const idx = order.indexOf(current);
    return idx < order.length - 1 ? order[idx + 1] : null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    const order: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const idx = order.indexOf(current);
    return idx > 0 ? order[idx - 1] : null;
  };

  return (
    <PageContainer width="wide" className="space-y-6">
      {/* CONDITION A: MEMBER ROLE -> PERSONAL MISSION CONTROL */}
      {!isLead ? (
        <PersonalMissionControl
          user={user}
          memberProfile={memberProfile}
          tasks={tasks}
          onOpenTask={openTaskDrawer}
          onStatusChange={handleStatusChange}
          onCreateTask={() => {
            setCreateModalStatus('TODO');
            setCreateModalAssigneeId(user?.id);
            setIsCreatingTask(true);
          }}
        />
      ) : (
        /* CONDITION B: LEAD ROLE -> REFINED CREW COMMAND CENTER */
        <div className="space-y-6 animate-fade-in font-sans">
          {/* 1. STREAMLINED EXECUTIVE LEAD COMMAND HEADER */}
          <div className="relative overflow-hidden bg-gradient-to-br from-paper-light via-surface to-paper border border-line/90 rounded-2xl p-6 sm:p-7 shadow-xs">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-900 border border-amber-500/20">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    CREW SPRINT COMMAND
                  </span>
                  <span className="text-muted/40">·</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-paper border border-line text-muted">
                    {user?.serialNumber || 'LEAD'}
                  </span>
                  <span className="text-muted/40">·</span>
                  <span className="text-xs text-muted font-medium">Sprint Leader</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                    Task Command Center
                  </h1>
                  <span className="text-xs font-semibold text-muted bg-paper-dark/60 px-2 py-0.5 rounded-full">
                    {tasks.length} missions
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                  Orchestrate crew velocity, manage member workloads, and review completed deliverables.
                </p>
              </div>

              {/* Header Right: Stats pill & CTA */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-paper border border-line rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Engineers</span>
                    <span className="font-display text-sm font-bold text-ink">{memberAccounts.length} Active</span>
                  </div>
                  <div className="w-px h-6 bg-line" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted block">Sprint Progress</span>
                    <span className="font-display text-sm font-bold text-emerald-700">{overallTeamPct}%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCreateModalStatus('TODO');
                    setCreateModalAssigneeId(memberAccounts[0]?.userId);
                    setIsCreatingTask(true);
                  }}
                  className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-200 group-hover:rotate-90 transition-transform duration-200" />
                  <span>Assign New Task</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. CLICKABLE EXECUTIVE KPI METRIC STRIP (Instant Board Filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Active Missions */}
            <button
              onClick={() => {
                setAttentionFilter(null);
                setPriorityFilter('ALL');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
                !attentionFilter && priorityFilter === 'ALL'
                  ? 'bg-paper-light border-primary/50 ring-1 ring-primary/20 shadow-xs'
                  : 'bg-paper-light/90 border-line hover:border-line-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Active</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-ink">{totalActiveCount}</span>
              <span className="block text-[10px] text-muted">in flight</span>
            </button>

            {/* In Review */}
            <button
              onClick={() => setAttentionFilter(attentionFilter === 'REVIEW' ? null : 'REVIEW')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
                attentionFilter === 'REVIEW'
                  ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-paper-light/90 border-line hover:border-line-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Review Queue</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-amber-700">{reviewCount}</span>
              <span className="block text-[10px] text-muted">needs signoff</span>
            </button>

            {/* Blocked */}
            <button
              onClick={() => setAttentionFilter(attentionFilter === 'BLOCKED' ? null : 'BLOCKED')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
                attentionFilter === 'BLOCKED'
                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                  : 'bg-paper-light/90 border-line hover:border-line-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Blocked</span>
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-red-700">{blockedCount}</span>
              <span className="block text-[10px] text-muted">needs help</span>
            </button>

            {/* Overdue */}
            <button
              onClick={() => setAttentionFilter(attentionFilter === 'OVERDUE' ? null : 'OVERDUE')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group ${
                attentionFilter === 'OVERDUE'
                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                  : 'bg-paper-light/90 border-line hover:border-line-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-red-800 tracking-wider">Overdue</span>
                <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-red-700">{overdueTasks.length}</span>
              <span className="block text-[10px] text-muted">past deadline</span>
            </button>

            {/* Completed */}
            <button
              onClick={() => {
                setAttentionFilter(null);
                setPriorityFilter('ALL');
                setMobileColumnTab('DONE');
              }}
              className="p-3.5 rounded-2xl border bg-paper-light/90 border-line hover:border-line-dark text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Completed</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-emerald-700">{completedCount}</span>
              <span className="block text-[10px] text-muted">signed off</span>
            </button>

            {/* Total */}
            <button
              onClick={() => {
                setAttentionFilter(null);
                setPriorityFilter('ALL');
                setAssigneeFilter('ALL');
                setMobileColumnTab('ALL');
                setSearchQuery('');
              }}
              className="p-3.5 rounded-2xl border bg-paper-light/90 border-line hover:border-line-dark text-left transition-all duration-200 cursor-pointer hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Total</span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="font-display text-xl sm:text-2xl font-black text-ink">{tasks.length}</span>
              <span className="block text-[10px] text-muted">all missions</span>
            </button>
          </div>

          {/* 3. REVIEW QUEUE HERO BANNER (Shown when reviewCount > 0) */}
          {reviewCount > 0 && (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-paper-light to-amber-500/5 border border-amber-500/30 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span>Review Queue · {reviewCount} Submissions Awaiting Sign-off</span>
                </div>
                <span className="text-xs text-amber-800 font-semibold">1-Click Sign-off</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
                {reviewTasks.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-3.5 bg-paper border border-amber-300/80 rounded-xl space-y-2.5 shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-[10px] font-bold text-muted bg-paper-dark px-1.5 py-0.5 rounded border border-line">
                          TASK-{rt.id}
                        </span>
                        <span className="text-amber-800 font-bold bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                          Needs Review
                        </span>
                      </div>

                      <h4 className="font-display font-bold text-ink truncate text-xs sm:text-sm">
                        {rt.title}
                      </h4>

                      <div className="text-[11px] text-muted flex items-center justify-between">
                        <span>{rt.assigneeName || 'Unassigned'}</span>
                        <span className="font-bold text-emerald-700">{rt.progressPct}% done</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line/60 flex items-center space-x-2 text-xs">
                      <button
                        onClick={() => handleStatusChange(rt.id, 'DONE')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-center shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openTaskDrawer(rt)}
                        className="py-1.5 px-3 border border-line hover:border-line-dark bg-paper text-ink font-semibold rounded-lg active:scale-95 transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. CREW WORKLOAD OVERVIEW (Compact, Elegant Cards) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-bold text-ink">
                  Crew Workload Overview ({memberAccounts.length} Engineers)
                </h2>
              </div>
              <span className="text-xs text-muted">Click an engineer to filter the board</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {memberAccounts.map((cm) => {
                const cmTasks = tasks.filter((t) => t.assigneeId === cm.userId);
                const cmActive = cmTasks.filter((t) => t.status !== 'DONE');
                const cmReview = cmTasks.filter((t) => t.status === 'REVIEW');
                const cmDone = cmTasks.filter((t) => t.status === 'DONE');
                const isSelected = assigneeFilter === String(cm.userId);

                return (
                  <div
                    key={cm.id}
                    onClick={() => setAssigneeFilter(isSelected ? 'ALL' : String(cm.userId))}
                    className={`p-3.5 bg-paper-light border rounded-2xl cursor-pointer space-y-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card group ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs bg-amber-50/10'
                        : 'border-line/80 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-paper border border-line rounded-lg flex items-center justify-center font-bold text-ink text-xs shadow-2xs">
                          {cm.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-ink block font-display text-xs leading-snug truncate max-w-[120px]">
                            {cm.name}
                          </span>
                          <span className="text-[10px] text-muted font-mono">{cm.serialNumber}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        cmReview.length > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : cmActive.length === 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-paper text-ink border-line'
                      }`}>
                        {cmReview.length > 0 ? 'Review' : cmActive.length === 0 ? 'All Done' : 'On Track'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center py-1.5 bg-paper rounded-xl border border-line">
                      <div>
                        <span className="block font-bold text-ink">{cmActive.length}</span>
                        <span className="text-muted">Active</span>
                      </div>
                      <div>
                        <span className="block font-bold text-amber-700">{cmReview.length}</span>
                        <span className="text-muted">Review</span>
                      </div>
                      <div>
                        <span className="block font-bold text-emerald-700">{cmDone.length}</span>
                        <span className="text-muted">Done</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. TOOLBAR: SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-paper-light border border-line rounded-2xl text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setAssigneeFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                  assigneeFilter === 'ALL'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-paper text-muted border-line hover:border-line-dark hover:text-ink'
                }`}
              >
                All Crew ({tasks.length})
              </button>
              {crewMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAssigneeFilter(String(m.userId))}
                  className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                    assigneeFilter === String(m.userId)
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-paper text-muted border-line hover:border-line-dark hover:text-ink'
                  }`}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tasks..."
                  className="pl-8 pr-3 py-1.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs outline-none w-full sm:w-44 font-sans transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {['ALL', 'HIGH', 'MED', 'LOW'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      priorityFilter === p
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-paper text-muted border-line hover:border-line-dark hover:text-ink'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. RESPONSIVE KANBAN COLUMNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3.5 items-start">
            {COLUMNS.filter((col) => mobileColumnTab === 'ALL' || col.id === mobileColumnTab).map((col) => {
              const colTasks = filteredTasks.filter((t) => {
                if (col.id === 'BLOCKED') return t.status === 'IN_PROGRESS' && t.labels?.includes('BLOCKED');
                return t.status === col.id;
              });

              return (
                <div
                  key={col.id}
                  className="bg-paper-light/70 border border-line/80 rounded-2xl flex flex-col min-h-0 md:min-h-[520px] overflow-hidden shadow-2xs"
                >
                  <div className="p-3.5 border-b border-line flex items-center justify-between bg-paper-light">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></span>
                      <span className="font-display font-bold text-xs text-ink uppercase tracking-wider">
                        {col.title}
                      </span>
                      <span className="text-[10px] text-muted font-bold px-1.5 py-0.2 rounded-md bg-paper border border-line">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => openCreateForColumn(col.id as TaskStatus)}
                      className="p-1 text-muted hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer"
                      title="Add Task"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.map((task) => {
                      const nextSt = getNextStatus(task.status);
                      const prevSt = getPrevStatus(task.status);
                      const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < todayStr;

                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskDrawer(task)}
                          className={`p-3.5 bg-paper border rounded-xl cursor-pointer space-y-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card group ${
                            isOverdue ? 'border-red-300 bg-red-50/20' : 'border-line/80 hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-muted font-mono font-bold text-[10px] bg-paper px-1.5 py-0.5 rounded-md border border-line">
                                TASK-{task.id}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                }}
                                className="opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:!opacity-100 p-1 hover:bg-red-50 text-muted hover:text-red-600 rounded-md transition-opacity"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <StatusBadge type="priority" value={task.priority} />
                          </div>

                          <h3 className="text-xs font-semibold text-ink group-hover:text-primary leading-snug line-clamp-2 transition-colors">
                            {task.title}
                          </h3>

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.labels.slice(0, 2).map((l) => (
                                <span
                                  key={l}
                                  className="text-[9px] px-1.5 py-0.5 bg-paper-dark border border-line rounded-md text-muted font-medium"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-medium text-muted">
                              <span>Progress</span>
                              <span className="font-bold text-ink">{task.progressPct}%</span>
                            </div>
                            <ProgressBar progressPct={task.progressPct} />
                          </div>

                          {/* Quick Lead Review Actions if in REVIEW column */}
                          {task.status === 'REVIEW' && (
                            <div className="pt-2 border-t border-line/60 flex items-center space-x-1.5 text-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'DONE');
                                }}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-center shadow-2xs active:scale-95 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTaskDrawer(task);
                                }}
                                className="py-1 px-2.5 border border-line hover:border-line-dark bg-paper text-muted hover:text-ink font-semibold rounded-lg active:scale-95 transition-all cursor-pointer"
                              >
                                Revise
                              </button>
                            </div>
                          )}

                          <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                                {task.assigneeName ? task.assigneeName.charAt(0) : '?'}
                              </div>
                              <span className="truncate max-w-[80px] font-semibold text-ink text-[11px]">
                                {task.assigneeName || 'Unassigned'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              {prevSt && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(task.id, prevSt);
                                  }}
                                  className="p-1 hover:bg-paper border border-line rounded-md transition-colors cursor-pointer"
                                  title="Move back"
                                >
                                  <ArrowLeft className="w-3 h-3 text-muted" />
                                </button>
                              )}
                              {nextSt && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(task.id, nextSt);
                                  }}
                                  className="p-1 hover:bg-amber-500/10 border border-amber-300 rounded-md transition-colors cursor-pointer"
                                  title="Advance status"
                                >
                                  <ArrowRight className="w-3 h-3 text-amber-800" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => openCreateForColumn(col.id as TaskStatus)}
                      className="w-full py-2 border border-dashed border-line hover:border-primary/50 hover:bg-paper/50 rounded-xl text-xs font-semibold text-muted hover:text-primary flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Mission</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. DEDICATED CREATE TASK MODAL */}
      <CreateTaskModal
        isOpen={isCreatingTask}
        onClose={() => setIsCreatingTask(false)}
        crewMembers={crewMembers}
        memberAccounts={memberAccounts}
        initialStatus={createModalStatus}
        initialAssigneeId={createModalAssigneeId}
        onSubmit={handleCreateTask}
      />

      {/* 8. DEDICATED TASK DETAIL MODAL */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isLead={isLead}
        crewMembers={crewMembers}
        taskComments={taskComments}
        taskHistory={taskHistory}
        onStatusChange={handleStatusChange}
        onProgressChange={handleProgressChange}
        onReassignTask={handleReassignTask}
        onRequestRevisions={handleRequestRevisions}
        onAddComment={handleAddComment}
        onDeleteTask={(t) => setTaskToDelete(t)}
      />

      {/* 9. DELETE TASK CONFIRMATION MODAL */}
      <Modal
        isOpen={!!taskToDelete}
        onClose={() => {
          setTaskToDelete(null);
          setDeleteError(null);
        }}
        size="sm"
        kicker="DANGER ZONE"
        title="Delete Task Mission?"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              disabled={isDeletingTask}
              onClick={() => {
                setTaskToDelete(null);
                setDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark/70 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingTask}
              onClick={handleConfirmDeleteTask}
              className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingTask ? 'Deleting...' : 'Delete Mission'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-muted leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-ink font-bold">
              TASK-{taskToDelete?.id}: {taskToDelete?.title}
            </strong>
            ? All discussion notes and audit history will be permanently erased.
          </p>

          {deleteError && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-900 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};
