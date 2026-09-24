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
  Eye,
  Bell,
  Check,
  BookOpen,
  Trash2,
  AlertCircle,
  Edit3,
  Search,
  CheckCircle2,
  Users,
  Copy,
  CheckCheck,
  FileCheck,
} from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';
import { Modal } from '../../components/common/Modal';
const STARTER_TEMPLATES = [
  {
    id: 'java-core',
    topic: 'Core Java',
    badge: 'OOP & Architecture',
    title: 'Polymorphism, Interfaces & Error Handling',
    description: 'Design robust abstractions using interfaces, dynamic dispatch, and clean exception hierarchies.',
    questions: [
      'Design a PaymentGateway interface with methods processPayment(double amount) and refund(String txId). Implement two concrete providers: StripeGateway and PayPalGateway.',
      'Explain Dynamic Method Dispatch in Java and write a short snippet demonstrating runtime polymorphism with an overridden calculateFee() method.',
      'Create a custom PaymentProcessingException and implement try-with-resources to ensure database or connection handles are closed safely.',
    ],
    instructions: 'Focus on clean separation of concerns. Do not use raw types. Add unit test assertions or edge case checks in comments.',
    color: 'emerald',
  },
  {
    id: 'dsa-algo',
    topic: 'DSA & Algorithms',
    badge: 'Two Pointers & Arrays',
    title: 'Optimal Two Pointers & Subarray Sliding Window',
    description: 'Master in-place array manipulation, boundary pointers, and frequency maps in O(n) optimal time.',
    questions: [
      'Solve the Container With Most Water problem in O(n) time and O(1) auxiliary space. Explain why the shorter boundary line must be moved inward at each step.',
      'Given an array of integers and target sum S, find the minimal length of a contiguous subarray whose sum is greater than or equal to S using a dynamic sliding window.',
      'Implement 3Sum without generating duplicate triplets in the output list. Analyze the time complexity compared to brute-force O(n³).',
    ],
    instructions: 'Aim for O(n) or O(n log n) optimal complexity. Write comments detailing your invariants and loop termination conditions.',
    color: 'amber',
  },
  {
    id: 'spring-boot',
    topic: 'Spring Boot',
    badge: 'REST APIs & JPA',
    title: 'REST Architecture, Validation & Global Exception Handling',
    description: 'Build enterprise RESTful endpoints with input validation, transactional service methods, and @ControllerAdvice.',
    questions: [
      'Build a @RestController for Task resources with GET (paginated), POST (with @Valid request body), and DELETE endpoints.',
      'Implement a @ControllerAdvice class that catches MethodArgumentNotValidException and returns clean field-level error response schemas.',
      'Explain the difference between @Transactional(readOnly = true) vs default read-write propagation in Spring Data JPA queries.',
    ],
    instructions: 'Use constructor injection with Lombok @RequiredArgsConstructor. Return standard HTTP status codes (200, 201, 204, 400, 404).',
    color: 'purple',
  },
  {
    id: 'database-sql',
    topic: 'Databases & SQL',
    badge: 'Indexing & Queries',
    title: 'PostgreSQL Indexing, Window Functions & CTEs',
    description: 'Analyze real-world database queries, formulate window functions, and optimize query plans with indexing strategies.',
    questions: [
      'Write a query using ROW_NUMBER() or DENSE_RANK() to retrieve the top 3 highest-scoring members for each team over the past 30 days.',
      'Explain when a B-Tree index scan is preferred over a sequential scan, and how composite index column order affects query planner selectivity.',
      'Write a Common Table Expression (CTE) to calculate running daily task completion totals and cumulative percentages.',
    ],
    instructions: 'Write standard PostgreSQL syntax. Include comments indicating which indexes are required for optimal execution performance.',
    color: 'blue',
  },
];

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

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archived' | 'all'>('active');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  const handleCopyQuestion = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedQuestionId(key);
      setTimeout(() => setCopiedQuestionId(null), 2000);
    } catch {}
  };

  const handleApplyTemplate = (tpl: (typeof STARTER_TEMPLATES)[0]) => {
    setEditingHomework(null);
    setFormTitle(tpl.title);
    setFormTopic(tpl.topic);
    setFormInstructions(tpl.instructions);
    setFormQuestions([...tpl.questions]);
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);
    setFormDueDate(inThreeDays.toISOString().substring(0, 10));
    setFormAttachmentName('');
    setFormAttachmentData('');
    setFormAttachmentType('');
    setFormSolutionText('');
    setFormSolutionAttachmentName('');
    setFormSolutionAttachmentData('');
    setFormSolutionAttachmentType('');
    setAddModalOpen(true);
  };

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

  // Live Metrics Calculation
  const totalCount = homeworkList.length;
  const activeCount = activeHomeworkList.length;
  const archivedCount = previousHomeworkList.length;

  const pendingReviewCount = homeworkList.reduce((acc, hw) => {
    const unreviewed = hw.memberSubmissions?.filter((s) => s.status === 'Submitted').length || 0;
    return acc + unreviewed;
  }, 0);

  const dueSoonCount = activeHomeworkList.filter((hw) => {
    if (!hw.dueDate) return false;
    const diffDays = Math.ceil(
      (new Date(hw.dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 2 || hw.isOverdue;
  }).length;

  const distinctTopics = Array.from(
    new Set(homeworkList.map((hw) => hw.subjectTopic).filter(Boolean))
  );

  const listToFilter =
    activeTab === 'active'
      ? activeHomeworkList
      : activeTab === 'archived'
      ? previousHomeworkList
      : homeworkList;

  const filteredHomeworkList = listToFilter.filter((hw) => {
    const matchesTopic =
      selectedTopic === 'ALL' || hw.subjectTopic?.toLowerCase() === selectedTopic.toLowerCase();
    if (!matchesTopic) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = hw.title?.toLowerCase().includes(q);
    const matchesSubject = hw.subjectTopic?.toLowerCase().includes(q);
    const matchesQuestions = hw.questions?.some((quest) => quest.toLowerCase().includes(q));
    const matchesInstructions = hw.instructions?.toLowerCase().includes(q);
    return matchesTitle || matchesSubject || matchesQuestions || matchesInstructions;
  });

  return (
    <PageContainer width="default" className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. MINIMAL PAGE HEADER                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-line">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
              Homework & Practice
            </h1>
            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-paper-dark border border-line text-muted">
              {activeCount} active
            </span>
            {dueSoonCount > 0 && (
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700">
                {dueSoonCount} due soon
              </span>
            )}
            {isLead && pendingReviewCount > 0 && (
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary">
                {pendingReviewCount} pending review
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {isLead
              ? 'Assign technical practice questions, track crew submissions, and release solution guides.'
              : 'Core technical questions and practice tasks assigned by your Team Lead.'}
          </p>
        </div>

        {isLead && (
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Homework</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-attention/10 border border-attention text-xs text-attention rounded-xl flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MINIMAL UNIFIED TOOLBAR: TABS + SEARCH                                  */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented View Tabs */}
          <div className="inline-flex p-1 bg-paper-dark border border-line rounded-xl gap-1 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-paper text-ink shadow-2xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'archived'
                  ? 'bg-paper text-ink shadow-2xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Archived ({archivedCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-paper text-ink shadow-2xs font-bold'
                  : 'text-muted hover:text-ink'
              }`}
            >
              All ({totalCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search homework or questions..."
              className="w-full pl-8 pr-8 py-2 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Topic Filters (if multiple exist) */}
        {distinctTopics.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedTopic('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedTopic === 'ALL'
                  ? 'bg-ink text-paper shadow-2xs'
                  : 'bg-paper border border-line text-muted hover:text-ink'
              }`}
            >
              All Topics
            </button>
            {distinctTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedTopic.toLowerCase() === topic.toLowerCase()
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'bg-paper border border-line text-muted hover:text-ink'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. ASSIGNMENTS FEED                                                       */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredHomeworkList.length === 0 ? (
          searchQuery || selectedTopic !== 'ALL' ? (
            /* Search / Filter yielded no results */
            <div className="border border-line bg-paper rounded-2xl p-8 text-center space-y-3 shadow-2xs max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-paper-dark border border-line flex items-center justify-center mx-auto text-muted">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink">No Matching Homework</h3>
              <p className="text-xs text-muted">
                No assignments match your search query or topic filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTopic('ALL');
                }}
                className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink rounded-lg text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : activeTab === 'archived' ? (
            /* Empty Archive */
            <div className="border border-line bg-paper rounded-2xl p-8 text-center space-y-2 shadow-2xs max-w-lg mx-auto">
              <div className="w-10 h-10 rounded-xl bg-paper-dark border border-line flex items-center justify-center mx-auto text-muted">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink">No Archived Homework</h3>
              <p className="text-xs text-muted">
                Completed assignments will appear here once their due dates have passed.
              </p>
            </div>
          ) : (
            /* Minimal Clean Empty State */
            <div className="border border-line bg-paper rounded-2xl p-8 sm:p-10 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-xl bg-paper-dark border border-line flex items-center justify-center mx-auto text-muted">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-ink">
                  {isLead ? 'No Active Homework' : 'All Caught Up!'}
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  {isLead
                    ? 'No homework assignments are currently active for your crew.'
                    : "Your lead hasn't posted any active assignments yet. Check back soon!"}
                </p>
              </div>

              {isLead && (
                <div className="space-y-4 pt-1">
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Homework</span>
                  </button>

                  {/* Compact Quick Templates */}
                  <div className="pt-3 border-t border-line/70">
                    <span className="text-[11px] text-muted block mb-2 font-medium">
                      Or start quickly from a template:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {STARTER_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="px-2.5 py-1 bg-paper-light hover:bg-paper-dark border border-line rounded-lg text-xs text-ink font-medium transition-all hover:border-line-dark cursor-pointer inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span>{tpl.topic}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {filteredHomeworkList.map((hw) => {
              const isExpanded = !!expandedHomework[hw.id];
              const isOverdue = hw.isOverdue;

              return (
                <div
                  key={hw.id}
                  className="border border-line hover:border-line-dark bg-paper rounded-2xl overflow-hidden shadow-xs hover:shadow-card transition-all duration-200"
                >
                  {/* Card Top Summary Bar */}
                  <div
                    onClick={() => toggleAccordion(hw.id)}
                    className="relative p-4 sm:p-5 bg-paper hover:bg-paper-light/50 cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors select-none"
                  >
                    {/* Left Urgency Color Stripe */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        isOverdue
                          ? 'bg-red-500'
                          : hw.dueDate === todayStr
                          ? 'bg-amber-500'
                          : hw.isPublished
                          ? 'bg-primary'
                          : 'bg-muted/30'
                      }`}
                    />

                    <div className="space-y-1.5 min-w-0 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          {hw.subjectTopic}
                        </span>

                        <h3 className="font-display text-base font-bold text-ink truncate">
                          {hw.title}
                        </h3>

                        {isLead ? (
                          hw.isPublished ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Published
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Draft
                            </span>
                          )
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              hw.myStatus === 'Reviewed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : hw.myStatus === 'Submitted'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : hw.myStatus === 'Overdue'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-paper-dark text-muted border-line'
                            }`}
                          >
                            {hw.myStatus === 'Reviewed'
                              ? '✓ Reviewed'
                              : hw.myStatus === 'Submitted'
                              ? '✓ Submitted'
                              : hw.myStatus || 'Not Submitted'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            isOverdue
                              ? 'text-red-600 font-semibold'
                              : hw.dueDate === todayStr
                              ? 'text-amber-600 font-semibold'
                              : ''
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Due: {hw.dueDate || 'No Due Date'}
                            {isOverdue && ' (Overdue)'}
                            {hw.dueDate === todayStr && ' (Due Today)'}
                          </span>
                        </span>
                        <span>·</span>
                        <span>{hw.questions.length} Questions</span>

                        {isLead && (
                          <>
                            <span>·</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-paper-dark rounded-full overflow-hidden border border-line">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{
                                    width: `${Math.round(
                                      ((hw.submittedCount || 0) / Math.max(hw.totalMembers || 1, 1)) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="font-semibold text-ink text-[11px]">
                                {hw.submittedCount || 0}/{hw.totalMembers || 0} Submitted (
                                {Math.round(
                                  ((hw.submittedCount || 0) / Math.max(hw.totalMembers || 1, 1)) * 100
                                )}
                                %)
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto pl-2">
                      {isLead && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddModal(hw);
                            }}
                            className="p-2 hover:bg-paper-dark border border-line hover:border-line-dark rounded-xl text-muted hover:text-ink transition-colors cursor-pointer shadow-2xs"
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
                            className="p-2 hover:bg-red-50 border border-line hover:border-red-300 rounded-xl text-muted hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                            title="Delete Homework"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <div className="p-2 text-muted">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-ink' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 space-y-6 text-xs font-sans border-t border-line bg-surface/30">
                      {/* Reminder banner for member */}
                      {!isLead &&
                        hw.isReminded &&
                        hw.myStatus !== 'Submitted' &&
                        hw.myStatus !== 'Reviewed' && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded-xl flex items-center space-x-2.5">
                            <Bell className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>
                              <strong>Reminder from Lead:</strong> Your homework is due soon. Please submit your work.
                            </span>
                          </div>
                        )}

                      {/* Instructions & Guidelines */}
                      {hw.instructions && (
                        <div className="p-4 bg-paper border border-line rounded-xl space-y-1.5 shadow-2xs">
                          <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                            Assignment Guidelines & Hints
                          </span>
                          <p className="text-ink text-xs leading-relaxed whitespace-pre-wrap">
                            {hw.instructions}
                          </p>
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                            Questions / Problem Statements ({hw.questions.length})
                          </span>
                          <span className="text-[11px] text-muted">Click copy to save to clipboard</span>
                        </div>

                        <div className="space-y-2.5">
                          {hw.questions.map((q, idx) => {
                            const copyKey = `${hw.id}-${idx}`;
                            const isCopied = copiedQuestionId === copyKey;

                            return (
                              <div
                                key={idx}
                                className="group relative flex items-start justify-between gap-3 p-3.5 rounded-xl border border-line bg-paper shadow-2xs hover:border-line-dark transition-all"
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <span className="font-mono font-bold text-primary text-xs shrink-0 pt-0.5 w-5 text-right">
                                    {idx + 1}.
                                  </span>
                                  <p className="text-ink font-medium leading-relaxed text-xs">
                                    {q}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleCopyQuestion(q, copyKey)}
                                  className="p-1.5 rounded-lg border border-line hover:border-line-dark text-muted hover:text-ink transition-colors cursor-pointer shrink-0"
                                  title="Copy Question"
                                >
                                  {isCopied ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Lead Attachment (if any) */}
                      {hw.attachmentData && (
                        <div className="p-4 border border-line rounded-xl bg-paper shadow-2xs flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-ink block">
                                {hw.attachmentName || 'Classwork_Material'}
                              </span>
                              <span className="text-[11px] text-muted">
                                Resource file provided by Team Lead
                              </span>
                            </div>
                          </div>
                          <a
                            href={hw.attachmentData}
                            download={hw.attachmentName || 'Homework_Attachment'}
                            className="px-3.5 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-line-dark rounded-xl text-xs text-ink font-semibold flex items-center space-x-1.5 transition-all shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5 text-primary" />
                            <span>Download</span>
                          </a>
                        </div>
                      )}

                      {/* ======================================================= */}
                      {/* LEAD MANAGEMENT SECTION                                 */}
                      {/* ======================================================= */}
                      {isLead ? (
                        <div className="space-y-4 pt-4 border-t border-line/80">
                          {/* Solution Action Bar */}
                          <div className="p-4 bg-paper-light/70 border border-line/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="font-display text-xs sm:text-sm font-bold text-ink block">
                                  Official Instructor Solution
                                </span>
                                <p className="text-[11px] text-muted leading-tight mt-0.5">
                                  {hw.isSolutionPublished
                                    ? 'Solution guide is currently visible to all crew members.'
                                    : 'Keep solution private until members submit their work.'}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleOpenSolutionModal(hw)}
                              className={`px-4 py-2 font-mono text-xs font-semibold rounded-xl border transition-all duration-150 flex items-center justify-center space-x-2 shrink-0 cursor-pointer shadow-2xs ${
                                hw.isSolutionPublished
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
                                  : 'bg-primary hover:bg-primary-hover text-white border-transparent'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {hw.isSolutionPublished
                                  ? '✓ Solution Published (Edit)'
                                  : 'Publish Answer / Solution'}
                              </span>
                            </button>
                          </div>

                          {/* Member Submissions Tracker Table */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-0.5">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
                                  Team Submissions ({hw.submittedCount}/{hw.totalMembers})
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-muted bg-paper-dark px-2.5 py-0.5 rounded-full border border-line">
                                {hw.reviewedCount} Reviewed
                              </span>
                            </div>

                            {/* Member Submissions Tracker: Desktop Table (hidden md:block) */}
                            <div className="hidden md:block border border-line/80 rounded-xl overflow-hidden shadow-2xs bg-paper">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-line bg-paper-light/80 font-mono text-[11px] text-muted">
                                    <th className="p-3 pl-4">Member</th>
                                    <th className="p-3 text-center">Status</th>
                                    <th className="p-3">Submitted At</th>
                                    <th className="p-3 pr-4 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-line/70 font-sans">
                                  {hw.memberSubmissions?.map((m) => {
                                    const isReminded =
                                      m.isReminded || remindedMembersMap[`${hw.id}-${m.userId}`];

                                    return (
                                      <tr
                                        key={m.userId}
                                        className="hover:bg-paper-light/50 transition-colors"
                                      >
                                        <td className="p-3 pl-4">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                              {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <span className="font-semibold text-ink block truncate">
                                                {m.name}
                                              </span>
                                              <span className="font-mono text-[10px] text-muted truncate block">
                                                {m.email}
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        <td className="p-3 text-center">
                                          <span
                                            className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold border inline-block ${
                                              m.status === 'Reviewed'
                                                ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                                                : m.status === 'Submitted'
                                                ? 'bg-primary/10 text-primary border-primary/30'
                                                : m.status === 'Overdue'
                                                ? 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                                                : 'bg-paper-dark text-muted border-line'
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

                                        <td className="p-3 pr-4 text-right">
                                          {m.isSubmitted ? (
                                            <button
                                              onClick={() => handleOpenReviewModal(hw.id, m)}
                                              className="px-3 py-1.5 bg-paper hover:bg-paper-light border border-line hover:border-primary rounded-lg font-mono text-xs font-semibold text-ink transition-all inline-flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-primary" />
                                              <span>{m.isReviewed ? 'View Work' : 'Review'}</span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleRemindMember(hw.id, m.userId)}
                                              disabled={isReminded}
                                              className={`px-3 py-1.5 border rounded-lg font-mono text-xs transition-all inline-flex items-center space-x-1.5 ${
                                                isReminded
                                                  ? 'border-line bg-paper-dark text-muted/60 cursor-default'
                                                  : 'border-line bg-paper hover:border-line-dark hover:bg-paper-light text-ink cursor-pointer'
                                              }`}
                                            >
                                              <Bell className="w-3 h-3 text-muted" />
                                              <span>{isReminded ? 'Reminded' : 'Send Reminder'}</span>
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
                                    className="p-3.5 bg-paper border border-line/80 rounded-xl space-y-2.5 shadow-2xs"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                          {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="font-semibold text-ink block text-xs truncate">
                                            {m.name}
                                          </span>
                                          <span className="font-mono text-[10px] text-muted truncate block">
                                            {m.email}
                                          </span>
                                        </div>
                                      </div>
                                      <span
                                        className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                          m.status === 'Reviewed'
                                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                                            : m.status === 'Submitted'
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : m.status === 'Overdue'
                                            ? 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                                            : 'bg-paper text-muted border-line'
                                        }`}
                                      >
                                        {m.status}
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-line/60">
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
                                          className="px-2.5 py-1 bg-paper border border-line hover:border-primary rounded-lg font-mono text-[11px] font-medium text-ink transition-colors inline-flex items-center space-x-1"
                                        >
                                          <Eye className="w-3 h-3 text-primary" />
                                          <span>{m.isReviewed ? 'View' : 'Review'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleRemindMember(hw.id, m.userId)}
                                          disabled={isReminded}
                                          className={`px-2.5 py-1 border rounded-lg font-mono text-[11px] transition-colors inline-flex items-center space-x-1 ${
                                            isReminded
                                              ? 'border-line bg-paper-dark text-muted cursor-default'
                                              : 'border-line bg-paper hover:border-line-dark text-ink'
                                          }`}
                                        >
                                          <Bell className="w-3 h-3 text-muted" />
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
                                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Publish Homework to Crew</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ======================================================= */
                        /* MEMBER SUBMISSION & SOLUTION VIEW                       */
                        /* ======================================================= */
                        <div className="space-y-4 pt-4 border-t border-line/80">
                          {/* 1. YOUR SUBMISSION */}
                          <div className="border border-line/80 bg-paper rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-line/70 pb-3">
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-primary" />
                                <span className="font-display text-sm font-bold text-ink">
                                  Your Submission
                                </span>
                              </div>
                              {hw.mySubmission && (
                                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>
                                    Submitted{' '}
                                    {new Date(hw.mySubmission.submittedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </span>
                              )}
                            </div>

                            {hw.mySubmission && !editingSubmissionMap[hw.id] ? (
                              /* Display Submitted Work */
                              <div className="space-y-3 text-xs">
                                {hw.mySubmission.answerText && (
                                  <div className="p-3.5 bg-paper-light/60 border border-line/80 rounded-xl space-y-1.5">
                                    <span className="font-mono text-[10px] uppercase font-bold text-muted block tracking-wider">
                                      Your Typed Answer / Solution
                                    </span>
                                    <p className="text-ink font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                      {hw.mySubmission.answerText}
                                    </p>
                                  </div>
                                )}

                                {hw.mySubmission.attachmentData && (
                                  <div className="p-3.5 bg-paper-light/60 border border-line/80 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-primary" />
                                      </div>
                                      <span className="font-mono text-xs font-semibold text-ink truncate">
                                        {hw.mySubmission.attachmentName || 'My_Completed_Work'}
                                      </span>
                                    </div>
                                    <a
                                      href={hw.mySubmission.attachmentData}
                                      download={hw.mySubmission.attachmentName || 'My_Work'}
                                      className="px-3 py-1.5 bg-paper border border-line hover:border-primary rounded-lg font-mono text-xs text-ink font-semibold flex items-center space-x-1.5 shadow-2xs hover:bg-paper-light transition-all shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                )}

                                {hw.mySubmission.leadFeedback && (
                                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5">
                                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                                      Lead Feedback & Evaluation:
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
                                    className="px-4 py-2 border border-line hover:border-line-dark bg-paper hover:bg-paper-light font-mono text-xs rounded-xl text-ink font-semibold transition-all shadow-2xs cursor-pointer"
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
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block tracking-wider">
                                    Option 1 — Type Solution / Java Code
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
                                    placeholder="Write your code, solution, explanations, or approach here..."
                                    className="w-full p-3.5 bg-paper-light/50 border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono placeholder:font-sans placeholder:text-muted/60 transition-all"
                                  />
                                </div>

                                {/* Option 2: Upload Completed Work */}
                                <div className="space-y-1.5">
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block tracking-wider">
                                    Option 2 — Upload File (PDF, Image, Doc, Code)
                                  </label>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <label className="px-4 py-2 bg-paper border border-line hover:border-primary rounded-xl font-mono text-xs font-semibold text-ink cursor-pointer flex items-center space-x-2 transition-all shadow-2xs hover:bg-paper-light">
                                      <Upload className="w-3.5 h-3.5 text-primary" />
                                      <span>Choose Work File</span>
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
                                      <div className="flex items-center space-x-2 font-mono text-xs text-ink bg-paper-light border border-line px-3 py-1.5 rounded-xl">
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
                                          className="text-muted hover:text-red-500 cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Optional Note for Lead */}
                                <div className="space-y-1">
                                  <label className="font-mono text-[11px] font-bold text-muted uppercase block tracking-wider">
                                    Optional Note for Team Lead
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
                                    placeholder="e.g. Completed questions 1-3, implemented two pointer approach."
                                    className="w-full p-2.5 bg-paper-light/50 border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans transition-all"
                                  />
                                </div>

                                <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-line/70">
                                  {editingSubmissionMap[hw.id] && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingSubmissionMap((prev) => ({
                                          ...prev,
                                          [hw.id]: false,
                                        }))
                                      }
                                      className="px-4 py-2 border border-line text-muted hover:text-ink font-mono text-xs rounded-xl hover:bg-paper-light transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleMemberSubmit(hw.id)}
                                    disabled={submittingMap[hw.id]}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 disabled:opacity-50 shadow-xs cursor-pointer"
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
                          <div className="border border-line/80 bg-paper rounded-xl p-4 sm:p-5 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-line/70 pb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                <span className="font-display text-sm font-bold text-ink">
                                  Instructor Answer & Solution
                                </span>
                              </div>
                              {hw.isSolutionPublished && (
                                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                  Official Release
                                </span>
                              )}
                            </div>

                            {hw.isSolutionPublished && hw.solutionText ? (
                              <div className="space-y-3 text-xs pt-1">
                                <div className="p-4 bg-paper-light/60 border border-line/80 rounded-xl space-y-1.5">
                                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">
                                    Solution Guide & Code
                                  </span>
                                  <p className="text-ink font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                    {hw.solutionText}
                                  </p>
                                </div>

                                {hw.solutionAttachmentData && (
                                  <div className="p-3.5 bg-paper-light/60 border border-line/80 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center space-x-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                      </div>
                                      <span className="font-mono text-xs font-semibold text-ink truncate">
                                        {hw.solutionAttachmentName || 'Solution_Document'}
                                      </span>
                                    </div>
                                    <a
                                      href={hw.solutionAttachmentData}
                                      download={hw.solutionAttachmentName || 'Homework_Solution'}
                                      className="px-3.5 py-1.5 bg-paper border border-line hover:border-emerald-500/50 rounded-lg font-mono text-xs text-ink font-semibold flex items-center space-x-1.5 shadow-2xs hover:bg-paper-light transition-all shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download Guide</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-paper-light/40 border border-dashed border-line rounded-xl text-center">
                                <p className="text-muted font-mono text-xs">
                                  Instructor solution has not been released yet. It will appear here once published by your Team Lead.
                                </p>
                              </div>
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
              className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all font-sans"
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
                className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none transition-all font-sans"
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
                className="w-full px-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-ink outline-none transition-all font-mono"
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
                    rows={3}
                    value={q}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    placeholder={`Question ${idx + 1} statement or challenge requirements...`}
                    className="flex-1 p-2.5 bg-paper border border-line focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl text-xs text-ink placeholder:text-muted/60 outline-none resize-y min-h-[60px] transition-all font-sans"
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
