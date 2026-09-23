import React, { useState, useEffect } from 'react';
import { TaskPriority, TaskStatus } from '../../types';
import { CrewMemberProfile } from '../../services/crewService';
import { Modal } from '../../components/common/Modal';
import { LABEL_CATEGORIES } from './KanbanBoardPage';
import {
  AlertCircle,
  Clock,
  Calendar,
  Users,
  User,
  Layers,
  Sparkles,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type AssignmentMode = 'INDIVIDUAL' | 'MULTIPLE' | 'ENTIRE_CREW';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  crewMembers: CrewMemberProfile[];
  memberAccounts: CrewMemberProfile[];
  initialStatus?: TaskStatus;
  initialAssigneeId?: number;
  initialLabels?: string[];
  onSubmit: (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    targetAssigneeIds: number[];
    deadline?: string;
    estHours?: number;
    labels: string[];
  }) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  crewMembers,
  memberAccounts,
  initialStatus = 'TODO',
  initialAssigneeId,
  initialLabels = ['Java', 'Core Java'],
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MED');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [deadline, setDeadline] = useState('');
  const [estHours, setEstHours] = useState('4.0');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialLabels);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('INDIVIDUAL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [isLabelPickerOpen, setIsLabelPickerOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize initial state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('MED');
      setStatus(initialStatus || 'TODO');
      setDeadline('');
      setEstHours('4.0');
      setSelectedLabels(initialLabels || ['Java', 'Core Java']);
      setIsLabelPickerOpen(false);
      setValidationError('');

      if (initialAssigneeId) {
        setAssignmentMode('INDIVIDUAL');
        setSelectedMemberIds([initialAssigneeId]);
      } else if (memberAccounts.length > 0) {
        setAssignmentMode('INDIVIDUAL');
        setSelectedMemberIds([memberAccounts[0].userId]);
      } else {
        setSelectedMemberIds([]);
      }
    }
  }, [isOpen, initialStatus, initialAssigneeId, memberAccounts, initialLabels]);

  const targetMemberNames = selectedMemberIds
    .map((id) => {
      const mem = crewMembers.find((m) => m.userId === id);
      return mem ? mem.name : `Engineer #${id}`;
    })
    .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!title.trim()) {
      setValidationError('Please provide a task mission title.');
      return;
    }

    let targetIds: number[] = [];
    if (assignmentMode === 'INDIVIDUAL') {
      if (selectedMemberIds.length === 0) {
        setValidationError('Please select an engineer to assign this mission.');
        return;
      }
      targetIds = [selectedMemberIds[0]];
    } else if (assignmentMode === 'MULTIPLE') {
      if (selectedMemberIds.length === 0) {
        setValidationError('Please select at least one engineer from the crew.');
        return;
      }
      targetIds = selectedMemberIds;
    } else if (assignmentMode === 'ENTIRE_CREW') {
      targetIds = memberAccounts.map((m) => m.userId);
      if (targetIds.length === 0) {
        setValidationError('No active crew members found to assign.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        targetAssigneeIds: targetIds,
        deadline: deadline || undefined,
        estHours: estHours ? parseFloat(estHours) : undefined,
        labels: selectedLabels,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create task mission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      kicker="MISSION MANAGEMENT"
      title="Create Engineering Mission"
      subtitle="Dispatch a structured sprint task, assign ownership, and define acceptance criteria."
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-muted hidden sm:flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>
              {assignmentMode === 'ENTIRE_CREW'
                ? `Creates ${memberAccounts.length} individual tasks`
                : assignmentMode === 'MULTIPLE'
                ? `Creates ${selectedMemberIds.length} individual tasks`
                : 'Creates 1 individual task'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark/70 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover active:scale-95 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <span>Create Mission</span>
                  <span className="text-white/70 font-mono text-[10px]">↵</span>
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-3.5 border border-red-300/80 bg-red-50/60 text-red-900 rounded-xl text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Task Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-ink">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            required
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement Concurrent LRU Cache with Thread-Safe Eviction"
            className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm text-ink placeholder:text-muted/60 outline-none transition-all"
          />
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-ink">Technical Description & Acceptance Criteria</label>
            <span className="text-[10px] text-muted">Markdown supported</span>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline implementation requirements, edge cases, unit test criteria, and definition of done..."
            className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all"
          />
        </div>

        {/* ASSIGNMENT MODE SELECTOR (3 MODES) */}
        <div className="p-4 border border-line bg-paper/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-ink uppercase tracking-wider">Assign Ownership</span>
            </div>
            <span className="text-[11px] text-muted font-medium">
              {assignmentMode === 'INDIVIDUAL' && 'Single Assignee'}
              {assignmentMode === 'MULTIPLE' && `${selectedMemberIds.length} Selected`}
              {assignmentMode === 'ENTIRE_CREW' && `All ${memberAccounts.length} Members`}
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-paper-dark/60 rounded-xl border border-line/70 text-xs">
            <button
              type="button"
              onClick={() => {
                setAssignmentMode('INDIVIDUAL');
                setSelectedMemberIds(memberAccounts[0] ? [memberAccounts[0].userId] : []);
                setValidationError('');
              }}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                assignmentMode === 'INDIVIDUAL'
                  ? 'bg-paper text-ink shadow-xs border border-line font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Individual</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAssignmentMode('MULTIPLE');
                setSelectedMemberIds(memberAccounts.slice(0, 2).map((m) => m.userId));
                setValidationError('');
              }}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                assignmentMode === 'MULTIPLE'
                  ? 'bg-paper text-ink shadow-xs border border-line font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Multiple</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAssignmentMode('ENTIRE_CREW');
                setSelectedMemberIds(memberAccounts.map((m) => m.userId));
                setValidationError('');
              }}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                assignmentMode === 'ENTIRE_CREW'
                  ? 'bg-primary text-white shadow-xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Entire Crew</span>
            </button>
          </div>

          {/* MODE 1: INDIVIDUAL DROPDOWN */}
          {assignmentMode === 'INDIVIDUAL' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] text-muted font-bold">Select Engineer:</label>
              <select
                value={selectedMemberIds[0] || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedMemberIds(val ? [val] : []);
                  setValidationError('');
                }}
                className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-medium outline-none transition-all cursor-pointer text-ink"
              >
                {crewMembers.map((cm) => (
                  <option key={cm.id} value={cm.userId}>
                    {cm.name} · {cm.serialNumber} · {cm.role || 'Member'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MODE 2: MULTI-SELECT CHECKBOXES */}
          {assignmentMode === 'MULTIPLE' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span className="font-bold">Choose Engineers:</span>
                <span className="text-[10px]">
                  {selectedMemberIds.length} of {memberAccounts.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {crewMembers.map((cm) => {
                  const checked = selectedMemberIds.includes(cm.userId);
                  return (
                    <label
                      key={cm.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
                        checked
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                          : 'bg-paper border-line text-muted hover:border-line-dark'
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
                        className="rounded accent-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="truncate">{cm.name}</span>
                      <span className="text-[10px] font-mono text-muted/70 ml-auto">{cm.serialNumber}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 3: ENTIRE CREW CONFIRMATION */}
          {assignmentMode === 'ENTIRE_CREW' && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 text-xs text-ink">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-primary block">Broadcast Mission to Full Crew</span>
                <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                  An individual task instance will be created and tracked independently for every one of the{' '}
                  <strong className="text-ink font-bold">{memberAccounts.length} active engineers</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PRIORITY & STATUS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Priority Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">Mission Priority</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['LOW', 'MED', 'HIGH'] as TaskPriority[]).map((p) => {
                const isSelected = priority === p;
                const colors = {
                  LOW: isSelected ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-paper text-muted hover:border-line-dark',
                  MED: isSelected ? 'bg-amber-600 text-white border-amber-700' : 'bg-paper text-muted hover:border-line-dark',
                  HIGH: isSelected ? 'bg-red-600 text-white border-red-700' : 'bg-paper text-muted hover:border-line-dark',
                }[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${colors}`}
                  >
                    {p === 'LOW' && 'Low'}
                    {p === 'MED' && 'Medium'}
                    {p === 'HIGH' && 'High'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Status Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-medium outline-none transition-all cursor-pointer text-ink"
            >
              <option value="BACKLOG">Backlog (Unscheduled)</option>
              <option value="TODO">To Do (Assigned)</option>
              <option value="IN_PROGRESS">In Progress (Active)</option>
            </select>
          </div>
        </div>

        {/* DEADLINE & ESTIMATE ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              <span>Target Deadline</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-mono outline-none text-ink transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span>Estimated Hours</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="160"
              value={estHours}
              onChange={(e) => setEstHours(e.target.value)}
              placeholder="e.g. 4.0"
              className="w-full px-3 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs font-mono outline-none text-ink transition-all"
            />
          </div>
        </div>

        {/* TECHNICAL LABELS / TAGS ACCORDION */}
        <div className="border border-line rounded-xl overflow-hidden bg-paper/50">
          <button
            type="button"
            onClick={() => setIsLabelPickerOpen(!isLabelPickerOpen)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-ink hover:bg-paper-dark/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Technical Labels & Topic Tags</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-paper-dark border border-line text-muted">
                {selectedLabels.length} active
              </span>
            </div>
            {isLabelPickerOpen ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </button>

          {isLabelPickerOpen && (
            <div className="p-3.5 border-t border-line space-y-3 bg-paper-light">
              {LABEL_CATEGORIES.map((cat) => (
                <div key={cat.name} className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    {cat.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
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
                          className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-primary text-white font-semibold shadow-2xs'
                              : 'bg-paper text-muted border border-line hover:border-line-dark hover:text-ink'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{lbl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MISSION PREVIEW SUMMARY CARD */}
        <div className="p-3.5 bg-paper-dark/40 border border-line rounded-xl space-y-1 text-xs">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-wider">
            <span>Mission Summary Preview</span>
            <span className="text-primary">
              {targetMemberNames.length} {targetMemberNames.length === 1 ? 'Assignee' : 'Assignees'}
            </span>
          </div>
          <div className="font-bold text-ink truncate text-sm">
            {title || 'Untitled Engineering Mission'}
          </div>
          <div className="text-[11px] text-muted flex flex-wrap items-center gap-2 pt-0.5">
            <span>
              Target: <strong className="text-ink">{targetMemberNames.length > 0 ? targetMemberNames.join(', ') : 'None selected'}</strong>
            </span>
            <span>·</span>
            <span>
              Priority: <strong className="text-ink">{priority}</strong>
            </span>
            {deadline && (
              <>
                <span>·</span>
                <span>Due: <strong className="text-ink">{deadline}</strong></span>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
