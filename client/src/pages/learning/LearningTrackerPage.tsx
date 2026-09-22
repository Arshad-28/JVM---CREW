import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { SubjectProgress, LearningStatus, LearningTopic } from '../../types';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  BookOpen,
  FolderPlus,
  GraduationCap,
} from 'lucide-react';

export const LearningTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const isLead = user?.role === 'LEAD' || user?.role === 'ADMIN';

  const cachedCurriculum = cacheStore.get<SubjectProgress[]>('curriculum_tree');
  const [curriculum, setCurriculum] = useState<SubjectProgress[]>(() => cachedCurriculum || []);
  const [loading, setLoading] = useState(!cachedCurriculum);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'DONE' | 'NOT_STARTED'>('ALL');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Modals for Lead Management
  const [addTopicModalOpen, setAddTopicModalOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<LearningTopic | null>(null);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState(() => (cachedCurriculum && cachedCurriculum.length > 0 ? cachedCurriculum[0].subject : ''));
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [topicTitleInput, setTopicTitleInput] = useState('');
  const [orderIndexInput, setOrderIndexInput] = useState<number | ''>('');
  const [initialTopicInput, setInitialTopicInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCurriculum = async () => {
    try {
      if (!curriculum.length && !cacheStore.get<SubjectProgress[]>('curriculum_tree')) {
        setLoading(true);
      }
      const data = await api.getCurriculumTree();
      setCurriculum(data);
      // Auto-select first subject for add topic form if none selected
      if (data.length > 0 && !selectedSubject) {
        setSelectedSubject(data[0].subject);
      }
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, [user]);

  const toggleSubject = (subject: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  const handleStatusToggle = async (topicId: number, currentStatus: LearningStatus) => {
    let nextStatus: LearningStatus = 'NOT_STARTED';
    if (currentStatus === 'NOT_STARTED') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'DONE';
    else nextStatus = 'NOT_STARTED';

    try {
      await api.updateLearningProgress(topicId, nextStatus);
      fetchCurriculum();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  // Lead: Open Add Topic Modal
  const handleOpenAddTopic = (subject?: string) => {
    if (subject) {
      setSelectedSubject(subject);
    } else if (curriculum.length > 0) {
      setSelectedSubject(curriculum[0].subject);
    }
    setTopicTitleInput('');
    setOrderIndexInput('');
    setAddTopicModalOpen(true);
  };

  // Lead: Open Add Subject Modal
  const handleOpenAddSubject = () => {
    setNewSubjectInput('');
    setInitialTopicInput('');
    setAddSubjectModalOpen(true);
  };

  // Lead: Open Edit Topic Modal
  const handleOpenEditTopic = (topic: LearningTopic) => {
    setEditingTopic(topic);
    setSelectedSubject(topic.subject);
    setTopicTitleInput(topic.title);
    setOrderIndexInput(topic.orderIndex);
  };

  // Lead: Submit Add Topic
  const handleAddTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject.trim() || !topicTitleInput.trim()) {
      alert('Please select a subject and enter a topic title.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createCurriculumTopic({
        subject: selectedSubject.trim(),
        title: topicTitleInput.trim(),
        orderIndex: typeof orderIndexInput === 'number' ? orderIndexInput : undefined,
      });
      setAddTopicModalOpen(false);
      setTopicTitleInput('');
      fetchCurriculum();
    } catch (err: any) {
      alert('Failed to add topic: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Lead: Submit Add Subject
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) {
      alert('Please enter a subject name.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createCurriculumSubject({
        subject: newSubjectInput.trim(),
        initialTopicTitle: initialTopicInput.trim() || undefined,
      });
      setAddSubjectModalOpen(false);
      setNewSubjectInput('');
      setInitialTopicInput('');
      fetchCurriculum();
    } catch (err: any) {
      alert('Failed to add subject: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Lead: Submit Edit Topic
  const handleEditTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !topicTitleInput.trim()) return;

    try {
      setSubmitting(true);
      await api.updateCurriculumTopic(editingTopic.id, {
        subject: selectedSubject.trim(),
        title: topicTitleInput.trim(),
        orderIndex: typeof orderIndexInput === 'number' ? orderIndexInput : undefined,
      });
      setEditingTopic(null);
      fetchCurriculum();
    } catch (err: any) {
      alert('Failed to update topic: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Lead: Delete / Archive Topic
  const handleDeleteTopic = async (topicId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}" from the team curriculum?`)) {
      return;
    }

    try {
      await api.deleteCurriculumTopic(topicId);
      fetchCurriculum();
    } catch (err: any) {
      alert('Failed to delete topic: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20 text-muted font-mono text-xs">
          Loading structured curriculum...
        </div>
      </div>
    );
  }

  const totalTopics = curriculum.reduce((acc, curr) => acc + curr.totalTopics, 0);
  const doneTopics = curriculum.reduce((acc, curr) => acc + curr.doneTopics, 0);
  const inProgTopics = curriculum.reduce((acc, curr) => acc + curr.inProgressTopics, 0);
  const overallPct = totalTopics > 0 ? Math.round((doneTopics * 100) / totalTopics) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="border border-line bg-paper p-4 rounded-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-display text-lg font-bold text-ink">
              Structured SDE Curriculum Tracker
            </h1>
            <span className="font-mono text-xs text-muted">
              · {isLead ? 'Leadership Curriculum Manager' : 'Team Training Plan'}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {isLead
              ? 'Lead controls: Add, edit, or archive topics. All updates sync in real-time across your team.'
              : 'Subject completion rates are derived dynamically from individual learning progress.'}
          </p>
        </div>

        {/* Lead Management Action Buttons vs Overall Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {isLead && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenAddSubject}
                className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <FolderPlus className="w-3.5 h-3.5 text-accent" />
                <span>+ Add Subject</span>
              </button>
              <button
                onClick={() => handleOpenAddTopic()}
                className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink-light rounded-sm font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>+ Add Topic</span>
              </button>
            </div>
          )}

          <div className="md:w-56">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-medium text-muted">Overall Mastery</span>
              <span className="font-mono text-xs font-semibold text-ink">
                {doneTopics}/{totalTopics} Topics ({overallPct}%)
              </span>
            </div>
            <ProgressBar progressPct={overallPct} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div className="flex space-x-1 font-mono text-xs overflow-x-auto no-scrollbar pb-1 max-w-full">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-sm border transition-colors shrink-0 ${
              filter === 'ALL'
                ? 'bg-ink text-paper border-ink font-semibold'
                : 'bg-paper text-muted border-line hover:border-ink'
            }`}
          >
            All Topics ({totalTopics})
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`px-3 py-1 rounded-sm border transition-colors shrink-0 ${
              filter === 'IN_PROGRESS'
                ? 'bg-ink text-paper border-ink font-semibold'
                : 'bg-paper text-muted border-line hover:border-ink'
            }`}
          >
            In Progress ({inProgTopics})
          </button>
          <button
            onClick={() => setFilter('DONE')}
            className={`px-3 py-1 rounded-sm border transition-colors shrink-0 ${
              filter === 'DONE'
                ? 'bg-ink text-paper border-ink font-semibold'
                : 'bg-paper text-muted border-line hover:border-ink'
            }`}
          >
            Completed ({doneTopics})
          </button>
        </div>

        <span className="font-mono text-xs text-muted">
          Click any status pill or circle to advance your personal mastery
        </span>
      </div>

      {/* Empty State */}
      {curriculum.length === 0 ? (
        <div className="border border-line bg-paper rounded-sm p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-paper-dark border border-line flex items-center justify-center mx-auto text-muted">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              No Curriculum Yet
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              {isLead
                ? "Your team doesn't have any curriculum topics yet."
                : "Your Lead hasn't added any curriculum topics yet."}
            </p>
          </div>
          {isLead && (
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                onClick={handleOpenAddSubject}
                className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink flex items-center space-x-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5 text-accent" />
                <span>+ Add Subject</span>
              </button>
              <button
                onClick={() => handleOpenAddTopic()}
                className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light rounded-sm font-mono text-xs font-semibold flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>+ Add Topic</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Curriculum Subject Ledgers */
        <div className="space-y-4">
          {curriculum.map((subject) => {
            const isExpanded = expandedSubjects[subject.subject] ?? true;
            const filteredTopics = subject.topics.filter((t) => {
              if (filter === 'ALL') return true;
              return t.status === filter;
            });

            if (filteredTopics.length === 0 && filter !== 'ALL') {
              return null;
            }

            return (
              <div
                key={subject.subject}
                className="border border-line bg-paper rounded-sm overflow-hidden"
              >
                {/* Subject Ledger Header */}
                <div className="p-3 sm:p-3.5 bg-paper-dark border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-paper-light transition-colors">
                  <div
                    onClick={() => toggleSubject(subject.subject)}
                    className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="text-muted shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display text-sm font-bold text-ink">
                        {subject.subject}
                      </span>
                      <span className="font-mono text-xs text-muted ml-2">
                        ({subject.doneTopics}/{subject.totalTopics} completed · {subject.inProgressTopics} active)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto">
                    {/* Lead Quick Add Topic to this Subject */}
                    {isLead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddTopic(subject.subject);
                        }}
                        className="px-2 py-1 bg-paper border border-line hover:border-ink rounded-xs font-mono text-[10px] font-semibold text-ink flex items-center space-x-1 transition-colors shrink-0"
                        title="Add topic to this subject"
                      >
                        <Plus className="w-3 h-3 text-accent" />
                        <span>Add Topic</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-2.5 w-36 sm:w-48 shrink-0">
                      <div className="flex-1">
                        <ProgressBar progressPct={subject.completionPct} />
                      </div>
                      <span className="font-mono text-xs font-semibold text-ink w-8 text-right">
                        {subject.completionPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Topics Table */}
                {isExpanded && (
                  <div className="divide-y divide-line">
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className="p-3 flex items-center justify-between hover:bg-paper-dark transition-colors group"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <span className="font-mono text-xs text-muted w-6 text-right shrink-0">
                            #{topic.orderIndex}
                          </span>

                          <button
                            onClick={() => handleStatusToggle(topic.id, topic.status)}
                            className="p-1 text-muted hover:text-ink transition-colors shrink-0"
                            title="Click to toggle status (Not Started -> In Progress -> Done)"
                          >
                            {topic.status === 'DONE' && (
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                            )}
                            {topic.status === 'IN_PROGRESS' && (
                              <Clock className="w-4 h-4 text-attention" />
                            )}
                            {topic.status === 'NOT_STARTED' && (
                              <Circle className="w-4 h-4 text-line-dark" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-medium truncate ${
                                topic.status === 'DONE' ? 'text-muted' : 'text-ink'
                              }`}
                            >
                              {topic.title}
                            </p>
                            {topic.completedAt && (
                              <p className="font-mono text-[10px] text-muted">
                                Completed: {topic.completedAt.substring(0, 10)} {topic.completedAt.substring(11, 16)} UTC
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions and Status */}
                        <div className="flex items-center space-x-2 pl-3 shrink-0">
                          {/* Practice This Topic in Interview Lab */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.dispatchEvent(new CustomEvent('jvm_open_interview_lab', {
                                detail: { topic: `I learned ${topic.title} in ${subject.subject}.` }
                              }));
                            }}
                            className="px-2 py-1 bg-paper border border-line hover:border-ink rounded-xs font-mono text-[10px] font-semibold text-ink flex items-center space-x-1 transition-colors shadow-2xs"
                            title="Practice this topic in Interview Lab"
                          >
                            <GraduationCap className="w-3 h-3 text-accent" />
                            <span className="hidden sm:inline">Practice Topic</span>
                          </button>

                          {/* Lead-Only Edit and Delete Controls */}
                          {isLead && (
                            <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditTopic(topic)}
                                className="p-1 text-muted hover:text-ink hover:bg-paper rounded-xs transition-colors"
                                title="Edit Topic"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(topic.id, topic.title)}
                                className="p-1 text-muted hover:text-attention hover:bg-paper rounded-xs transition-colors"
                                title="Archive / Delete Topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Member and Lead Personal Status Toggle Action */}
                          <button
                            onClick={() => handleStatusToggle(topic.id, topic.status)}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <StatusBadge type="learning" value={topic.status} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAD ADD TOPIC MODAL                                                      */}
      {/* ========================================================================= */}
      {addTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-paper border border-line max-w-md w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                  CURRICULUM MANAGEMENT
                </span>
                <h3 className="font-display text-base font-bold text-ink mt-0.5">
                  + Add Topic
                </h3>
              </div>
              <button
                onClick={() => setAddTopicModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTopicSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Subject *
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                >
                  {curriculum.map((c) => (
                    <option key={c.subject} value={c.subject}>
                      {c.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={topicTitleInput}
                  onChange={(e) => setTopicTitleInput(e.target.value)}
                  placeholder="e.g. Switch Statements"
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Order Index (Optional)
                </label>
                <input
                  type="number"
                  value={orderIndexInput}
                  onChange={(e) =>
                    setOrderIndexInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder="Auto-assigned if left blank"
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setAddTopicModalOpen(false)}
                  className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 text-accent" />
                  <span>{submitting ? 'Adding...' : 'Add Topic'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAD ADD SUBJECT MODAL                                                    */}
      {/* ========================================================================= */}
      {addSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-paper border border-line max-w-md w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                  CURRICULUM MANAGEMENT
                </span>
                <h3 className="font-display text-base font-bold text-ink mt-0.5">
                  + Add Subject
                </h3>
              </div>
              <button
                onClick={() => setAddSubjectModalOpen(false)}
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="e.g. Object-Oriented Programming"
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  First Topic Title (Optional)
                </label>
                <input
                  type="text"
                  value={initialTopicInput}
                  onChange={(e) => setInitialTopicInput(e.target.value)}
                  placeholder="e.g. Classes and Objects"
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setAddSubjectModalOpen(false)}
                  className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-accent" />
                  <span>{submitting ? 'Creating...' : 'Create Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAD EDIT TOPIC MODAL                                                     */}
      {/* ========================================================================= */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-paper border border-line max-w-md w-full p-5 rounded-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
                  CURRICULUM MANAGEMENT
                </span>
                <h3 className="font-display text-base font-bold text-ink mt-0.5">
                  Edit Topic · #{editingTopic.orderIndex}
                </h3>
              </div>
              <button
                onClick={() => setEditingTopic(null)}
                className="text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTopicSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Subject *
                </label>
                <input
                  type="text"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Topic Title *
                </label>
                <input
                  type="text"
                  value={topicTitleInput}
                  onChange={(e) => setTopicTitleInput(e.target.value)}
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                  Order Index *
                </label>
                <input
                  type="number"
                  value={orderIndexInput}
                  onChange={(e) =>
                    setOrderIndexInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1 disabled:opacity-50 shadow-xs"
                >
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
