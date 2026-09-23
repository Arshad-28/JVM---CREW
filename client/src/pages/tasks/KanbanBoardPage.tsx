import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { mapTeamMemberToCrewProfile, CrewMemberProfile } from '../../services/crewService';
import { Task, TaskComment, TaskHistoryItem, TaskPriority, TaskStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import { PageContainer } from '../../components/common/PageContainer';
import { PersonalMissionControl } from './PersonalMissionControl';
import {
  Plus,
  MessageSquare,
  History,
  X,
  Send,
  Search,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle,
  AlertTriangle,
  Tag,
  CheckCircle2,
  RotateCcw,
  FileCheck,
  ShieldAlert,
  ExternalLink,
  Trash2,
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
  { id: 'REVIEW', title: 'Submitted / Review', dotColor: 'bg-amber-500' },
  { id: 'DONE', title: 'Approved / Completed', dotColor: 'bg-emerald-600' },
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

type AssignmentMode = 'INDIVIDUAL' | 'MULTIPLE' | 'ENTIRE_CREW';

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
  const [loading, setLoading] = useState(!cachedTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [attentionFilter, setAttentionFilter] = useState<string | null>(null);
  const [mobileColumnTab, setMobileColumnTab] = useState<'ALL' | TaskStatus | 'BLOCKED'>('ALL');

  // Review Feedback Note state
  const [revisionFeedback, setRevisionFeedback] = useState<string>('');

  // Enhanced Assignment Mode State
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('INDIVIDUAL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MED');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [deadline, setDeadline] = useState('');
  const [estHours, setEstHours] = useState('4.0');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(['Java', 'Core Java']);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState<boolean>(false);

  // Task Deletion State
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setCrewMembers([mapTeamMemberToCrewProfile({
          membershipId: 1,
          userId: user.id,
          name: user.name,
          email: user.email,
          serialNumber: user.serialNumber || 'MEMBER',
          position: user.position || 'SDE Intern',
          role: (user.role === 'ADMIN' ? 'LEAD' : user.role) as 'LEAD' | 'MEMBER',
          isCurrentLead: Boolean(user.isCurrentLead),
          joinedAt: new Date().toISOString(),
          isActive: true,
        })]);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // ESC Key Handler to close centered modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTask) {
        setSelectedTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask]);

  if (!user) return null;

  const isLead = user.role === 'LEAD' || user.role === 'ADMIN';

  // EXPLICIT ROLE SEPARATION: Non-Lead Member Accounts for member workload cards
  const memberAccounts = crewMembers.filter((m) => m.role === 'MEMBER');

  const memberProfile = crewMembers.find((m) => {
    if (m.email.toLowerCase().trim() === user.email.toLowerCase().trim()) return true;
    if (m.userId === user.id) return true;
    if (user.name && m.name.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) return true;
    return false;
  }) || null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center justify-center py-20 text-muted font-mono text-xs animate-pulse">
          Loading engineering tasks...
        </div>
      </div>
    );
  }

  const openTaskDrawer = async (task: Task) => {
    setSelectedTask(task);
    setRevisionFeedback('');
    try {
      const [comments, history] = await Promise.all([
        api.getTaskComments(task.id),
        api.getTaskHistory(task.id),
      ]);
      setTaskComments(comments);
      setTaskHistory(history);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const updated = await api.updateTaskStatus(taskId, {
        status: newStatus,
        progressPct: newStatus === 'DONE' ? 100 : undefined,
      });
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

  const handleRequestRevision = async (taskId: number) => {
    try {
      if (revisionFeedback.trim()) {
        await api.addTaskComment(taskId, `[Lead Review Feedback]: ${revisionFeedback.trim()}`);
      }
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
      setRevisionFeedback('');
    } catch (err) {
      console.error('Failed to request revisions:', err);
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    try {
      await api.addTaskComment(selectedTask.id, newComment.trim());
      setNewComment('');
      const comments = await api.getTaskComments(selectedTask.id);
      setTaskComments(comments);
      fetchTasks();
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    let targetIds: number[] = [];

    if (assignmentMode === 'INDIVIDUAL') {
      if (selectedMemberIds.length === 0) {
        setValidationError('Please select a member to assign this mission.');
        return;
      }
      targetIds = [selectedMemberIds[0]];
    } else if (assignmentMode === 'MULTIPLE') {
      if (selectedMemberIds.length === 0) {
        setValidationError('Please select at least one crew member.');
        return;
      }
      targetIds = selectedMemberIds;
    } else if (assignmentMode === 'ENTIRE_CREW') {
      targetIds = memberAccounts.map((m) => m.userId);
    }

    try {
      // Create an individual task instance for each targeted member
      await Promise.all(
        targetIds.map((memberUserId) =>
          api.createTask({
            title,
            description,
            priority,
            status,
            assigneeId: memberUserId,
            deadline: deadline || undefined,
            estHours: estHours ? parseFloat(estHours) : undefined,
            labels: selectedLabels,
          })
        )
      );

      setIsCreatingTask(false);
      setTitle('');
      setDescription('');
      setSelectedMemberIds([]);
      setSelectedLabels(['Java', 'Core Java']);
      setIsLabelPickerOpen(false);
      setValidationError('');
      fetchTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const openCreateForColumn = (colId: TaskStatus) => {
    setStatus(colId);
    setAssignmentMode('INDIVIDUAL');
    setSelectedMemberIds(memberAccounts[0] ? [memberAccounts[0].userId] : []);
    setSelectedLabels(['Java', 'Core Java']);
    setIsLabelPickerOpen(false);
    setIsCreatingTask(true);
  };

  // Metrics Calculations for Lead Dashboard
  const todayStr = new Date().toISOString().substring(0, 10);
  const totalActiveCount = tasks.filter((t) => t.status !== 'DONE').length;
  const assignedCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter((t) => t.status === 'REVIEW');
  const reviewCount = reviewTasks.length;
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;
  const blockedTasks = tasks.filter((t) => t.labels?.includes('BLOCKED'));
  const blockedCount = blockedTasks.length;

  const overdueTasks = tasks.filter((t) => t.status !== 'DONE' && t.deadline && t.deadline < todayStr);
  const dueSoonTasks = tasks.filter((t) => t.status !== 'DONE' && t.deadline && t.deadline >= todayStr);

  const overallTeamPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Target Assignee calculations for Summary
  let targetMemberNames: string[] = [];
  if (assignmentMode === 'INDIVIDUAL') {
    const m = crewMembers.find((cm) => cm.userId === selectedMemberIds[0]);
    if (m) targetMemberNames = [m.name];
  } else if (assignmentMode === 'MULTIPLE') {
    targetMemberNames = selectedMemberIds
      .map((id) => crewMembers.find((cm) => cm.userId === id)?.name)
      .filter((n): n is string => Boolean(n));
  } else if (assignmentMode === 'ENTIRE_CREW') {
    targetMemberNames = memberAccounts.map((m) => m.name);
  }

  // Filter tasks for Lead view
  const filteredTasks = tasks.filter((t) => {
    if (attentionFilter === 'OVERDUE') {
      if (t.status === 'DONE' || !t.deadline || t.deadline >= todayStr) return false;
    } else if (attentionFilter === 'REVIEW') {
      if (t.status !== 'REVIEW') return false;
    } else if (attentionFilter === 'DUE_SOON') {
      if (t.status === 'DONE' || !t.deadline || t.deadline < todayStr) return false;
    }

    if (assigneeFilter !== 'ALL') {
      if (assigneeFilter === 'ME') {
        if (t.assigneeId !== user?.id) return false;
      } else if (String(t.assigneeId) !== assigneeFilter) {
        return false;
      }
    }
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchLabels = t.labels?.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabels) return false;
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
            setStatus('TODO');
            setAssignmentMode('INDIVIDUAL');
            setSelectedMemberIds([user.id]);
            setSelectedLabels(['Java', 'Core Java']);
            setIsLabelPickerOpen(false);
            setIsCreatingTask(true);
          }}
        />
      ) : (
        /* CONDITION B: LEAD ROLE -> CREW COMMAND CENTER */
        <div className="space-y-6 animate-fade-in font-sans">
          {/* 1. CREW TASK CONTROL (Top Dashboard Banner) */}
          <div className="border border-line bg-paper p-6 rounded-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-900 border border-amber-500/30 px-2 py-0.5 rounded-xs">
                  CREW TASK CONTROL
                </span>
                <span className="font-mono text-xs text-muted font-semibold">{user.serialNumber || 'LEAD'}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-ink uppercase tracking-tight">
                ENGINEERING TASK COMMAND CENTER
              </h1>
              <p className="font-mono text-xs text-muted">
                Team-wide engineering task orchestration, member workload monitoring, and review queue approvals.
              </p>
            </div>

            <button
              onClick={() => {
                setStatus('TODO');
                setAssignmentMode('INDIVIDUAL');
                setSelectedMemberIds(memberAccounts[0] ? [memberAccounts[0].userId] : []);
                setSelectedLabels(['Java', 'Core Java']);
                setIsLabelPickerOpen(false);
                setIsCreatingTask(true);
              }}
              className="px-4 py-2.5 bg-ink text-paper hover:bg-ink/90 rounded-sm font-mono text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 self-start md:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Assign New Task</span>
            </button>
          </div>

          {/* DEDICATED LEAD COMMAND STATUS AREA */}
          <div className="border border-amber-500/40 bg-paper p-5 rounded-sm space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-ink text-paper rounded-xs flex items-center justify-center font-bold font-display text-sm">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-ink font-display text-base">{user.name}</span>
                    <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-xs">
                      LEAD • {user.serialNumber || 'LEAD'}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted font-sans">{user.position || 'SDE Intern'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-paper-dark border border-line rounded-xs text-[11px] font-bold text-ink">
                  ACTIVE MEMBERS: {memberAccounts.length}
                </div>
                <div className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xs text-[11px] font-bold">
                  TEAM PROGRESS: {overallTeamPct}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">ACTIVE TASKS</span>
                <span className="font-display text-lg font-black text-ink">{totalActiveCount}</span>
              </div>

              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">AWAITING REVIEW</span>
                <span className="font-display text-lg font-black text-amber-400">{reviewCount}</span>
              </div>

              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">BLOCKED TASKS</span>
                <span className="font-display text-lg font-black text-red-400">{blockedCount}</span>
              </div>

              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">COMPLETED TODAY</span>
                <span className="font-display text-lg font-black text-emerald-400">{completedCount}</span>
              </div>

              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">OVERDUE</span>
                <span className="font-display text-lg font-black text-red-400">{overdueTasks.length}</span>
              </div>

              <div className="p-2.5 bg-paper-dark/30 border border-line rounded-xs">
                <span className="text-[10px] uppercase font-bold text-muted block">TOTAL CREW TASKS</span>
                <span className="font-display text-lg font-black text-ink">{tasks.length}</span>
              </div>
            </div>
          </div>

          {/* TEAM ACTIVITY / WORKFLOW STAGE SUMMARY STRIP */}
          <div className="p-3 border border-line bg-paper rounded-sm font-mono text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-muted uppercase block">WORKFLOW STAGE DISTRIBUTION</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-paper-dark border border-line rounded-xs font-bold text-ink">ASSIGNED ({assignedCount})</span>
              <span className="text-muted">→</span>
              <span className="px-2.5 py-1 bg-paper-dark border border-line rounded-xs font-bold text-ink">TO DO ({assignedCount})</span>
              <span className="text-muted">→</span>
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xs font-bold">IN PROGRESS ({inProgressCount})</span>
              <span className="text-muted">→</span>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xs font-bold">SUBMITTED ({reviewCount})</span>
              <span className="text-muted">→</span>
              <span className="px-2.5 py-1 bg-amber-500/30 text-amber-400 border border-amber-500/50 rounded-xs font-bold">REVIEW ({reviewCount})</span>
              <span className="text-muted">→</span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xs font-bold">APPROVED / COMPLETED ({completedCount})</span>
            </div>
          </div>

          {/* REVIEW QUEUE (Top Priority Lead Section) */}
          {reviewCount > 0 && (
            <div className="border border-amber-500/40 bg-amber-500/10 p-5 rounded-sm space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase text-xs">
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  <span>REVIEW QUEUE • {reviewCount} TASKS REQUIRE YOUR ATTENTION</span>
                </div>
                <span className="text-[11px] text-amber-400">Review & Approve Submissions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
                {reviewTasks.map((rt) => (
                  <div key={rt.id} className="p-3 bg-paper border border-amber-500/40 rounded-xs space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-ink">TASK-{rt.id}</span>
                      <span className="text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.2 rounded-xs">SUBMITTED</span>
                    </div>
                    <div className="font-bold text-ink truncate text-xs">{rt.title}</div>
                    <div className="text-[11px] text-muted flex items-center justify-between">
                      <span>{rt.assigneeName || 'Unassigned'}</span>
                      <span className="font-bold text-emerald-400">{rt.progressPct}%</span>
                    </div>
                    <div className="pt-2 border-t border-line flex items-center space-x-1.5 text-[10px]">
                      <button
                        onClick={() => handleStatusChange(rt.id, 'DONE')}
                        className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs text-center shadow-xs"
                      >
                        Approve Task
                      </button>
                      <button
                        onClick={() => openTaskDrawer(rt)}
                        className="py-1 px-2.5 border border-line hover:bg-paper-dark text-ink font-bold rounded-xs"
                      >
                        Review Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATTENTION REQUIRED BANNER */}
          {(overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
            <div className="border border-red-500/30 bg-red-500/10 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center space-x-2 text-red-900 font-bold uppercase">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>ATTENTION REQUIRED • OVERDUE & UPCOMING DEADLINES</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {overdueTasks.length > 0 && (
                  <button
                    onClick={() => setAttentionFilter(attentionFilter === 'OVERDUE' ? null : 'OVERDUE')}
                    className={`px-2.5 py-1 rounded-xs border font-bold transition-colors ${
                      attentionFilter === 'OVERDUE'
                        ? 'bg-red-700 text-white border-red-800'
                        : 'bg-paper text-red-900 border-red-500/40 hover:bg-paper-dark'
                    }`}
                  >
                    {overdueTasks.length} OVERDUE
                  </button>
                )}

                {dueSoonTasks.length > 0 && (
                  <button
                    onClick={() => setAttentionFilter(attentionFilter === 'DUE_SOON' ? null : 'DUE_SOON')}
                    className={`px-2.5 py-1 rounded-xs border font-bold transition-colors ${
                      attentionFilter === 'DUE_SOON'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-line hover:bg-paper-dark'
                    }`}
                  >
                    {dueSoonTasks.length} DUE SOON
                  </button>
                )}

                {attentionFilter && (
                  <button
                    onClick={() => setAttentionFilter(null)}
                    className="text-xs text-muted hover:text-ink underline ml-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CREW WORKLOAD OVERVIEW (NON-LEAD MEMBERS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2 font-mono">
              <span className="text-xs font-bold text-ink uppercase">CREW WORKLOAD OVERVIEW • MEMBER CARDS</span>
              <span className="text-[10px] text-muted">{memberAccounts.length} Crew Engineers</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {memberAccounts
                .sort((a, b) => {
                  const aTasks = tasks.filter((t) => t.assigneeId === a.userId);
                  const bTasks = tasks.filter((t) => t.assigneeId === b.userId);
                  const aNeedsAtt = aTasks.some((t) => t.status === 'REVIEW' || (t.deadline && t.deadline < todayStr) || t.labels?.includes('BLOCKED'));
                  const bNeedsAtt = bTasks.some((t) => t.status === 'REVIEW' || (t.deadline && t.deadline < todayStr) || t.labels?.includes('BLOCKED'));
                  if (aNeedsAtt && !bNeedsAtt) return -1;
                  if (!aNeedsAtt && bNeedsAtt) return 1;
                  return 0;
                })
                .map((cm) => {
                  const cmTasks = tasks.filter((t) => t.assigneeId === cm.userId);
                  const cmActive = cmTasks.filter((t) => t.status !== 'DONE');
                  const cmReview = cmTasks.filter((t) => t.status === 'REVIEW');
                  const cmDone = cmTasks.filter((t) => t.status === 'DONE');
                  const cmBlocked = cmTasks.filter((t) => t.labels?.includes('BLOCKED'));
                  const cmOverdue = cmActive.filter((t) => t.deadline && t.deadline < todayStr);

                  const featuredTask = cmActive[0] || cmTasks[0] || null;

                  // Dynamic Member Status Calculation
                  let memberStatus: 'BLOCKED' | 'WAITING FOR REVIEW' | 'OVERDUE' | 'COMPLETED' | 'ON TRACK' = 'ON TRACK';
                  let statusBg = 'bg-paper-dark text-ink border-line';

                  if (cmBlocked.length > 0) {
                    memberStatus = 'BLOCKED';
                    statusBg = 'bg-red-500/10 text-red-400 border-red-500/30';
                  } else if (cmReview.length > 0) {
                    memberStatus = 'WAITING FOR REVIEW';
                    statusBg = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                  } else if (cmOverdue.length > 0) {
                    memberStatus = 'OVERDUE';
                    statusBg = 'bg-red-500/10 text-red-400 border-red-500/30';
                  } else if (cmActive.length === 0 && cmDone.length > 0) {
                    memberStatus = 'COMPLETED';
                    statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  } else {
                    memberStatus = 'ON TRACK';
                    statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  }

                  const needsAttention = memberStatus === 'BLOCKED' || memberStatus === 'WAITING FOR REVIEW' || memberStatus === 'OVERDUE';
                  const isSelected = assigneeFilter === String(cm.userId);

                  return (
                    <div
                      key={cm.id}
                      onClick={() => setAssigneeFilter(isSelected ? 'ALL' : String(cm.userId))}
                      className={`p-4 border rounded-sm cursor-pointer space-y-3 font-mono text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 shadow-md'
                          : 'bg-paper border-line hover:border-ink shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b border-line pb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 bg-paper-dark border border-line rounded-xs flex items-center justify-center font-bold text-ink text-xs">
                            {cm.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-ink block font-display text-sm leading-none">{cm.name}</span>
                            <span className="text-[9px] text-muted">{cm.serialNumber}</span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-xs border ${statusBg}`}>
                          {memberStatus}
                        </span>
                      </div>

                      {/* Needs Attention Badge */}
                      {needsAttention && (
                        <div className="p-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xs flex items-center space-x-1.5 text-amber-400 font-bold text-[10px]">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>NEEDS LEAD ATTENTION</span>
                        </div>
                      )}

                      {/* Current Mission Spotlight */}
                      {featuredTask ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted font-bold">CURRENT MISSION:</span>
                            <span className="font-bold text-amber-400 uppercase text-[9px] bg-paper-dark px-1.5 py-0.2 rounded-xs">
                              {featuredTask.status}
                            </span>
                          </div>

                          <div className="font-semibold text-ink truncate text-xs font-sans">
                            {featuredTask.title}
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-muted">Progress</span>
                              <span className="font-bold text-ink">{featuredTask.progressPct}%</span>
                            </div>
                            <ProgressBar progressPct={featuredTask.progressPct} />
                          </div>

                          <div className="flex justify-between text-[10px] text-muted pt-1">
                            <span>Deadline: {featuredTask.deadline || 'Today'}</span>
                            <span>Est: {featuredTask.estHours || 4.0}h</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted italic text-[11px] py-2 text-center border border-dashed border-line rounded-xs">
                          No active missions assigned.
                        </div>
                      )}

                      {/* Member Metrics Strip */}
                      <div className="grid grid-cols-3 gap-1 text-[10px] text-center py-1.5 bg-paper-dark/30 rounded-xs border border-line">
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

                      {/* Dynamic Action Button */}
                      <div className="pt-1">
                        {memberStatus === 'WAITING FOR REVIEW' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (featuredTask) openTaskDrawer(featuredTask);
                            }}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xs shadow-xs flex items-center justify-center space-x-1"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>REVIEW SUBMISSION</span>
                          </button>
                        ) : memberStatus === 'BLOCKED' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (featuredTask) openTaskDrawer(featuredTask);
                            }}
                            className="w-full py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] rounded-xs shadow-xs flex items-center justify-center space-x-1"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>VIEW BLOCKED TASK</span>
                          </button>
                        ) : memberStatus === 'COMPLETED' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (featuredTask) openTaskDrawer(featuredTask);
                            }}
                            className="w-full py-1.5 bg-paper border border-line hover:border-ink text-ink font-bold text-[11px] rounded-xs flex items-center justify-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>VIEW DETAILS</span>
                          </button>
                        ) : featuredTask ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskDrawer(featuredTask);
                            }}
                            className="w-full py-1.5 bg-ink text-paper hover:bg-ink/90 font-bold text-[11px] rounded-xs shadow-xs flex items-center justify-center space-x-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                            <span>VIEW TASK</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Lead Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 sm:p-4 bg-paper border border-line rounded-sm font-mono text-xs">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-muted font-bold mr-1">MEMBER:</span>
              <button
                onClick={() => setAssigneeFilter('ALL')}
                className={`px-2.5 sm:px-3 py-1 rounded-xs border transition-colors ${
                  assigneeFilter === 'ALL'
                    ? 'bg-primary-soft text-primary border-primary/30 font-bold shadow-2xs'
                    : 'bg-paper text-muted border-line hover:border-ink'
                }`}
              >
                ALL CREW ({tasks.length})
              </button>
              {crewMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAssigneeFilter(String(m.userId))}
                  className={`px-2 py-1 rounded-xs border transition-colors ${
                    assigneeFilter === String(m.userId)
                      ? 'bg-primary-soft text-primary border-primary/30 font-bold shadow-2xs'
                      : 'bg-paper text-muted border-line hover:border-ink'
                  }`}
                >
                  {m.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crew tasks..."
                  className="pl-8 pr-3 py-1.5 bg-paper border border-line focus-ring rounded-sm text-xs outline-none w-full sm:w-48 font-sans"
                />
              </div>

              <div className="flex items-center space-x-1">
                {['ALL', 'HIGH', 'MED', 'LOW'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2 py-1 rounded-xs border text-[10px] transition-colors ${
                      priorityFilter === p
                        ? 'bg-primary-soft text-primary border-primary/30 font-bold shadow-2xs'
                        : 'bg-paper text-muted border-line'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Column Quick Filter Tab Bar (Hidden on desktop md:) */}
          <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-line font-mono text-xs">
            <button
              type="button"
              onClick={() => setMobileColumnTab('ALL')}
              className={`px-3 py-1.5 rounded-xs font-bold whitespace-nowrap transition-colors ${
                mobileColumnTab === 'ALL'
                  ? 'bg-primary-soft text-primary border border-primary/30 shadow-2xs'
                  : 'bg-paper border border-line text-muted hover:text-ink'
              }`}
            >
              All Columns
            </button>
            {COLUMNS.map((c) => {
              const count = filteredTasks.filter((t) => {
                if (c.id === 'BLOCKED') return t.status === 'IN_PROGRESS' && t.labels?.includes('BLOCKED');
                return t.status === c.id;
              }).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setMobileColumnTab(c.id)}
                  className={`px-2.5 py-1.5 rounded-xs font-bold whitespace-nowrap transition-colors flex items-center space-x-1 ${
                    mobileColumnTab === c.id
                      ? 'bg-primary-soft text-primary border border-primary/30 shadow-2xs'
                      : 'bg-paper border border-line text-muted hover:text-ink'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dotColor}`} />
                  <span>{c.title}</span>
                  <span>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Responsive Engineering Kanban Columns for Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3 items-start">
            {COLUMNS.filter((col) => mobileColumnTab === 'ALL' || col.id === mobileColumnTab).map((col) => {
              const colTasks = filteredTasks.filter((t) => {
                if (col.id === 'BLOCKED') return t.status === 'IN_PROGRESS' && t.labels?.includes('BLOCKED');
                return t.status === col.id;
              });

              return (
                <div
                  key={col.id}
                  className="bg-paper-light border border-line rounded-sm flex flex-col min-h-0 md:min-h-[540px]"
                >
                  <div className="p-3 border-b border-line flex items-center justify-between bg-paper">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`}></span>
                      <span className="font-display font-bold text-xs text-ink uppercase">
                        {col.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted font-bold">
                        ({colTasks.length})
                      </span>
                    </div>

                    <button
                      onClick={() => openCreateForColumn(col.id as TaskStatus)}
                      className="p-1 text-muted hover:text-ink hover:bg-paper-dark rounded-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {colTasks.map((task) => {
                      const nextSt = getNextStatus(task.status);
                      const prevSt = getPrevStatus(task.status);
                      const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < todayStr;

                      return (
                        <div
                          key={task.id}
                          onClick={() => openTaskDrawer(task)}
                          className={`p-3 bg-paper border rounded-sm cursor-pointer space-y-2.5 transition-all duration-150 shadow-2xs hover:shadow-xs group ${
                            isOverdue ? 'border-red-400 bg-red-500/5' : 'border-line hover:border-ink'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-muted font-bold">TASK-{task.id}</span>
                              {isLead && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskToDelete(task);
                                  }}
                                  className="opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:!opacity-100 p-0.5 hover:bg-red-500/10 text-muted hover:text-red-600 rounded-xs transition-opacity"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <StatusBadge type="priority" value={task.priority} />
                          </div>

                          <h3 className="text-xs font-semibold text-ink group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors">
                            {task.title}
                          </h3>

                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.labels.slice(0, 2).map((l) => (
                                <span
                                  key={l}
                                  className="font-mono text-[9px] px-1.5 py-0.2 bg-paper-dark border border-line rounded-xs text-muted font-semibold"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-muted">
                              <span>Progress</span>
                              <span>{task.progressPct}%</span>
                            </div>
                            <ProgressBar progressPct={task.progressPct} />
                          </div>

                          {/* Quick Lead Review Actions if in REVIEW column */}
                          {task.status === 'REVIEW' && (
                            <div className="pt-2 border-t border-line flex items-center space-x-1.5 font-mono text-[10px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(task.id, 'DONE');
                                }}
                                className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs text-center"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTaskDrawer(task);
                                }}
                                className="py-1 px-2 border border-line hover:bg-paper-dark text-muted font-bold rounded-xs"
                              >
                                Revise
                              </button>
                            </div>
                          )}

                          <div className="pt-2 border-t border-line flex items-center justify-between text-[10px] font-mono text-muted">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-4 h-4 rounded-xs bg-[#2D5A43] text-paper flex items-center justify-center font-bold text-[9px]">
                                {task.assigneeName ? task.assigneeName.charAt(0) : '?'}
                              </div>
                              <span className="truncate max-w-[70px] font-semibold text-ink">
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
                                  className="p-1 hover:bg-paper-dark border border-line rounded-xs"
                                >
                                  <ArrowLeft className="w-2.5 h-2.5 text-muted" />
                                </button>
                              )}
                              {nextSt && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(task.id, nextSt);
                                  }}
                                  className="p-1 hover:bg-amber-500/10 border border-line rounded-xs"
                                >
                                  <ArrowRight className="w-2.5 h-2.5 text-amber-800" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => openCreateForColumn(col.id as TaskStatus)}
                      className="w-full py-1.5 border border-dashed border-line hover:border-ink hover:bg-paper rounded-sm text-xs font-mono text-muted hover:text-ink flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add item</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LARGE CENTERED TASK DETAILS MODAL OVERLAY */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in font-sans"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-paper border border-line w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] rounded-t-lg sm:rounded-sm shadow-2xl flex flex-col my-auto overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="p-4 border-b border-line bg-paper-dark flex items-center justify-between font-mono text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-ink text-sm font-display">TASK-{selectedTask.id}</span>
                <StatusBadge type="priority" value={selectedTask.priority} />
                <StatusBadge type="status" value={selectedTask.status} />
              </div>
              <div className="flex items-center space-x-2">
                {isLead && (
                  <button
                    onClick={() => setTaskToDelete(selectedTask)}
                    className="p-1 text-muted hover:text-red-600 hover:bg-red-500/10 rounded-sm transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-muted hover:text-ink rounded-sm transition-colors"
                  title="Close Modal (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL TITLE & DESCRIPTION */}
            <div className="p-6 border-b border-line bg-paper space-y-2">
              <h2 className="font-display text-xl font-black text-ink uppercase tracking-tight leading-snug">
                {selectedTask.title}
              </h2>
              <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-sans">
                {selectedTask.description || 'No description provided.'}
              </p>
            </div>

            {/* MODAL BODY (SCROLLABLE CONTENT) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 1. HORIZONTAL WORKFLOW STAGE PIPELINE */}
              <div className="p-4 border border-line bg-paper-dark/30 rounded-sm space-y-2.5 font-mono text-xs">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  TASK WORKFLOW PIPELINE
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2.5 py-1 rounded-xs border font-semibold ${selectedTask.status !== 'BACKLOG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold' : 'bg-paper text-muted border-line'}`}>
                    ✓ ASSIGNED
                  </span>
                  <span className="text-muted font-bold">→</span>
                  <span className={`px-2.5 py-1 rounded-xs border font-semibold ${selectedTask.status === 'TODO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold shadow-2xs' : selectedTask.status !== 'BACKLOG' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-paper text-muted border-line'}`}>
                    {selectedTask.status === 'TODO' ? '→ TO DO' : '✓ TO DO'}
                  </span>
                  <span className="text-muted font-bold">→</span>
                  <span className={`px-2.5 py-1 rounded-xs border font-semibold ${selectedTask.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold shadow-2xs' : selectedTask.status === 'REVIEW' || selectedTask.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-paper text-muted border-line'}`}>
                    {selectedTask.status === 'IN_PROGRESS' ? '→ IN PROGRESS' : selectedTask.status === 'REVIEW' || selectedTask.status === 'DONE' ? '✓ IN PROGRESS' : '○ IN PROGRESS'}
                  </span>
                  <span className="text-muted font-bold">→</span>
                  <span className={`px-2.5 py-1 rounded-xs border font-semibold ${selectedTask.status === 'REVIEW' ? 'bg-amber-500/30 text-amber-400 border-amber-500/50 font-bold animate-pulse shadow-2xs' : selectedTask.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-paper text-muted border-line'}`}>
                    {selectedTask.status === 'REVIEW' ? '→ SUBMITTED / REVIEW' : selectedTask.status === 'DONE' ? '✓ SUBMITTED' : '○ SUBMITTED'}
                  </span>
                  <span className="text-muted font-bold">→</span>
                  <span className={`px-2.5 py-1 rounded-xs border font-semibold ${selectedTask.status === 'DONE' ? 'bg-emerald-700 text-white border-emerald-800 font-bold shadow-xs' : 'bg-paper text-muted border-line'}`}>
                    {selectedTask.status === 'DONE' ? '✓ APPROVED / COMPLETED' : '○ APPROVED'}
                  </span>
                </div>
              </div>

              {/* 2. COMPLETION PROGRESS */}
              <div className="p-4 border border-line rounded-sm bg-paper space-y-2 font-mono text-xs">
                <div className="flex justify-between text-xs items-center">
                  <span className="text-muted font-bold uppercase text-[10px]">COMPLETION</span>
                  <span className="font-bold text-ink text-sm">{selectedTask.progressPct}%</span>
                </div>
                <ProgressBar progressPct={selectedTask.progressPct} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedTask.progressPct}
                  onChange={(e) => handleProgressChange(selectedTask.id, parseInt(e.target.value))}
                  className="w-full accent-accent cursor-pointer mt-1"
                />
              </div>

              {/* 3. TASK INFORMATION 2-COLUMN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* ASSIGNEE & REASSIGNMENT */}
                <div className="p-4 border border-line rounded-sm bg-paper space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted">ASSIGNEE</span>
                    <span className="font-bold text-ink font-sans text-sm">
                      {selectedTask.assigneeName || 'Unassigned'}
                    </span>
                  </div>
                  {isLead && (
                    <div className="pt-2 border-t border-line">
                      <label className="block text-[10px] text-muted font-bold mb-1 uppercase">Reassign Member:</label>
                      <select
                        value={selectedTask.assigneeId || ''}
                        onChange={(e) => {
                          const newId = Number(e.target.value);
                          if (newId) handleReassignTask(selectedTask.id, newId);
                        }}
                        className="w-full px-3 py-1.5 bg-paper-dark border border-line focus:border-ink rounded-xs text-xs font-mono outline-none"
                      >
                        <option value="">Select Assignee...</option>
                        {crewMembers.map((cm) => (
                          <option key={cm.id} value={cm.userId}>
                            {cm.name} ({cm.serialNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* DEADLINE & STATUS */}
                <div className="p-4 border border-line rounded-sm bg-paper space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-muted">DEADLINE</span>
                    <div className="flex items-center space-x-1.5 text-ink font-bold text-xs">
                      <Calendar className="w-3.5 h-3.5 text-muted" />
                      <span>{selectedTask.deadline || 'No deadline set'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex justify-between items-center text-[10px]">
                    <span className="text-muted uppercase font-bold">STATUS INDICATOR:</span>
                    {selectedTask.status !== 'DONE' && selectedTask.deadline && selectedTask.deadline < todayStr ? (
                      <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-xs border border-red-500/30">
                        OVERDUE BY {Math.ceil((new Date(todayStr).getTime() - new Date(selectedTask.deadline).getTime()) / (1000 * 3600 * 24))} DAY(S)
                      </span>
                    ) : selectedTask.deadline === todayStr ? (
                      <span className="font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-xs border border-amber-500/30">
                        DUE TODAY
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-xs">
                        ON TRACK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. PROMINENT LEAD REVIEW AREA */}
              {selectedTask.status === 'REVIEW' && isLead && (
                <div className="p-5 border border-amber-500/40 bg-amber-500/10 rounded-sm space-y-3 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold uppercase">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <span>AWAITING LEAD REVIEW • Review submission before approval</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-muted">
                      Review Feedback Notes (Required for Revisions):
                    </label>
                    <textarea
                      rows={2}
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      placeholder="e.g. Withdrawal validation is missing the insufficient-balance case."
                      className="w-full px-3 py-2 bg-paper border border-line focus:border-ink rounded-xs outline-none font-sans text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-1">
                    <button
                      onClick={() => handleStatusChange(selectedTask.id, 'DONE')}
                      className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ APPROVE TASK</span>
                    </button>

                    <button
                      onClick={() => handleRequestRevision(selectedTask.id)}
                      className="py-2.5 px-4 border border-line hover:bg-paper-dark text-ink font-bold rounded-xs flex items-center space-x-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-muted" />
                      <span>↻ REQUEST CHANGES</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedTask.status === 'DONE' && (
                <div className="p-4 border border-emerald-500/30 bg-emerald-500/10 rounded-xs font-mono text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>APPROVED BY: {user.name} (LEAD)</span>
                  </div>
                  <div className="text-[11px] text-emerald-400">
                    STATUS: TASK COMPLETED & FULLY VERIFIED BY LEAD
                  </div>
                </div>
              )}

              {/* 5. TASK LABELS */}
              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div className="space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] uppercase font-bold text-muted block tracking-wider">LABELS</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTask.labels.map((l) => (
                      <span key={l} className="text-xs px-2.5 py-0.5 bg-paper-dark border border-line rounded-xs text-ink font-semibold">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. DISCUSSION */}
              <div className="space-y-3 pt-4 border-t border-line font-mono text-xs">
                <div className="flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-muted" />
                  <span className="font-display font-bold text-ink uppercase">
                    Discussion ({taskComments.length})
                  </span>
                </div>

                <div className="space-y-2 font-sans">
                  {taskComments.map((c) => (
                    <div key={c.id} className="p-3 bg-paper border border-line rounded-sm space-y-1 font-mono text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-ink">{c.user.name}</span>
                        <span className="text-[10px] text-muted">{c.createdAt.substring(0, 10)}</span>
                      </div>
                      <p className="text-xs text-ink leading-relaxed font-sans">{c.body}</p>
                    </div>
                  ))}

                  {taskComments.length === 0 && (
                    <p className="text-xs font-mono text-muted py-3 text-center border border-dashed border-line rounded-sm">
                      No discussion notes yet.
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex space-x-2 pt-1 font-sans">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-ink text-paper hover:bg-ink/90 rounded-sm text-xs font-mono font-bold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* 7. ACTIVITY HISTORY */}
              <div className="space-y-3 pt-4 border-t border-line font-mono text-xs">
                <div className="flex items-center space-x-1.5">
                  <History className="w-4 h-4 text-muted" />
                  <span className="font-display font-bold text-ink uppercase">Activity Audit History</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {taskHistory.map((h) => (
                    <div key={h.id} className="p-2 border border-line bg-paper-light rounded-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-ink">{h.changedByName}</span>
                        <span className="text-muted"> changed </span>
                        <span className="text-emerald-700 font-bold">{h.fieldChanged}</span>
                        <span className="text-ink"> to {h.newValue}</span>
                      </div>
                      <span className="text-[10px] text-muted">{h.changedAt.substring(11, 16)} UTC</span>
                    </div>
                  ))}

                  {taskHistory.length === 0 && (
                    <div className="p-2 border border-line bg-paper-light rounded-xs text-muted text-[10px]">
                      Task initialized and assigned.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-line bg-paper-dark flex items-center justify-between font-mono text-xs">
              {isLead ? (
                <button
                  type="button"
                  onClick={() => setTaskToDelete(selectedTask)}
                  className="px-3.5 py-1.5 border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-700 font-bold rounded-sm transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete Task</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-paper border border-line hover:border-ink rounded-sm font-bold text-ink transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TASK CONFIRMATION MODAL */}
      {taskToDelete && (
        <div className="fixed inset-0 z-60 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-paper border border-line w-full max-w-md rounded-sm shadow-xl p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-ink">
                  Delete Task?
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Are you sure you want to delete <strong className="text-ink">TASK-{taskToDelete.id}: {taskToDelete.title}</strong>? All comments and audit history will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 border border-red-500/40 bg-red-500/10 text-red-400 rounded-sm font-mono text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-line font-mono text-xs">
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={() => {
                  setTaskToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 bg-paper border border-line hover:border-ink rounded-sm font-bold text-ink transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleConfirmDeleteTask}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm font-bold transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                {isDeletingTask ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgraded 3-Mode Task Creation Modal */}
      {isCreatingTask && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
          <div className="bg-paper border border-line w-full sm:max-w-lg rounded-t-lg sm:rounded-sm shadow-xl p-4 sm:p-6 space-y-4 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h2 className="font-display text-sm font-bold text-ink uppercase">Create Engineering Mission</h2>
              <button onClick={() => setIsCreatingTask(false)} className="p-1 text-muted hover:text-ink rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="p-3 border border-red-500/40 bg-red-500/10 text-red-400 rounded-sm font-mono text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Task Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Implement Custom Thread Pool with Rejection Handler"
                  className="w-full px-3 py-2 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Technical acceptance criteria & Next action notes..."
                  className="w-full px-3 py-2 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none resize-none font-sans"
                />
              </div>

              {/* UPGRADED ASSIGN TO SECTION (3 MODES) */}
              <div className="p-4 border border-line bg-paper-dark/20 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-ink uppercase">ASSIGN TO</span>
                  <span className="font-mono text-[10px] text-muted">
                    {assignmentMode === 'INDIVIDUAL' && 'Single Assignee'}
                    {assignmentMode === 'MULTIPLE' && 'Multi-Select Picker'}
                    {assignmentMode === 'ENTIRE_CREW' && 'Individual Task for Every Active Member'}
                  </span>
                </div>

                {/* 3-Mode Selector Buttons */}
                <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('INDIVIDUAL');
                      setSelectedMemberIds(memberAccounts[0] ? [memberAccounts[0].userId] : []);
                      setValidationError('');
                    }}
                    className={`py-2 px-2 border rounded-xs font-bold transition-all text-center ${
                      assignmentMode === 'INDIVIDUAL'
                        ? 'bg-ink text-paper border-ink shadow-xs'
                        : 'bg-paper text-muted border-line hover:border-ink'
                    }`}
                  >
                    INDIVIDUAL
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('MULTIPLE');
                      setSelectedMemberIds(memberAccounts.slice(0, 2).map((m) => m.userId));
                      setValidationError('');
                    }}
                    className={`py-2 px-2 border rounded-xs font-bold transition-all text-center ${
                      assignmentMode === 'MULTIPLE'
                        ? 'bg-ink text-paper border-ink shadow-xs'
                        : 'bg-paper text-muted border-line hover:border-ink'
                    }`}
                  >
                    MULTIPLE
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentMode('ENTIRE_CREW');
                      setSelectedMemberIds(memberAccounts.map((m) => m.userId));
                      setValidationError('');
                    }}
                    className={`py-2 px-2 border rounded-xs font-bold transition-all text-center ${
                      assignmentMode === 'ENTIRE_CREW'
                        ? 'bg-amber-500 text-paper border-amber-500 shadow-xs'
                        : 'bg-paper text-muted border-line hover:border-ink'
                    }`}
                  >
                    ENTIRE CREW
                  </button>
                </div>

                {/* MODE 1: INDIVIDUAL SELECTOR */}
                {assignmentMode === 'INDIVIDUAL' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-mono text-xs text-muted font-bold">Select Member:</label>
                    <select
                      value={selectedMemberIds[0] || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSelectedMemberIds(val ? [val] : []);
                        setValidationError('');
                      }}
                      className="w-full px-3 py-2 bg-paper border border-line focus:border-ink rounded-sm text-xs font-mono outline-none"
                    >
                      {crewMembers.map((cm) => (
                        <option key={cm.id} value={cm.userId}>
                          {cm.name} · {cm.serialNumber} · {cm.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* MODE 2: MULTIPLE MEMBERS SELECTOR */}
                {assignmentMode === 'MULTIPLE' && (
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <span className="text-muted font-bold block">Select Crew Members:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {crewMembers.map((cm) => {
                        const checked = selectedMemberIds.includes(cm.userId);
                        return (
                          <label
                            key={cm.id}
                            className={`flex items-center space-x-2 p-2 border rounded-xs cursor-pointer transition-colors ${
                              checked ? 'bg-amber-500/10 border-amber-500 text-ink font-bold' : 'bg-paper border-line text-muted'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setValidationError('');
                                if (checked) {
                                  setSelectedMemberIds(selectedMemberIds.filter((id) => id !== cm.userId));
                                } else {
                                  setSelectedMemberIds([...selectedMemberIds, cm.userId]);
                                }
                              }}
                              className="accent-amber-600 rounded-xs"
                            />
                            <span className="truncate">{cm.name.split(' ')[0]} ({cm.serialNumber})</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Selected Chips */}
                    {selectedMemberIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-line">
                        {selectedMemberIds.map((id) => {
                          const cm = crewMembers.find((m) => m.userId === id);
                          if (!cm) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center space-x-1 font-mono text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-900 border border-amber-500/40 rounded-xs font-bold"
                            >
                              <span>{cm.name.split(' ')[0]}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedMemberIds(selectedMemberIds.filter((mId) => mId !== id))}
                                className="hover:text-red-700 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 3: ENTIRE CREW CONFIRMATION */}
                {assignmentMode === 'ENTIRE_CREW' && (
                  <div className="p-4 border border-amber-500/40 bg-amber-500/10 rounded-sm space-y-1 font-mono text-xs">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold uppercase">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>CREW-WIDE INDIVIDUAL TASKS</span>
                    </div>
                    <p className="text-muted text-[11px] font-sans">
                      This task will create an individual task instance for every active crew member so that progress, submission, review, and approval are tracked independently.
                    </p>
                    <div className="text-ink font-bold text-[12px] pt-1">
                      {memberAccounts.length} individual member tasks will be created.
                    </div>
                  </div>
                )}
              </div>

              {/* Task Attributes */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-2.5 py-1.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MED">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Initial Column</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-2 py-1.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Submitted / Review</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Deadline</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-2 py-1.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Est. Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={estHours}
                    onChange={(e) => setEstHours(e.target.value)}
                    placeholder="4.0"
                    className="w-full px-2 py-1.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* ENHANCED CATEGORICAL TASK LABELS SECTION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-ink uppercase tracking-tight">TASK LABELS</label>
                  <span className="font-mono text-[10px] text-muted">{selectedLabels.length} selected</span>
                </div>

                <div className="p-3 border border-line bg-paper rounded-sm space-y-2 font-mono text-xs">
                  {selectedLabels.length === 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted italic text-[11px]">No labels selected</span>
                      <button
                        type="button"
                        onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                        className="px-2.5 py-1 bg-paper-dark border border-line hover:border-ink rounded-xs font-bold text-ink transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3 text-emerald-700" />
                        <span>Add Label</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedLabels.map((lbl) => (
                        <span
                          key={lbl}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 bg-paper-dark border border-line rounded-xs text-ink font-semibold text-[11px]"
                        >
                          <Tag className="w-2.5 h-2.5 text-muted" />
                          <span>{lbl}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedLabels(selectedLabels.filter((l) => l !== lbl))}
                            className="text-muted hover:text-red-700 ml-1 font-bold"
                            title={`Remove ${lbl}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
                        className="px-2.5 py-1 bg-paper-dark border border-line hover:border-ink rounded-xs font-bold text-ink transition-colors flex items-center space-x-1 text-[11px]"
                      >
                        <Plus className="w-3 h-3 text-emerald-700" />
                        <span>Add Label</span>
                      </button>
                    </div>
                  )}

                  {/* Grouped Category Label Selector Popover */}
                  {isLabelPickerOpen && (
                    <div className="pt-3 border-t border-line mt-2 space-y-3 bg-paper-dark/40 p-3 rounded-xs animate-fade-in">
                      <div className="flex items-center justify-between font-bold uppercase text-[10px] text-muted">
                        <span>SELECT ENGINEERING LABELS</span>
                        <button
                          type="button"
                          onClick={() => setIsLabelPickerOpen(false)}
                          className="text-muted hover:text-ink font-bold"
                        >
                          Done
                        </button>
                      </div>

                      {LABEL_CATEGORIES.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase block">
                            {cat.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cat.labels.map((lbl) => {
                              const isSelected = selectedLabels.includes(lbl);
                              return (
                                <button
                                  key={lbl}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedLabels(selectedLabels.filter((l) => l !== lbl));
                                    } else {
                                      setSelectedLabels([...selectedLabels, lbl]);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-xs border text-[10px] font-mono transition-colors ${
                                    isSelected
                                      ? 'bg-ink text-paper border-ink font-bold shadow-2xs'
                                      : 'bg-paper text-ink border-line hover:border-ink'
                                  }`}
                                >
                                  {isSelected ? `✓ ${lbl}` : `+ ${lbl}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* TASK PREVIEW ASSIGNMENT SUMMARY */}
              <div className="p-3.5 border border-line bg-paper-dark/40 rounded-sm font-mono text-xs space-y-1">
                <div className="flex justify-between items-center text-muted font-bold text-[10px] uppercase">
                  <span>ASSIGNMENT SUMMARY</span>
                  <span>{targetMemberNames.length} INDIVIDUAL TASK{targetMemberNames.length === 1 ? '' : 'S'}</span>
                </div>
                <div className="font-bold text-ink truncate">
                  Task: {title || 'Untitled Engineering Mission'}
                </div>
                <div className="text-amber-900 font-bold text-[11px]">
                  Assigned to: {targetMemberNames.length > 0 ? targetMemberNames.join(', ') : 'None selected'}
                </div>
                <div className="text-muted text-[10px] truncate">
                  Labels: {selectedLabels.length > 0 ? selectedLabels.join(' · ') : 'None'}
                </div>
              </div>

              <div className="pt-3 border-t border-line flex justify-end space-x-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setIsCreatingTask(false)}
                  className="px-3 py-1.5 border border-line hover:border-line-dark rounded-sm text-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ink hover:bg-ink/90 text-paper rounded-sm font-bold shadow-xs"
                >
                  Create Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
