import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { Homework, MemberHomeworkStatus } from '../../types';
import {
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  Send,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Bell,
  Check,
  BookOpen,
  Trash2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { Modal } from '../../components/common/Modal';

export const HomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const isLead = user?.role === 'LEAD' || user?.role === 'ADMIN';

  const cachedHw = cacheStore.get<Homework[]>('homework_list');
  const [homeworkList, setHomeworkList] = useState<Homework[]>(() => cachedHw || []);
  const [loading, setLoading] = useState(!cachedHw);
  const [error, setError] = useState<string | null>(null);

  // Modals & Active State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [solutionModalHomework, setSolutionModalHomework] = useState<Homework | null>(null);
  const [reviewModalSubmission, setReviewModalSubmission] = useState<{
    homeworkId: number;
    memberStatus: MemberHomeworkStatus;
  } | null>(null);

  // Lead Add/Edit Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formQuestions, setFormQuestions] = useState<string[]>(['']);
  const [formInstructions, setFormInstructions] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');
  const [formAttachmentData, setFormAttachmentData] = useState('');
  const [formAttachmentType, setFormAttachmentType] = useState('');
  const [formSolutionText, setFormSolutionText] = useState('');
  const [formSolutionAttachmentName, setFormSolutionAttachmentName] = useState('');
  const [formSolutionAttachmentData, setFormSolutionAttachmentData] = useState('');
  const [formSolutionAttachmentType, setFormSolutionAttachmentType] = useState('');
  const [savingHomework, setSavingHomework] = useState(false);

  // Member Submission Form State (per homework ID)
  const [submissionAnswers, setSubmissionAnswers] = useState<Record<number, string>>({});
  const [submissionNotes, setSubmissionNotes] = useState<Record<number, string>>({});
  const [submissionFiles, setSubmissionFiles] = useState<
    Record<number, { name: string; data: string; type: string }>
  >({});
  const [submittingMap, setSubmittingMap] = useState<Record<number, boolean>>({});
  const [editingSubmissionMap, setEditingSubmissionMap] = useState<Record<number, boolean>>({});

  // Lead Review Feedback State
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Lead Solution Publish State
  const [solutionText, setSolutionText] = useState('');
  const [solutionFileName, setSolutionFileName] = useState('');
  const [solutionFileData, setSolutionFileData] = useState('');
  const [solutionFileType, setSolutionFileType] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);

  // Expanded Accordion State
  const [expandedHomework, setExpandedHomework] = useState<Record<number, boolean>>({});
  const [remindedMembersMap, setRemindedMembersMap] = useState<Record<string, boolean>>({});

  // Homework Deletion State
  const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);
  const [isDeletingHomework, setIsDeletingHomework] = useState<boolean>(false);
  const [deleteHomeworkError, setDeleteHomeworkError] = useState<string | null>(null);

  const handleConfirmDeleteHomework = async () => {
    if (!homeworkToDelete) return;
    try {
      setIsDeletingHomework(true);
      setDeleteHomeworkError(null);
      await api.deleteHomework(homeworkToDelete.id);
      setHomeworkList((prev) => prev.filter((hw) => hw.id !== homeworkToDelete.id));
      if (editingHomework?.id === homeworkToDelete.id) {
        setAddModalOpen(false);
        setEditingHomework(null);
      }
      setHomeworkToDelete(null);
    } catch (err: any) {
      setDeleteHomeworkError(err.message || 'Failed to delete homework');
    } finally {
      setIsDeletingHomework(false);
    }
  };

  const loadHomework = async () => {
    try {
      if (!homeworkList.length && !cacheStore.get<Homework[]>('homework_list')) {
        setLoading(true);
      }
      setError(null);
      const data = await api.getHomeworkList();
      setHomeworkList(data);
      // Expand the first active homework by default
      if (data.length > 0) {
        setExpandedHomework((prev) => ({ ...prev, [data[0].id]: true }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load homework');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [user]);

  const handleOpenAddModal = (hw?: Homework) => {
    if (hw) {
      setEditingHomework(hw);
      setFormTitle(hw.title);
      setFormTopic(hw.subjectTopic);
      setFormDueDate(hw.dueDate);
      setFormQuestions(hw.questions && hw.questions.length > 0 ? hw.questions : ['']);
      setFormInstructions(hw.instructions || '');
      setFormAttachmentName(hw.attachmentName || '');
      setFormAttachmentData(hw.attachmentData || '');
      setFormAttachmentType(hw.attachmentType || '');
      setFormSolutionText(hw.solutionText || '');
      setFormSolutionAttachmentName(hw.solutionAttachmentName || '');
      setFormSolutionAttachmentData(hw.solutionAttachmentData || '');
      setFormSolutionAttachmentType(hw.solutionAttachmentType || '');
    } else {
      setEditingHomework(null);
      setFormTitle('');
      setFormTopic('');
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      setFormDueDate(inThreeDays.toISOString().substring(0, 10));
      setFormQuestions(['']);
      setFormInstructions('');
      setFormAttachmentName('');
      setFormAttachmentData('');
      setFormAttachmentType('');
      setFormSolutionText('');
      setFormSolutionAttachmentName('');
      setFormSolutionAttachmentData('');
      setFormSolutionAttachmentType('');
    }
    setAddModalOpen(true);
  };

  const handleAddQuestionField = () => {
    setFormQuestions((prev) => [...prev, '']);
  };

  const handleRemoveQuestionField = (index: number) => {
    setFormQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, val: string) => {
    setFormQuestions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (name: string, data: string, type: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setter(file.name, result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveHomework = async (publishNow: boolean) => {
    if (!formTitle.trim()) {
      alert('Please enter a title for the homework');
      return;
    }
    const cleanQuestions = formQuestions.map((q) => q.trim()).filter(Boolean);

    try {
      setSavingHomework(true);
      const payload = {
        title: formTitle.trim(),
        subjectTopic: formTopic.trim() || 'General Classwork',
        dueDate: formDueDate,
        questions: cleanQuestions,
        instructions: formInstructions.trim() || null,
        attachmentName: formAttachmentName || null,
        attachmentData: formAttachmentData || null,
        attachmentType: formAttachmentType || null,
        solutionText: formSolutionText.trim() || null,
        solutionAttachmentName: formSolutionAttachmentName || null,
        solutionAttachmentData: formSolutionAttachmentData || null,
        solutionAttachmentType: formSolutionAttachmentType || null,
        publishNow,
      };

      if (editingHomework) {
        await api.updateHomework(editingHomework.id, payload);
      } else {
        await api.createHomework(payload);
      }

      setAddModalOpen(false);
      loadHomework();
    } catch (err: any) {
      alert('Failed to save homework: ' + err.message);
    } finally {
      setSavingHomework(false);
    }
  };

  const handlePublishHomeworkDirectly = async (hwId: number) => {
    try {
      await api.publishHomework(hwId);
      loadHomework();
    } catch (err: any) {
      alert('Failed to publish homework: ' + err.message);
    }
  };

  const handleOpenSolutionModal = (hw: Homework) => {
    setSolutionModalHomework(hw);
    setSolutionText(hw.solutionText || '');
    setSolutionFileName(hw.solutionAttachmentName || '');
    setSolutionFileData(hw.solutionAttachmentData || '');
    setSolutionFileType(hw.solutionAttachmentType || '');
  };

  const handlePublishSolutionSubmit = async () => {
    if (!solutionModalHomework) return;
    try {
      setSubmittingSolution(true);
      await api.publishHomeworkSolution(solutionModalHomework.id, {
        solutionText: solutionText.trim(),
        solutionAttachmentName: solutionFileName || undefined,
        solutionAttachmentData: solutionFileData || undefined,
        solutionAttachmentType: solutionFileType || undefined,
      });
      setSolutionModalHomework(null);
      loadHomework();
    } catch (err: any) {
      alert('Failed to publish solution: ' + err.message);
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleMemberSubmit = async (hwId: number) => {
    const answer = submissionAnswers[hwId] || '';
    const file = submissionFiles[hwId];
    const notes = submissionNotes[hwId] || '';

    if (!answer.trim() && !file) {
      alert('Please type an answer or upload your completed work file.');
      return;
    }

    try {
      setSubmittingMap((prev) => ({ ...prev, [hwId]: true }));
      await api.submitHomework(hwId, {
        answerText: answer.trim() || undefined,
        attachmentName: file?.name,
        attachmentData: file?.data,
        attachmentType: file?.type,
        notes: notes.trim() || undefined,
      });

      setEditingSubmissionMap((prev) => ({ ...prev, [hwId]: false }));
      loadHomework();
    } catch (err: any) {
      alert('Failed to submit homework: ' + err.message);
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [hwId]: false }));
    }
  };

  const handleOpenReviewModal = (hwId: number, memberStatus: MemberHomeworkStatus) => {
    setReviewModalSubmission({ homeworkId: hwId, memberStatus });
    setReviewFeedback(memberStatus.leadFeedback || '');
  };

  const handleReviewSubmit = async () => {
    if (!reviewModalSubmission || !reviewModalSubmission.memberStatus.submissionId) return;
    try {
      setSubmittingReview(true);
      await api.reviewHomeworkSubmission(
        reviewModalSubmission.memberStatus.submissionId,
        reviewFeedback.trim()
      );
      setReviewModalSubmission(null);
      loadHomework();
    } catch (err: any) {
      alert('Failed to submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRemindMember = async (hwId: number, memberUserId: number) => {
    try {
      await api.remindHomeworkMember(hwId, memberUserId);
      setRemindedMembersMap((prev) => ({ ...prev, [`${hwId}-${memberUserId}`]: true }));
    } catch (err: any) {
      alert('Failed to send reminder: ' + err.message);
    }
  };

  const toggleAccordion = (hwId: number) => {
    setExpandedHomework((prev) => ({ ...prev, [hwId]: !prev[hwId] }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center font-mono text-xs text-muted">
        Loading homework assignments...
      </div>
    );
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  const activeHomeworkList = homeworkList.filter(
    (hw) => !hw.dueDate || hw.dueDate >= todayStr || (isLead && !hw.isPublished)
  );
  const previousHomeworkList = homeworkList.filter(
    (hw) => hw.dueDate && hw.dueDate < todayStr && hw.isPublished
  );

  return (
    <PageContainer width="default" className="space-y-6">
      {/* ========================================================================= */}
      {/* PAGE HEADER                                                               */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-paper-light via-surface to-paper border border-line/90 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isLead ? 'LEADERSHIP ACTION CENTER' : 'STUDENT ASSIGNMENTS'}
              </span>
              <span className="text-muted/40">·</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-paper border border-line text-muted">
                {activeHomeworkList.length} Active
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {isLead ? 'Homework & Classwork Hub' : 'My Homework Assignments'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
              {isLead
                ? 'Assign questions from class, track submissions, and share instructor solutions with your team.'
                : 'Questions, practice exercises, and solution guidelines assigned by your Team Lead.'}
            </p>
          </div>

          {isLead && (
            <button
              onClick={() => handleOpenAddModal()}
              className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-300 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add Homework</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-attention/10 border border-attention text-xs text-attention rounded-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. ACTIVE HOMEWORK SECTION                                                */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <h2 className="font-display text-base font-bold text-ink">
              Active Homework
            </h2>
          </div>
          <span className="font-mono text-xs text-muted">
            {activeHomeworkList.length} Active
          </span>
        </div>

        {activeHomeworkList.length === 0 ? (
          <div className="border border-line bg-paper rounded-sm p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-paper-dark border border-line flex items-center justify-center mx-auto text-muted">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                No Homework Yet
              </h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                {isLead
                  ? 'Create an assignment when your instructor gives the team homework.'
                  : "Your Lead hasn't assigned any homework yet."}
              </p>
            </div>
            {isLead && (
              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-sm transition-colors inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>+ Add Homework</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeHomeworkList.map((hw) => {
              const isExpanded = !!expandedHomework[hw.id];
              const isOverdue = hw.isOverdue;

              return (
                <div
                  key={hw.id}
                  className="border border-line bg-paper rounded-sm overflow-hidden shadow-xs transition-all"
                >
                  {/* Card Top Summary Bar */}
                  <div
                    onClick={() => toggleAccordion(hw.id)}
                    className="p-4 bg-paper-dark/60 hover:bg-paper-dark cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-ink truncate">
                          {hw.title}
                        </h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-line rounded-xs text-muted">
                          {hw.subjectTopic}
                        </span>
                        {isLead ? (
                          hw.isPublished ? (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded-xs font-bold">
                              Published
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] px-2 py-0.5 bg-paper border border-attention/40 text-attention rounded-xs font-semibold">
                              Draft
                            </span>
                          )
                        ) : (
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-xs font-bold border ${
                              hw.myStatus === 'Reviewed'
                                ? 'bg-accent/10 text-accent border-accent/30'
                                : hw.myStatus === 'Submitted'
                                ? 'bg-accent/10 text-accent border-accent/30'
                                : hw.myStatus === 'Overdue'
                                ? 'bg-attention/10 text-attention border-attention/30'
                                : 'bg-paper text-muted border-line'
                            }`}
                          >
                            {hw.myStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className={isOverdue ? 'text-attention font-semibold' : ''}>
                            Due: {hw.dueDate} {isOverdue && '(Overdue)'}
                          </span>
                        </span>
                        <span>·</span>
                        <span>{hw.questions.length} Questions</span>
                        {isLead && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-ink">
                              {hw.submittedCount} / {hw.totalMembers} Submitted
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isLead && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddModal(hw);
                            }}
                            className="p-1.5 hover:bg-paper border border-line hover:border-ink rounded-sm text-muted hover:text-ink transition-colors"
                            title="Edit Homework"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHomeworkToDelete(hw);
                            }}
                            className="p-1.5 hover:bg-red-500/10 border border-line hover:border-red-500/40 rounded-sm text-muted hover:text-red-600 transition-colors"
                            title="Delete Homework"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 space-y-5 text-xs font-sans">
                      {/* Reminder banner for member */}
                      {!isLead && hw.isReminded && hw.myStatus !== 'Submitted' && hw.myStatus !== 'Reviewed' && (
                        <div className="p-3 bg-attention/10 border border-attention text-attention rounded-sm flex items-center space-x-2">
                          <Bell className="w-4 h-4 shrink-0" />
                          <span>
                            <strong>Reminder from Lead:</strong> Your homework is due. Please submit your work.
                          </span>
                        </div>
                      )}

                      {/* Instructions & Lead Attachment */}
                      {hw.instructions && (
                        <div className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                          <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                            Instructions
                          </span>
                          <p className="text-ink leading-relaxed whitespace-pre-wrap">
                            {hw.instructions}
                          </p>
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-2">
                        <span className="font-mono text-[11px] uppercase font-bold text-muted block">
                          Questions
                        </span>
                        <div className="space-y-2 border border-line rounded-sm p-4 bg-paper-light">
                          {hw.questions.map((q, idx) => (
                            <div key={idx} className="flex items-start space-x-2.5">
                              <span className="font-mono font-bold text-accent shrink-0 mt-0.5">
                                {idx + 1}.
                              </span>
                              <p className="text-ink font-medium leading-relaxed">{q}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lead Attachment (if any) */}
                      {hw.attachmentData && (
                        <div className="p-3 border border-line rounded-sm bg-paper-dark/40 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-muted" />
                            <div>
                              <span className="font-mono text-xs font-semibold text-ink block">
                                {hw.attachmentName || 'Classwork_Material'}
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                Assignment attachment provided by Lead
                              </span>
                            </div>
                          </div>
                          <a
                            href={hw.attachmentData}
                            download={hw.attachmentName || 'Homework_Attachment'}
                            className="px-3 py-1 bg-paper border border-line hover:border-ink rounded-sm font-mono text-[11px] text-ink font-semibold flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* LEAD MANAGEMENT SECTION                                 */}
                      {/* ======================================================= */}
                      {isLead ? (
                        <div className="space-y-4 pt-3 border-t border-line">
                          {/* Solution Action Bar */}
                          <div className="p-3 bg-paper-dark rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <span className="font-mono text-xs font-bold text-ink block">
                                Answer / Solution
                              </span>
                              <p className="text-[11px] text-muted">
                                {hw.isSolutionPublished
                                  ? 'Solution is currently visible to your team.'
                                  : 'Solution is not visible to members until you publish it.'}
                              </p>
                            </div>

                            <button
                              onClick={() => handleOpenSolutionModal(hw)}
                              className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink font-mono text-xs font-semibold text-ink rounded-sm transition-colors flex items-center space-x-1.5 shrink-0"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-accent" />
                              <span>
                                {hw.isSolutionPublished
                                  ? '✓ Solution Published (Edit)'
                                  : 'Publish Answer / Solution'}
                              </span>
                            </button>
                          </div>

                          {/* Member Submissions Tracker Table */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] uppercase font-bold text-muted">
                                Team Submissions ({hw.submittedCount}/{hw.totalMembers})
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                {hw.reviewedCount} Reviewed
                              </span>
                            </div>

                            {/* Member Submissions Tracker: Desktop Table (hidden md:block) */}
                            <div className="hidden md:block border border-line rounded-sm overflow-hidden">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-line bg-paper-light font-mono text-[11px] text-muted">
                                    <th className="p-3">Member</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">Submitted At</th>
                                    <th className="p-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line font-sans">
                                  {hw.memberSubmissions?.map((m) => {
                                    const isReminded =
                                      m.isReminded || remindedMembersMap[`${hw.id}-${m.userId}`];

                                    return (
                                      <tr
                                        key={m.userId}
                                        className="hover:bg-paper-dark/40 transition-colors"
                                      >
                                        <td className="p-3">
                                          <span className="font-medium text-ink block">
                                            {m.name}
                                          </span>
                                          <span className="font-mono text-[10px] text-muted">
                                            {m.email}
                                          </span>
                                        </td>

                                        <td className="p-3 text-center">
                                          <span
                                            className={`font-mono text-[10px] px-2 py-0.5 rounded-xs font-bold border inline-block ${
                                              m.status === 'Reviewed'
                                                ? 'bg-accent/10 text-accent border-accent/30'
                                                : m.status === 'Submitted'
                                                ? 'bg-accent/10 text-accent border-accent/30'
                                                : m.status === 'Overdue'
                                                ? 'bg-attention/10 text-attention border-attention/30'
                                                : 'bg-paper text-muted border-line'
                                            }`}
                                          >
                                            {m.status}
                                          </span>
                                        </td>

                                        <td className="p-3 font-mono text-[11px] text-muted">
                                          {m.submittedAt
                                            ? new Date(m.submittedAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                              })
                                            : '—'}
                                        </td>

                                        <td className="p-3 text-right">
                                          {m.isSubmitted ? (
                                            <button
                                              onClick={() => handleOpenReviewModal(hw.id, m)}
                                              className="px-3 py-1 bg-paper border border-line hover:border-ink rounded-sm font-mono text-xs font-medium text-ink transition-colors inline-flex items-center space-x-1"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-accent" />
                                              <span>{m.isReviewed ? 'View' : 'Review'}</span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleRemindMember(hw.id, m.userId)}
                                              disabled={isReminded}
                                              className={`px-3 py-1 border rounded-sm font-mono text-xs transition-colors inline-flex items-center space-x-1 ${
                                                isReminded
                                                  ? 'border-line bg-paper-dark text-muted cursor-default'
                                                  : 'border-line bg-paper hover:border-ink text-ink'
                                              }`}
                                            >
                                              <Bell className="w-3 h-3" />
                                              <span>{isReminded ? 'Reminded' : 'Remind'}</span>
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Member Submissions Tracker: Mobile Cards (md:hidden) */}
                            <div className="md:hidden space-y-2.5">
                              {hw.memberSubmissions?.map((m) => {
                                const isReminded =
                                  m.isReminded || remindedMembersMap[`${hw.id}-${m.userId}`];

                                return (
                                  <div
                                    key={m.userId}
                                    className="p-3 bg-paper-light border border-line rounded-sm space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <span className="font-medium text-ink block text-xs truncate">
                                          {m.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-muted truncate block">
                                          {m.email}
                                        </span>
                                      </div>
                                      <span
                                        className={`font-mono text-[10px] px-2 py-0.5 rounded-xs font-bold border shrink-0 ${
                                          m.status === 'Reviewed'
                                            ? 'bg-accent/10 text-accent border-accent/30'
                                            : m.status === 'Submitted'
                                            ? 'bg-accent/10 text-accent border-accent/30'
                                            : m.status === 'Overdue'
                                            ? 'bg-attention/10 text-attention border-attention/30'
                                            : 'bg-paper text-muted border-line'
                                        }`}
                                      >
                                        {m.status}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-line/60">
                                      <span className="font-mono text-[10px] text-muted">
                                        {m.submittedAt
                                          ? new Date(m.submittedAt).toLocaleString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: 'numeric',
                                              minute: '2-digit',
                                            })
                                          : 'Not submitted yet'}
                                      </span>

                                      {m.isSubmitted ? (
                                        <button
                                          onClick={() => handleOpenReviewModal(hw.id, m)}
                                          className="px-2.5 py-1 bg-paper border border-line hover:border-ink rounded-sm font-mono text-[11px] font-medium text-ink transition-colors inline-flex items-center space-x-1"
                                        >
                                          <Eye className="w-3 h-3 text-accent" />
                                          <span>{m.isReviewed ? 'View' : 'Review'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleRemindMember(hw.id, m.userId)}
                                          disabled={isReminded}
                                          className={`px-2.5 py-1 border rounded-sm font-mono text-[11px] transition-colors inline-flex items-center space-x-1 ${
                                            isReminded
                                              ? 'border-line bg-paper-dark text-muted cursor-default'
                                              : 'border-line bg-paper hover:border-ink text-ink'
                                          }`}
                                        >
                                          <Bell className="w-3 h-3" />
                                          <span>{isReminded ? 'Reminded' : 'Remind'}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Draft publish button for Lead */}
                          {!hw.isPublished && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => handlePublishHomeworkDirectly(hw.id)}
                                className="px-4 py-2 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5 shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Publish to Team</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ======================================================= */
                        /* MEMBER SUBMISSION & SOLUTION VIEW                       */
                        /* ======================================================= */
                        <div className="space-y-5 pt-3 border-t border-line">
                          {/* 1. YOUR SUBMISSION */}
                          <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-line pb-2">
                              <span className="font-display text-sm font-bold text-ink">
                                Your Submission
                              </span>
                              {hw.mySubmission && (
                                <span className="font-mono text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-xs">
                                  ✓ Submitted on{' '}
                                  {new Date(hw.mySubmission.submittedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>

                            {hw.mySubmission && !editingSubmissionMap[hw.id] ? (
                              /* Display Submitted Work */
                              <div className="space-y-3 text-xs">
                                {hw.mySubmission.answerText && (
                                  <div className="p-3 bg-paper-light border border-line rounded-sm space-y-1">
                                    <span className="font-mono text-[10px] uppercase font-bold text-muted block">
                                      Your Typed Answer
                                    </span>
                                    <p className="text-ink whitespace-pre-wrap leading-relaxed">
                                      {hw.mySubmission.answerText}
                                    </p>
                                  </div>
                                )}

                                {hw.mySubmission.attachmentData && (
                                  <div className="p-3 bg-paper-dark border border-line rounded-sm flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-4 h-4 text-accent" />
                                      <span className="font-mono text-xs font-semibold text-ink">
                                        {hw.mySubmission.attachmentName || 'My_Completed_Work'}
                                      </span>
                                    </div>
                                    <a
                                      href={hw.mySubmission.attachmentData}
                                      download={hw.mySubmission.attachmentName || 'My_Work'}
                                      className="px-3 py-1 bg-paper border border-line hover:border-ink rounded-sm font-mono text-[11px] text-ink font-semibold flex items-center space-x-1"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                )}

                                {hw.mySubmission.leadFeedback && (
                                  <div className="p-3 bg-accent/5 border border-accent/30 rounded-sm space-y-1">
                                    <span className="font-mono text-[10px] uppercase font-bold text-accent block">
                                      Lead Feedback & Review:
                                    </span>
                                    <p className="text-ink font-medium leading-relaxed">
                                      {hw.mySubmission.leadFeedback}
                                    </p>
                                  </div>
                                )}

                                <div className="flex justify-end pt-1">
                                  <button
                                    onClick={() => {
                                      setSubmissionAnswers((prev) => ({
                                        ...prev,
                                        [hw.id]: hw.mySubmission?.answerText || '',
                                      }));
                                      setSubmissionNotes((prev) => ({
                                        ...prev,
                                        [hw.id]: hw.mySubmission?.notes || '',
                                      }));
                                      setEditingSubmissionMap((prev) => ({ ...prev, [hw.id]: true }));
                                    }}
                                    className="px-3.5 py-1.5 border border-line hover:bg-paper-dark font-mono text-xs rounded-sm text-ink transition-colors"
                                  >
                                    Update Your Work
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Submit Form (Text + File) */
                              <div className="space-y-4">
                                {/* Option 1: Type Answer */}
                                <div className="space-y-1.5">
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                                    Option 1 — Type Answer / Code
                                  </label>
                                  <textarea
                                    rows={5}
                                    value={submissionAnswers[hw.id] || ''}
                                    onChange={(e) =>
                                      setSubmissionAnswers((prev) => ({
                                        ...prev,
                                        [hw.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write your Java code, solution, or answers here..."
                                    className="w-full p-3 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-mono placeholder:font-sans placeholder:text-muted/60"
                                  />
                                </div>

                                {/* Option 2: Upload Completed Work */}
                                <div className="space-y-1.5">
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                                    Option 2 — Upload File (PDF, Image, Doc)
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <label className="px-4 py-2 bg-paper-dark border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink cursor-pointer flex items-center space-x-1.5 transition-colors">
                                      <Upload className="w-3.5 h-3.5 text-accent" />
                                      <span>Choose File</span>
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.java"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleFileUpload(e, (name, data, type) =>
                                            setSubmissionFiles((prev) => ({
                                              ...prev,
                                              [hw.id]: { name, data, type },
                                            }))
                                          )
                                        }
                                      />
                                    </label>
                                    {submissionFiles[hw.id] && (
                                      <div className="flex items-center space-x-2 font-mono text-xs text-ink bg-paper-light border border-line px-2.5 py-1 rounded-sm">
                                        <span>{submissionFiles[hw.id].name}</span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSubmissionFiles((prev) => {
                                              const copy = { ...prev };
                                              delete copy[hw.id];
                                              return copy;
                                            })
                                          }
                                          className="text-muted hover:text-attention"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Optional Note for Lead */}
                                <div className="space-y-1">
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                                    Optional Note for Lead
                                  </label>
                                  <input
                                    type="text"
                                    value={submissionNotes[hw.id] || ''}
                                    onChange={(e) =>
                                      setSubmissionNotes((prev) => ({
                                        ...prev,
                                        [hw.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="e.g. Added edge case handling for zero inputs."
                                    className="w-full p-2 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans"
                                  />
                                </div>

                                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
                                  {editingSubmissionMap[hw.id] && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSubmissionMap((prev) => ({
                                          ...prev,
                                          [hw.id]: false,
                                        }))
                                      }
                                      className="px-3 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleMemberSubmit(hw.id)}
                                    disabled={submittingMap[hw.id]}
                                    className="px-5 py-2 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    <span>
                                      {submittingMap[hw.id] ? 'Submitting...' : 'Submit Homework'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. ANSWER / SOLUTION SECTION */}
                          <div className="border border-line bg-paper rounded-sm p-4 space-y-2">
                            <span className="font-display text-sm font-bold text-ink block">
                              Answer / Solution
                            </span>
                            {hw.isSolutionPublished && hw.solutionText ? (
                              <div className="space-y-3 text-xs pt-1">
                                <div className="p-3.5 bg-paper-light border border-line rounded-sm space-y-1">
                                  <span className="font-mono text-[10px] uppercase font-bold text-accent block">
                                    Instructor Solution
                                  </span>
                                  <p className="text-ink font-mono whitespace-pre-wrap leading-relaxed">
                                    {hw.solutionText}
                                  </p>
                                </div>

                                {hw.solutionAttachmentData && (
                                  <div className="p-3 bg-paper-dark border border-line rounded-sm flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-4 h-4 text-accent" />
                                      <span className="font-mono text-xs font-semibold text-ink">
                                        {hw.solutionAttachmentName || 'Solution_Document'}
                                      </span>
                                    </div>
                                    <a
                                      href={hw.solutionAttachmentData}
                                      download={hw.solutionAttachmentName || 'Homework_Solution'}
                                      className="px-3 py-1 bg-paper border border-line hover:border-ink rounded-sm font-mono text-[11px] text-ink font-semibold flex items-center space-x-1"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download Solution</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-muted font-mono text-xs py-2">
                                Solution not published yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. PREVIOUS HOMEWORK (HISTORY) SECTION                                     */}
      {/* ========================================================================= */}
      <div className="border border-line bg-paper rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted" />
            <h2 className="font-display text-base font-bold text-ink">
              Previous Homework
            </h2>
          </div>
          <span className="font-mono text-xs text-muted">
            {previousHomeworkList.length} Archived
          </span>
        </div>

        {previousHomeworkList.length === 0 ? (
          <p className="text-muted font-mono text-xs py-4 text-center">
            No Previous Homework
          </p>
        ) : (
          <div className="divide-y divide-line text-xs">
            {previousHomeworkList.map((hw) => (
              <div key={hw.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-medium text-ink truncate">{hw.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-paper-dark border border-line rounded-xs text-muted">
                      {hw.subjectTopic}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted block">
                    Completed on {hw.dueDate}
                  </span>
                </div>

                <div className="shrink-0 flex items-center space-x-2 self-start sm:self-auto">
                  {isLead ? (
                    <>
                      <span className="font-mono text-[11px] text-muted">
                        {hw.submittedCount}/{hw.totalMembers} Submitted
                      </span>
                      <button
                        type="button"
                        onClick={() => setHomeworkToDelete(hw)}
                        className="p-1 hover:bg-red-500/10 border border-line hover:border-red-500/40 rounded-sm text-muted hover:text-red-600 transition-colors"
                        title="Delete Homework"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="font-mono text-[10px] text-accent font-bold">
                      {hw.myStatus || 'Completed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LEAD ADD / EDIT HOMEWORK MODAL                                            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        size="lg"
        kicker="CLASSWORK MANAGEMENT"
        title={editingHomework ? 'Edit Homework' : 'Add Homework'}
        subtitle="Assign technical questions, practice tasks, and guidelines to the crew."
        footer={
          <div className="flex items-center justify-between w-full">
            {editingHomework ? (
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setHomeworkToDelete(editingHomework);
                }}
                className="px-3.5 py-2 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete Homework</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveHomework(false)}
                disabled={savingHomework}
                className="px-4 py-2 text-xs font-semibold border border-line hover:border-line-dark hover:bg-paper-dark rounded-xl transition-all text-ink disabled:opacity-50 cursor-pointer"
              >
                {savingHomework ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveHomework(true)}
                disabled={savingHomework}
                className="px-5 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{savingHomework ? 'Publishing...' : 'Publish Homework'}</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Java If-Else Practice & Conditionals"
              className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all font-sans"
              autoFocus
            />
          </div>

          {/* Subject / Topic & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Subject / Topic
              </label>
              <input
                type="text"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g. Core Java — Control Flow"
                className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-2 p-3.5 bg-paper/60 border border-line rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Questions / Problem Statements <span className="text-red-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={handleAddQuestionField}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-2">
              {formQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-primary text-xs shrink-0 pt-2.5 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={q}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    placeholder={`Question ${idx + 1} statement or challenge requirements...`}
                    className="flex-1 p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all font-sans"
                  />
                  {formQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(idx)}
                      className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer mt-1"
                      title="Remove question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Optional Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Optional Guidelines / Hints
            </label>
            <textarea
              rows={2}
              value={formInstructions}
              onChange={(e) => setFormInstructions(e.target.value)}
              placeholder="e.g. Ensure O(n) complexity. Write unit tests covering edge cases..."
              className="w-full p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all font-sans"
            />
          </div>

          {/* Optional Attachment Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Optional Attachment (PDF, Image, Doc)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3.5 py-2 bg-paper-dark hover:bg-paper border border-line hover:border-line-dark rounded-xl text-xs font-semibold text-ink cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (name, data, type) => {
                      setFormAttachmentName(name);
                      setFormAttachmentData(data);
                      setFormAttachmentType(type);
                    })
                  }
                />
              </label>
              {formAttachmentName && (
                <div className="flex items-center gap-2 text-xs text-ink bg-paper-light border border-line px-3 py-1.5 rounded-xl font-mono">
                  <span>{formAttachmentName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormAttachmentName('');
                      setFormAttachmentData('');
                      setFormAttachmentType('');
                    }}
                    className="text-muted hover:text-red-600 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Optional Solution Draft */}
          <div className="space-y-2 p-3.5 bg-paper-dark/50 border border-line rounded-xl">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-ink">
                Official Answer / Solution (Draft)
              </label>
              <span className="text-[10px] text-muted">Kept private until published</span>
            </div>
            <textarea
              rows={3}
              value={formSolutionText}
              onChange={(e) => setFormSolutionText(e.target.value)}
              placeholder="Paste reference solution, code, or explanation here..."
              className="w-full p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all font-mono"
            />
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* LEAD REVIEW MEMBER SUBMISSION MODAL                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!reviewModalSubmission}
        onClose={() => setReviewModalSubmission(null)}
        size="md"
        kicker="SUBMISSION REVIEW"
        title={reviewModalSubmission?.memberStatus.name || 'Member Submission'}
        subtitle="Review member solution code, download attachments, and send constructive feedback."
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setReviewModalSubmission(null)}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReviewSubmit}
              disabled={submittingReview}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {submittingReview ? 'Saving...' : 'Mark Reviewed & Send Feedback'}
              </span>
            </button>
          </div>
        }
      >
        {reviewModalSubmission && (
          <div className="space-y-4 text-xs">
            {reviewModalSubmission.memberStatus.answerText && (
              <div className="p-3.5 bg-paper rounded-xl border border-line space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-muted block">
                  Typed Answer / Code
                </span>
                <p className="text-ink font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {reviewModalSubmission.memberStatus.answerText}
                </p>
              </div>
            )}

            {reviewModalSubmission.memberStatus.attachmentData && (
              <div className="p-3.5 bg-paper-dark/50 border border-line rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs font-semibold text-ink">
                    {reviewModalSubmission.memberStatus.attachmentName || 'Completed_Work'}
                  </span>
                </div>
                <a
                  href={reviewModalSubmission.memberStatus.attachmentData}
                  download={reviewModalSubmission.memberStatus.attachmentName || 'Completed_Work'}
                  className="px-3 py-1.5 bg-paper border border-line hover:border-line-dark rounded-lg font-mono text-xs text-ink font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {reviewModalSubmission.memberStatus.notes && (
              <div className="p-3 bg-paper-dark/30 border border-line/60 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-muted block uppercase">
                  Member's Note:
                </span>
                <p className="text-ink italic text-xs leading-relaxed">"{reviewModalSubmission.memberStatus.notes}"</p>
              </div>
            )}

            {/* Lead Feedback */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-ink">
                Instructor Review Feedback
              </label>
              <textarea
                rows={3}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Provide constructive feedback or guidance on their solution..."
                className="w-full p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all font-sans"
                autoFocus
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* LEAD PUBLISH ANSWER / SOLUTION MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!solutionModalHomework}
        onClose={() => setSolutionModalHomework(null)}
        size="md"
        kicker="SOLUTION RELEASE"
        title={`Publish Solution · ${solutionModalHomework?.title || ''}`}
        subtitle="Release the official solution and explanation to the full crew."
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setSolutionModalHomework(null)}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublishSolutionSubmit}
              disabled={submittingSolution}
              className="px-5 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{submittingSolution ? 'Publishing...' : 'Publish Solution'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Official Solution Explanation / Code
            </label>
            <textarea
              rows={6}
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              placeholder="Paste reference solution, code, or explanation..."
              className="w-full p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-none transition-all font-mono"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Solution File Attachment (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3.5 py-2 bg-paper-dark hover:bg-paper border border-line hover:border-line-dark rounded-xl text-xs font-semibold text-ink cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-primary" />
                <span>Choose Solution File</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt,.java"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, (name, data, type) => {
                      setSolutionFileName(name);
                      setSolutionFileData(data);
                      setSolutionFileType(type);
                    })
                  }
                />
              </label>
              {solutionFileName && (
                <div className="flex items-center gap-2 text-xs text-ink bg-paper-light border border-line px-3 py-1.5 rounded-xl font-mono">
                  <span>{solutionFileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSolutionFileName('');
                      setSolutionFileData('');
                      setSolutionFileType('');
                    }}
                    className="text-muted hover:text-red-600 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE HOMEWORK CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!homeworkToDelete}
        onClose={() => {
          setHomeworkToDelete(null);
          setDeleteHomeworkError(null);
        }}
        size="sm"
        kicker="DANGER ZONE"
        title="Delete Homework?"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              disabled={isDeletingHomework}
              onClick={() => {
                setHomeworkToDelete(null);
                setDeleteHomeworkError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper-dark/70 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingHomework}
              onClick={handleConfirmDeleteHomework}
              className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeletingHomework ? 'Deleting...' : 'Delete Homework'}</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-muted leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-ink font-bold">{homeworkToDelete?.title}</strong>? All student submissions, files, and review history will be permanently erased.
          </p>

          {deleteHomeworkError && (
            <div className="p-3 border border-red-300 bg-red-50 text-red-900 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{deleteHomeworkError}</span>
            </div>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};
