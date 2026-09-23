import React, { useState } from 'react';
import { Task, TaskComment, TaskHistoryItem, TaskStatus } from '../../types';
import { CrewMemberProfile } from '../../services/crewService';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ProgressBar } from '../../components/common/ProgressBar';
import {
  Calendar,
  Clock,
  Tag,
  RotateCcw,
  FileCheck,
  Send,
  Trash2,
  MessageSquare,
  History,
  Check,
  Sparkles,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  isLead: boolean;
  crewMembers: CrewMemberProfile[];
  taskComments: TaskComment[];
  taskHistory: TaskHistoryItem[];
  onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  onProgressChange: (taskId: number, progressPct: number) => Promise<void>;
  onReassignTask?: (taskId: number, newAssigneeId: number) => Promise<void>;
  onRequestRevisions?: (taskId: number, feedback: string) => Promise<void>;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteTask?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  isLead,
  crewMembers,
  taskComments,
  taskHistory,
  onStatusChange,
  onProgressChange,
  onReassignTask,
  onRequestRevisions,
  onAddComment,
  onDeleteTask,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'COMMENTS' | 'HISTORY'>('OVERVIEW');
  const [newComment, setNewComment] = useState('');
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRequestingRevisions, setIsRequestingRevisions] = useState(false);

  if (!task) return null;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    try {
      setIsSubmittingComment(true);
      await onAddComment(newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRevisionsSubmit = async () => {
    if (!onRequestRevisions || !revisionFeedback.trim() || isRequestingRevisions) return;
    try {
      setIsRequestingRevisions(true);
      await onRequestRevisions(task.id, revisionFeedback.trim());
      setRevisionFeedback('');
    } finally {
      setIsRequestingRevisions(false);
    }
  };

  const isOverdue = task.status !== 'DONE' && task.deadline && task.deadline < new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      kicker={`MISSION · TASK-${task.id}`}
      title={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="font-display text-lg sm:text-xl font-bold text-ink">
            {task.title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge type="priority" value={task.priority} />
            <StatusBadge type="status" value={task.status} />
          </div>
        </div>
      }
      subtitle={
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
          <span>Assignee: <strong className="text-ink">{task.assigneeName || 'Unassigned'}</strong></span>
          <span>·</span>
          <span>Due: <strong className={isOverdue ? 'text-red-600 font-bold' : 'text-ink'}>{task.deadline || 'No deadline'}</strong></span>
          {isOverdue && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
              OVERDUE
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {isLead && onDeleteTask && (
              <button
                type="button"
                onClick={() => onDeleteTask(task)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Delete this mission"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Task</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Next-Action Buttons */}
            {task.status === 'TODO' && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Start Mission</span>
                <span className="font-mono text-[10px]">→</span>
              </button>
            )}

            {task.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'REVIEW')}
                className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Submit for Review</span>
              </button>
            )}

            {task.status === 'REVIEW' && isLead && (
              <button
                type="button"
                onClick={() => onStatusChange(task.id, 'DONE')}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Complete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-ink bg-paper border border-line hover:border-line-dark hover:bg-paper-dark/70 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-line pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mission Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMMENTS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMMENTS'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted hover:text-ink'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion ({taskComments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted hover:text-ink'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({taskHistory.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
            {/* Description */}
            <div className="p-4 bg-paper-light border border-line rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Technical Acceptance Criteria
              </span>
              <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                {task.description || 'No description provided for this mission.'}
              </p>
            </div>

            {/* Workflow Pipeline Stage Progress */}
            <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                  Sprint Workflow Pipeline
                </span>
                <span className="text-xs font-semibold text-primary">Current: {task.status}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'BACKLOG', label: 'Backlog', order: 0 },
                  { id: 'TODO', label: 'To Do', order: 1 },
                  { id: 'IN_PROGRESS', label: 'In Progress', order: 2 },
                  { id: 'REVIEW', label: 'In Review', order: 3 },
                  { id: 'DONE', label: 'Completed', order: 4 },
                ].map((stage) => {
                  const isCurrent = task.status === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => onStatusChange(task.id, stage.id as TaskStatus)}
                      className={`py-2 px-2 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-primary text-white border-primary shadow-xs font-bold ring-2 ring-primary/20'
                          : 'bg-paper border-line text-muted hover:text-ink hover:border-line-dark'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {isCurrent && <Check className="w-3 h-3" />}
                        <span className="truncate">{stage.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress Slider */}
            <div className="p-4 bg-paper-light border border-line rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Completion Progress</span>
                <span className="font-display font-bold text-primary text-sm">{task.progressPct || 0}%</span>
              </div>
              <ProgressBar progressPct={task.progressPct || 0} />
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={task.progressPct || 0}
                  onChange={(e) => onProgressChange(task.id, parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer h-2 bg-paper-dark rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => onProgressChange(task.id, pct)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                      task.progressPct === pct
                        ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                        : 'bg-paper border-line text-muted hover:text-ink'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Review Feedback Box (when in review and user is lead) */}
            {task.status === 'REVIEW' && isLead && onRequestRevisions && (
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  <span>Request Changes / Revisions</span>
                </div>
                <textarea
                  rows={2}
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Provide constructive feedback or changes required before final sign-off..."
                  className="w-full px-3 py-2 bg-paper border border-amber-300 focus:border-amber-600 rounded-xl text-xs text-ink outline-none resize-none transition-all placeholder:text-muted/60"
                />
                <button
                  type="button"
                  disabled={!revisionFeedback.trim() || isRequestingRevisions}
                  onClick={handleRevisionsSubmit}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isRequestingRevisions ? 'Sending...' : 'Send Revision Request'}
                </button>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Assignee Card */}
              <div className="p-3.5 bg-paper-light border border-line rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Engineer Ownership
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                      {task.assigneeName ? task.assigneeName.charAt(0) : '?'}
                    </div>
                    <span className="font-semibold text-ink">{task.assigneeName || 'Unassigned'}</span>
                  </div>
                </div>

                {isLead && onReassignTask && (
                  <div className="pt-2 border-t border-line/60">
                    <select
                      value={task.assigneeId || ''}
                      onChange={(e) => {
                        const newId = Number(e.target.value);
                        if (newId) onReassignTask(task.id, newId);
                      }}
                      className="w-full px-2.5 py-1.5 bg-paper border border-line focus:border-primary rounded-lg text-[11px] font-medium outline-none text-ink cursor-pointer"
                    >
                      <option value="">Reassign Engineer...</option>
                      {crewMembers.map((cm) => (
                        <option key={cm.id} value={cm.userId}>
                          {cm.name} ({cm.serialNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Deadline & Hours */}
              <div className="p-3.5 bg-paper-light border border-line rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Sprint Timelines
                </span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted/70" /> Deadline:
                    </span>
                    <span className={`font-mono font-semibold ${isOverdue ? 'text-red-600' : 'text-ink'}`}>
                      {task.deadline || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted/70" /> Estimated:
                    </span>
                    <span className="font-mono font-semibold text-ink">
                      {task.estHours ? `${task.estHours}h` : 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Labels / Tags */}
            {task.labels && task.labels.length > 0 && (
              <div className="p-3.5 bg-paper-light border border-line rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                  Technical Tags & Domains
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-primary/70" />
                      <span>{lbl}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMMENTS */}
        {activeTab === 'COMMENTS' && (
          <div className="space-y-4">
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              <label className="block text-xs font-bold text-ink">Leave an Engineering Update / Note</label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share progress, blocker notes, or code links..."
                  className="flex-1 px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs text-ink outline-none resize-none transition-all placeholder:text-muted/60"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl font-semibold shadow-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {taskComments.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted italic">
                  No discussion notes yet. Start the conversation above.
                </p>
              ) : (
                taskComments.map((c) => (
                  <div key={c.id} className="p-3 bg-paper-light border border-line rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-ink">{c.user.name}</span>
                      <span className="text-muted font-mono text-[10px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-ink/90 whitespace-pre-wrap leading-relaxed">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL / HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {taskHistory.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted italic">No state changes recorded yet.</p>
            ) : (
              taskHistory.map((h) => (
                <div key={h.id} className="p-3 bg-paper-light border border-line rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink">
                      Changed <span className="text-primary font-bold">{h.fieldChanged}</span>
                    </span>
                    <div className="text-[11px] text-muted flex items-center gap-1.5">
                      <span className="line-through">{h.oldValue || 'none'}</span>
                      <span>→</span>
                      <span className="font-bold text-ink">{h.newValue || 'none'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted font-mono">
                    {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
