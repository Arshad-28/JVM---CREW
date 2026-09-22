import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  SessionDetail,
  SessionSummary,
  CoachChatMessage,
  MockInterviewState,
  HistoryItem,
  InterviewDifficulty,
  CodingSolution,
} from '../../types';
import {
  GraduationCap,
  BookOpen,
  Code,
  MessageSquare,
  Mic,
  ArrowRight,
  Send,
  AlertCircle,
  Lightbulb,
  RotateCcw,
  TrendingUp,
  CheckSquare,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Zap,
  ChevronRight,
  Clock,
  Layers,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { PageContainer } from '../../components/common/PageContainer';

interface InterviewLabPageProps {
  initialTopic?: string;
}

export const InterviewLabPage: React.FC<InterviewLabPageProps> = ({ initialTopic = '' }) => {
  const { user } = useAuth();

  // Input & Generation State
  const [topicInput, setTopicInput] = useState(initialTopic);
  const [technology, setTechnology] = useState('Auto Detect');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('BEGINNER');
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Session State
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'practice' | 'mock' | 'coding' | 'coach'>('learn');

  // Dashboard Data State
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Practice Interactive State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [submittingPractice, setSubmittingPractice] = useState<Record<number, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  // Mock Interview State
  const [activeMock, setActiveMock] = useState<MockInterviewState | null>(null);
  const [mockAnswerInput, setMockAnswerInput] = useState('');
  const [submittingMock, setSubmittingMock] = useState(false);
  const [startingMock, setStartingMock] = useState(false);

  // Coding State
  const [codeInputs, setCodeInputs] = useState<Record<number, string>>({});
  const [submittingCode, setSubmittingCode] = useState<Record<number, boolean>>({});
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [generatingProblem, setGeneratingProblem] = useState(false);
  const [revealedHintsMap, setRevealedHintsMap] = useState<Record<number, string[]>>({});
  const [loadingHintMap, setLoadingHintMap] = useState<Record<number, boolean>>({});
  const [revealedSolutionMap, setRevealedSolutionMap] = useState<Record<number, CodingSolution | null>>({});
  const [loadingSolutionMap, setLoadingSolutionMap] = useState<Record<number, boolean>>({});
  const [showSolutionMap, setShowSolutionMap] = useState<Record<number, boolean>>({});

  // Ask Coach State
  const [coachInput, setCoachInput] = useState('');
  const [sendingCoach, setSendingCoach] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [sessions, userHistory] = await Promise.all([
        api.getInterviewSessions(6),
        api.getInterviewHistory(),
      ]);
      setRecentSessions(sessions);
      setHistory(userHistory);
    } catch (err) {
      console.error('Failed to load interview lab dashboard:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Handle incoming initial topic
  useEffect(() => {
    if (initialTopic && initialTopic.trim().length > 0) {
      setTopicInput(initialTopic);
    }
  }, [initialTopic]);

  // Handle Topic Generation
  const handleGenerateSession = async (customPrompt?: string) => {
    const promptToUse = customPrompt || topicInput;
    if (!promptToUse.trim()) {
      setErrorMessage('Please enter what you want to learn or practice.');
      return;
    }

    setGenerating(true);
    setErrorMessage(null);

    const lower = promptToUse.toLowerCase();
    const isCodingRequest = lower.includes('coding') || lower.includes('code for') || lower.includes('write a program') || lower.includes('write a java program') || lower.includes('write code') || lower.includes('coding problem') || lower.includes('coding challenge');
    const isMockRequest = lower.includes('mock interview') || lower.includes('interview me') || lower.includes('take a mock');
    const isPracticeRequest = lower.includes('interview questions') || lower.includes('practice questions') || lower.includes('quiz');

    try {
      let session = await api.createInterviewSession({
        userInput: promptToUse.trim(),
        technology: technology === 'Auto Detect' ? '' : technology,
        difficulty,
      });

      if (isCodingRequest) {
        try {
          const problem = await api.generateCodingProblem(session.id);
          if (problem) {
            session = { ...session, codingProblems: [...session.codingProblems, problem] };
          }
        } catch (e) {
          console.warn('Auto coding generation:', e);
        }
        setActiveSession(session);
        setActiveTab('coding');
      } else if (isPracticeRequest) {
        try {
          const questions = await api.generatePracticeQuestions(session.id);
          if (questions) {
            session = { ...session, practiceQuestions: questions };
          }
        } catch (e) {
          console.warn('Auto practice generation:', e);
        }
        setActiveSession(session);
        setActiveTab('practice');
      } else if (isMockRequest) {
        setActiveSession(session);
        setActiveTab('mock');
        handleStartMockForSession(session);
      } else {
        setActiveSession(session);
        setActiveTab('learn');
      }

      fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate session. Please check your prompt.');
    } finally {
      setGenerating(false);
    }
  };

  // Open existing session
  const handleOpenSession = async (sessionId: number) => {
    try {
      const session = await api.getInterviewSession(sessionId);
      setActiveSession(session);
      setActiveTab('learn');
      setActiveMock(null);
    } catch (err: any) {
      alert('Failed to open session: ' + err.message);
    }
  };

  // Practice Questions: Submit Answer
  const handleSubmitPractice = async (questionId: number) => {
    const answer = practiceAnswers[questionId];
    if (!answer || !answer.trim()) return;

    setSubmittingPractice((prev) => ({ ...prev, [questionId]: true }));
    try {
      const attempt = await api.submitPracticeAnswer(questionId, answer.trim());
      if (activeSession) {
        const updatedQuestions = activeSession.practiceQuestions.map((q) =>
          q.id === questionId ? { ...q, latestAttempt: attempt } : q
        );
        setActiveSession({ ...activeSession, practiceQuestions: updatedQuestions });
      }
    } catch (err: any) {
      alert('Practice evaluation error: ' + err.message);
    } finally {
      setSubmittingPractice((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Mock Interview: Start Mock
  const handleStartMockForSession = async (sessionParam: SessionDetail) => {
    setStartingMock(true);
    try {
      const mockState = await api.startMockInterview({
        topic: sessionParam.topic,
        technology: sessionParam.technology || 'Java',
        difficulty: sessionParam.difficulty,
      });
      setActiveMock(mockState);
      setActiveTab('mock');
    } catch (err: any) {
      alert('Failed to start mock interview: ' + err.message);
    } finally {
      setStartingMock(false);
    }
  };

  const handleStartMock = async () => {
    if (!activeSession) return;
    await handleStartMockForSession(activeSession);
  };

  // Mock Interview: Submit Turn Answer
  const handleSubmitMockTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMock || !mockAnswerInput.trim()) return;

    setSubmittingMock(true);
    try {
      const updatedMock = await api.submitMockAnswer(activeMock.id, mockAnswerInput.trim());
      setActiveMock(updatedMock);
      setMockAnswerInput('');
      fetchDashboardData();
    } catch (err: any) {
      alert('Mock interview evaluation error: ' + err.message);
    } finally {
      setSubmittingMock(false);
    }
  };

  // Coding Practice: Submit Code
  const handleSubmitCode = async (problemId: number) => {
    const code = codeInputs[problemId];
    if (!code || !code.trim()) return;

    setSubmittingCode((prev) => ({ ...prev, [problemId]: true }));
    try {
      const review = await api.reviewCode(problemId, code, activeSession?.technology || 'JAVA');
      if (activeSession) {
        const updatedProblems = activeSession.codingProblems.map((p) =>
          p.id === problemId ? { ...p, latestAttempt: review } : p
        );
        setActiveSession({ ...activeSession, codingProblems: updatedProblems });
      }
    } catch (err: any) {
      alert('Code review error: ' + err.message);
    } finally {
      setSubmittingCode((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  // Coding Practice: Get Progressive Hint
  const handleGetCodingHint = async (problemId: number) => {
    const currentHints = revealedHintsMap[problemId] || [];
    const nextIdx = currentHints.length + 1;
    setLoadingHintMap((prev) => ({ ...prev, [problemId]: true }));
    try {
      const res = await api.getCodingHint(problemId, nextIdx);
      if (res && res.hint) {
        setRevealedHintsMap((prev) => ({
          ...prev,
          [problemId]: [...(prev[problemId] || []), res.hint],
        }));
      }
    } catch (err: any) {
      alert('Failed to get hint: ' + err.message);
    } finally {
      setLoadingHintMap((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  // Coding Practice: Toggle Solution Visibility (Zero Penalty)
  const handleToggleCodingSolution = async (problemId: number) => {
    if (showSolutionMap[problemId]) {
      setShowSolutionMap((prev) => ({ ...prev, [problemId]: false }));
      return;
    }

    setShowSolutionMap((prev) => ({ ...prev, [problemId]: true }));

    if (revealedSolutionMap[problemId]) {
      setTimeout(() => {
        const solEl = document.getElementById(`solution-card-${problemId}`);
        if (solEl) solEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    setLoadingSolutionMap((prev) => ({ ...prev, [problemId]: true }));
    try {
      const solution = await api.revealCodingSolution(problemId);
      setRevealedSolutionMap((prev) => ({ ...prev, [problemId]: solution }));
      setTimeout(() => {
        const solEl = document.getElementById(`solution-card-${problemId}`);
        if (solEl) solEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      alert('Failed to reveal solution: ' + err.message);
      setShowSolutionMap((prev) => ({ ...prev, [problemId]: false }));
    } finally {
      setLoadingSolutionMap((prev) => ({ ...prev, [problemId]: false }));
    }
  };

  const handleHideCodingSolution = (problemId: number) => {
    setShowSolutionMap((prev) => ({ ...prev, [problemId]: false }));
  };

  const handleTryAgain = (problemId: number) => {
    const editor = document.getElementById(`code-editor-${problemId}`) as HTMLTextAreaElement | null;
    if (editor) {
      editor.focus();
      editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getReviewBadge = (status: string, score: number) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Accepted · {score}/100</span>
          </span>
        );
      case 'SYNTAX_OR_COMPILATION_ERROR':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-800 rounded-lg flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Syntax / Compilation Error · {score}/100</span>
          </span>
        );
      case 'MISUNDERSTOOD_REQUIREMENTS':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-900 rounded-lg flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
            <span>Requirements Misunderstood · {score}/100</span>
          </span>
        );
      case 'INCORRECT_LOGIC':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-800 rounded-lg flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Logic Error · {score}/100</span>
          </span>
        );
      case 'INEFFICIENT_SOLUTION':
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-800 rounded-lg flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            <span>Inefficient Solution · {score}/100</span>
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-2.5 py-1 bg-paper-dark border border-line text-ink rounded-lg">
            {status} · {score}/100
          </span>
        );
    }
  };

  const handleGenerateQuestions = async () => {
    if (!activeSession) return;
    setGeneratingQuestions(true);
    try {
      const questions = await api.generatePracticeQuestions(activeSession.id);
      setActiveSession({ ...activeSession, practiceQuestions: questions });
    } catch (err: any) {
      alert('Failed to generate practice questions: ' + err.message);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleGenerateCodingProblem = async () => {
    if (!activeSession) return;
    setGeneratingProblem(true);
    try {
      const problem = await api.generateCodingProblem(activeSession.id);
      if (problem) {
        setActiveSession({ ...activeSession, codingProblems: [...activeSession.codingProblems, problem] });
      }
    } catch (err: any) {
      alert('Failed to generate coding problem: ' + err.message);
    } finally {
      setGeneratingProblem(false);
    }
  };

  const handleSendCoachMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !coachInput.trim()) return;

    const userText = coachInput.trim();
    setCoachInput('');
    setSendingCoach(true);

    try {
      const reply = await api.askInterviewCoach(activeSession.id, userText);
      const newMessages: CoachChatMessage[] = [
        ...activeSession.coachMessages,
        { id: Date.now(), role: 'USER', content: userText, createdAt: new Date().toISOString() },
        reply,
      ];
      setActiveSession({ ...activeSession, coachMessages: newMessages });
    } catch (err: any) {
      alert('Coach error: ' + err.message);
    } finally {
      setSendingCoach(false);
    }
  };

  const promptSuggestions = [
    { title: 'Java Loops & Flow Control', category: 'JAVA' },
    { title: 'OOP 4 Pillars & Design Patterns', category: 'OOP' },
    { title: 'Spring Boot REST APIs & DI', category: 'SPRING' },
    { title: 'SQL Joins & Performance Indexing', category: 'SQL' },
    { title: 'Coding Challenge: Two Sum in Java', category: 'CODING' },
    { title: 'Mock Interview on Java Concurrency', category: 'MOCK' },
  ];

  return (
    <PageContainer width="wide" className="space-y-6 sm:space-y-8 font-sans pb-16">
      {/* 1. TOP HEADER & BRANDING */}
      <div className="bg-paper-light border border-line rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded-full text-xs font-semibold shadow-2xs">
              <GraduationCap className="w-3.5 h-3.5" />
              AI Technical Studio & Coach
            </span>
            <span className="text-muted/40">·</span>
            <span className="text-xs text-muted font-medium">Real-time Code & Concept Intelligence</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Interview Lab & Learning Coach
          </h1>

          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            Master engineering concepts, solve live code challenges with automated reviews, drill practice questions, and simulate technical interviews.
          </p>
        </div>

        {activeSession ? (
          <button
            onClick={() => {
              setActiveSession(null);
              setActiveMock(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper hover:bg-paper-dark border border-line hover:border-primary/40 rounded-xl text-xs font-semibold text-ink transition-all self-start md:self-auto shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 z-10"
          >
            <RotateCcw className="w-4 h-4 text-muted" />
            <span>← Exit Session / New Topic</span>
          </button>
        ) : null}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-900 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Prompt Notice</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2. ACTIVE SESSION WORKSPACE */}
      {activeSession ? (
        <div className="space-y-6 animate-fade-in">
          {/* Active Session Header Banner & Always-Visible Tabs */}
          <div className="bg-paper-light border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
                    {activeSession.technology || 'Java'} · {activeSession.difficulty}
                  </span>
                  <span className="text-muted/40">·</span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Technical Session
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-2xl font-bold text-ink">
                  {activeSession.topic}
                </h2>
              </div>
            </div>

            {/* Mode Switcher Tabs (ALL 5 ALWAYS VISIBLE) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-paper p-1.5 rounded-xl border border-line">
              <button
                onClick={() => setActiveTab('learn')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  activeTab === 'learn'
                    ? 'bg-paper-light text-primary shadow-xs font-bold border border-primary/30'
                    : 'text-muted hover:text-ink hover:bg-paper-light/50'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Concept Learn</span>
              </button>

              <button
                onClick={() => {
                  if (activeSession.practiceQuestions.length === 0) {
                    handleGenerateQuestions();
                  }
                  setActiveTab('practice');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  activeTab === 'practice'
                    ? 'bg-paper-light text-primary shadow-xs font-bold border border-primary/30'
                    : 'text-muted hover:text-ink hover:bg-paper-light/50'
                }`}
              >
                <CheckSquare className="w-4 h-4 shrink-0" />
                <span>Practice Questions</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-paper border border-line text-muted">
                  {activeSession.practiceQuestions.length > 0 ? activeSession.practiceQuestions.length : 'AI'}
                </span>
              </button>

              <button
                onClick={() => {
                  if (activeSession.codingProblems.length === 0) {
                    handleGenerateCodingProblem();
                  }
                  setActiveTab('coding');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  activeTab === 'coding'
                    ? 'bg-paper-light text-primary shadow-xs font-bold border border-primary/30'
                    : 'text-muted hover:text-ink hover:bg-paper-light/50'
                }`}
              >
                <Code className="w-4 h-4 shrink-0" />
                <span>Code Challenge</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-paper border border-line text-muted">
                  {activeSession.codingProblems.length > 0 ? activeSession.codingProblems.length : 'IDE'}
                </span>
              </button>

              <button
                onClick={() => {
                  if (!activeMock) {
                    handleStartMock();
                  }
                  setActiveTab('mock');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  activeTab === 'mock'
                    ? 'bg-paper-light text-primary shadow-xs font-bold border border-primary/30'
                    : 'text-muted hover:text-ink hover:bg-paper-light/50'
                }`}
              >
                <Mic className="w-4 h-4 shrink-0" />
                <span>Mock Interview</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-paper border border-line text-muted">
                  {activeMock ? 'Active' : 'Sim'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('coach')}
                className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  activeTab === 'coach'
                    ? 'bg-paper-light text-primary shadow-xs font-bold border border-primary/30'
                    : 'text-muted hover:text-ink hover:bg-paper-light/50'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Ask Coach</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-bold">
                  24/7
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: LEARN */}
          {activeTab === 'learn' && (
            <div className="space-y-5">
              {/* 1. WHAT IS IT? */}
              {activeSession.summary && (
                <div className="bg-paper border border-line p-6 rounded-xl space-y-2.5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Concept Breakdown & Explanation
                  </span>
                  <p className="text-sm text-ink leading-relaxed font-normal">
                    {activeSession.summary}
                  </p>
                </div>
              )}

              {/* 2. EXAMPLE & HOW IT WORKS */}
              {activeSession.examples && activeSession.examples.length > 0 && (
                <div className="bg-paper border border-line p-6 rounded-xl space-y-4 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-primary" />
                    Practical Implementation Example
                  </span>
                  {activeSession.examples.map((ex, idx) => (
                    <div key={idx} className="border border-line rounded-xl overflow-hidden shadow-2xs">
                      <div className="p-3 bg-paper-dark border-b border-line flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">{ex.title}</span>
                        <span className="font-mono text-[10px] font-semibold text-muted uppercase px-2 py-0.5 bg-paper rounded-md">
                          {ex.language}
                        </span>
                      </div>
                      <pre className="p-4 bg-[#141E18] text-[#F3F4F6] font-mono text-xs overflow-x-auto leading-relaxed">
                        <code>{ex.code}</code>
                      </pre>
                      {ex.explanation && (
                        <div className="p-3.5 bg-paper-light text-xs text-muted border-t border-line leading-relaxed font-sans">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 3. KEY CONCEPTS */}
              {activeSession.keyConcepts && activeSession.keyConcepts.length > 0 && (
                <div className="bg-paper border border-line p-6 rounded-xl space-y-3 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Key Architectural Takeaways
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSession.keyConcepts.map((concept, idx) => (
                      <div key={idx} className="p-3.5 bg-paper-light border border-line rounded-xl flex items-start gap-2.5">
                        <span className="text-xs font-bold text-primary shrink-0 mt-0.5">#{idx + 1}</span>
                        <p className="text-xs text-ink font-medium leading-relaxed">{concept}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. COMMON MISTAKES */}
              {activeSession.commonMistakes && activeSession.commonMistakes.length > 0 && (
                <div className="bg-paper border border-line p-6 rounded-xl space-y-3 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Common Mistakes & Anti-Patterns to Avoid
                  </span>
                  <div className="space-y-2">
                    {activeSession.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-ink text-xs leading-relaxed">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p>{mistake}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. INTERVIEW TIP / REMEMBER */}
              {activeSession.interviewRelevance && (
                <div className="border border-primary/30 bg-primary/5 p-6 rounded-xl space-y-2 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    How to Explain This in a Technical Interview
                  </span>
                  <p className="text-xs text-ink leading-relaxed">
                    {activeSession.interviewRelevance}
                  </p>
                </div>
              )}

              {/* 6. NEXT STEPS MASTERY HUB */}
              <div className="pt-4 border-t border-line space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
                    Ready for Next Step? Choose How to Practice:
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Practice Questions Card */}
                  <div
                    onClick={() => {
                      if (activeSession.practiceQuestions.length === 0) {
                        handleGenerateQuestions();
                      }
                      setActiveTab('practice');
                    }}
                    className="p-5 bg-paper border border-line hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <CheckSquare className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                        Practice Questions
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        Test conceptual clarity, output prediction, and code debugging with instant AI grading.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>{generatingQuestions ? 'Preparing Questions...' : activeSession.practiceQuestions.length > 0 ? 'Resume Practice' : 'Start Practice'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Coding Challenge Card */}
                  <div
                    onClick={() => {
                      if (activeSession.codingProblems.length === 0) {
                        handleGenerateCodingProblem();
                      }
                      setActiveTab('coding');
                    }}
                    className="p-5 bg-paper border border-line hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Code className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                        Live Code Challenge
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        Write code in the live editor with 3 progressive hints and automated code reviews.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>{generatingProblem ? 'Generating Challenge...' : activeSession.codingProblems.length > 0 ? 'Open Editor' : 'Start Coding'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Mock Interview Card */}
                  <div
                    onClick={() => {
                      if (!activeMock) {
                        handleStartMock();
                      }
                      setActiveTab('mock');
                    }}
                    className="p-5 bg-paper border border-line hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Mic className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                        Mock Interview
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        Simulate real-world conversational technical interview rounds with scoring.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>{startingMock ? 'Starting Simulator...' : activeMock ? 'Resume Mock' : 'Begin Mock'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Ask Coach Card */}
                  <div
                    onClick={() => setActiveTab('coach')}
                    className="p-5 bg-paper border border-line hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                        Ask AI Coach
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        Ask follow-up questions, request deeper architecture breakdowns, or clarify doubts.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Chat with Coach</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRACTICE */}
          {activeTab === 'practice' && (
            <div className="space-y-5">
              {activeSession.practiceQuestions.length === 0 ? (
                <div className="bg-paper border border-line p-8 text-center space-y-4 rounded-xl shadow-xs">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mx-auto text-primary">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-ink">
                      Generate Practice Questions with AI
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Test your understanding of <strong>{activeSession.topic}</strong> with targeted conceptual, debugging, and output-prediction questions.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generatingQuestions}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{generatingQuestions ? 'Generating Questions...' : 'Generate Practice Questions (4 Questions)'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </button>
                </div>
              ) : (
                activeSession.practiceQuestions.map((q, idx) => {
                  const evalResult = q.latestAttempt;
                  const isSubmitting = submittingPractice[q.id] || false;
                  const currentAnswer = practiceAnswers[q.id] ?? (evalResult ? evalResult.answerText : '');
                  const hintRevealed = revealedHints[q.id] || false;

                  return (
                    <div key={q.id} className="bg-paper border border-line rounded-xl overflow-hidden shadow-xs space-y-0">
                      {/* Question Header */}
                      <div className="p-3.5 bg-paper-dark border-b border-line flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">Question #{idx + 1}</span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-paper border border-line text-ink rounded-md">
                            {q.questionType}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-paper border border-line text-muted rounded-md">
                            {q.difficulty}
                          </span>
                        </div>
                        {evalResult && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                            evalResult.score >= 8
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800'
                              : evalResult.score >= 5
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-800'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-800'
                          }`}>
                            Score: {evalResult.score}/10
                          </span>
                        )}
                      </div>

                      {/* Question Body */}
                      <div className="p-5 space-y-4">
                        <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">
                          {q.questionText}
                        </p>

                        {/* MCQ Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-start gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                                  currentAnswer === opt
                                    ? 'bg-primary/10 border-primary text-ink font-semibold'
                                    : 'bg-paper-light border-line text-ink hover:bg-paper-dark'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  value={opt}
                                  checked={currentAnswer === opt}
                                  onChange={(e) => setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="mt-0.5 text-primary"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Open Ended Text Answer */}
                        {(!q.options || q.options.length === 0) && (
                          <textarea
                            value={currentAnswer}
                            onChange={(e) => setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Type your technical explanation as you would in a technical interview..."
                            rows={3}
                            className="w-full p-3 bg-paper-light border border-line rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                          />
                        )}

                        {/* Hint Box */}
                        {hintRevealed && q.hint && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2 text-xs text-amber-900 animate-fade-in">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p>{q.hint}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-line">
                          {q.hint ? (
                            <button
                              type="button"
                              onClick={() => setRevealedHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                              className="text-xs text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>{hintRevealed ? 'Hide Hint' : 'Need a Hint?'}</span>
                            </button>
                          ) : <div />}

                          <button
                            type="button"
                            disabled={isSubmitting || !currentAnswer.trim()}
                            onClick={() => handleSubmitPractice(q.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                          >
                            <span>{isSubmitting ? 'Evaluating...' : evalResult ? 'Re-Evaluate Answer' : 'Submit Answer'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                          </button>
                        </div>

                        {/* Real AI Evaluation Breakdown */}
                        {evalResult && (
                          <div className="mt-4 p-4 bg-paper-light border border-line rounded-xl space-y-2.5 text-xs animate-fade-in">
                            <div className="flex items-center justify-between border-b border-line pb-2">
                              <span className="text-xs font-bold uppercase text-primary">
                                AI Evaluation Feedback
                              </span>
                              <span className="text-[11px] text-muted">
                                Evaluated on technical accuracy & completeness
                              </span>
                            </div>

                            {evalResult.whatYouGotRight && (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-emerald-800">What you got right:</span>
                                <p className="text-ink">{evalResult.whatYouGotRight}</p>
                              </div>
                            )}

                            {evalResult.whatIsMissing && (
                              <div className="space-y-0.5">
                                <span className="font-semibold text-amber-800">Areas for improvement:</span>
                                <p className="text-ink">{evalResult.whatIsMissing}</p>
                              </div>
                            )}

                            {evalResult.betterInterviewAnswer && (
                              <div className="p-3 bg-paper border border-line rounded-lg space-y-1">
                                <span className="font-semibold text-ink block">Senior Engineer Model Answer:</span>
                                <p className="text-muted leading-relaxed">{evalResult.betterInterviewAnswer}</p>
                              </div>
                            )}

                            {evalResult.interviewTip && (
                              <div className="text-xs text-muted italic">
                                💡 Tip: {evalResult.interviewTip}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CODING PROBLEMS */}
          {activeTab === 'coding' && (
            <div className="space-y-5">
              {activeSession.codingProblems.length === 0 ? (
                <div className="bg-paper border border-line p-8 text-center space-y-4 rounded-xl shadow-xs">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mx-auto text-primary">
                    <Code className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-ink">
                      Generate Interactive Coding Challenge
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Solve code challenges on <strong>{activeSession.topic}</strong> with live AI evaluation, progressive hints, and step-by-step solution walkthroughs.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCodingProblem}
                    disabled={generatingProblem}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{generatingProblem ? 'Generating Challenge...' : 'Generate Coding Challenge'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </button>
                </div>
              ) : (
                activeSession.codingProblems.map((prob) => {
                  const review = prob.latestAttempt;
                  const isSubmitting = submittingCode[prob.id] || false;
                  const codeValue = codeInputs[prob.id] ?? (prob.starterCode || '');
                  const currentHints = revealedHintsMap[prob.id] || [];
                  const isLoadingHint = loadingHintMap[prob.id] || false;
                  const showSolution = showSolutionMap[prob.id] || false;
                  const revealedSolution = revealedSolutionMap[prob.id] || null;
                  const isLoadingSolution = loadingSolutionMap[prob.id] || false;

                  return (
                    <div key={prob.id} className="bg-paper border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
                      {/* Problem Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-line gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary uppercase">
                              {prob.difficulty}
                            </span>
                            <span className="text-muted/40">·</span>
                            <span className="text-xs text-muted">{prob.questionType}</span>
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                            {prob.title}
                          </h3>
                        </div>

                        {review && getReviewBadge(review.status, review.score)}
                      </div>

                      {/* Problem Description */}
                      <div className="space-y-3 text-xs sm:text-sm text-ink leading-relaxed">
                        <p className="whitespace-pre-wrap">{prob.problemStatement}</p>

                        {/* Examples */}
                        {prob.examples && prob.examples.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold uppercase text-muted block">Example Cases:</span>
                            {prob.examples.map((ex, exIdx) => (
                              <div key={exIdx} className="p-3 bg-paper-light border border-line rounded-lg text-xs font-mono space-y-1">
                                <div><strong className="text-ink">Input:</strong> {ex.input}</div>
                                <div><strong className="text-ink">Output:</strong> {ex.output}</div>
                                {ex.explanation && <div className="text-muted font-sans text-[11px] pt-0.5">{ex.explanation}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Progressive Hints Section */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>Progressive Hints ({currentHints.length}/3)</span>
                          </span>
                          <div className="flex items-center gap-2">
                            {currentHints.length < 3 && (
                              <button
                                type="button"
                                onClick={() => handleGetCodingHint(prob.id)}
                                disabled={isLoadingHint}
                                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                              >
                                {isLoadingHint ? 'Fetching Hint...' : `Get Hint #${currentHints.length + 1}`}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleCodingSolution(prob.id)}
                              disabled={isLoadingSolution}
                              className="text-xs font-semibold text-amber-700 hover:underline cursor-pointer ml-3"
                            >
                              {isLoadingSolution ? 'Loading Solution...' : showSolution ? 'Hide Solution' : 'View Reference Solution'}
                            </button>
                          </div>
                        </div>

                        {currentHints.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {currentHints.map((hText, hIdx) => (
                              <div key={hIdx} className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-950 flex items-start gap-2">
                                <span className="font-bold text-amber-800 shrink-0">Hint #{hIdx + 1}:</span>
                                <span>{hText}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Interactive Code Editor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-ink">Write Your Solution:</span>
                          <span className="text-muted font-mono text-[11px]">Language: {activeSession.technology || 'Java'}</span>
                        </div>
                        <textarea
                          id={`code-editor-${prob.id}`}
                          value={codeValue}
                          onChange={(e) => setCodeInputs((prev) => ({ ...prev, [prob.id]: e.target.value }))}
                          rows={10}
                          placeholder="// Write your code solution here..."
                          className="w-full p-4 bg-[#141E18] text-[#F3F4F6] font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                        />
                      </div>

                      {/* Submit Action */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          disabled={isSubmitting || !codeValue.trim()}
                          onClick={() => handleSubmitCode(prob.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span>{isSubmitting ? 'Analyzing Code with AI...' : review ? 'Re-Submit & Review Code' : 'Submit & Review Code'}</span>
                          <ArrowRight className="w-4 h-4 text-emerald-200" />
                        </button>
                      </div>

                      {/* Reference Solution Card */}
                      {showSolution && revealedSolution && (
                        <div id={`solution-card-${prob.id}`} className="p-5 bg-paper-light border border-line rounded-xl space-y-4 text-xs animate-fade-in">
                          <div className="flex items-center justify-between border-b border-line pb-3">
                            <span className="font-bold text-primary flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4" />
                              Official Reference Solution
                            </span>
                            <button
                              onClick={() => handleHideCodingSolution(prob.id)}
                              className="text-xs text-muted hover:text-ink cursor-pointer"
                            >
                              Hide Solution
                            </button>
                          </div>

                          <pre className="p-4 bg-[#141E18] text-[#F3F4F6] font-mono text-xs rounded-lg overflow-x-auto leading-relaxed">
                            <code>{revealedSolution.code}</code>
                          </pre>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 bg-paper border border-line rounded-lg space-y-1">
                              <span className="font-semibold text-primary block">Algorithmic Approach:</span>
                              <p className="text-ink">{revealedSolution.approach}</p>
                            </div>
                            <div className="p-3 bg-paper border border-line rounded-lg space-y-1">
                              <span className="font-semibold text-muted block">Complexity Analysis:</span>
                              <p className="text-ink font-mono text-[11px]">Time: {revealedSolution.timeComplexity} | Space: {revealedSolution.spaceComplexity}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Code Review Feedback */}
                      {review && (
                        <div className="p-5 bg-paper-light border border-line rounded-xl space-y-3 text-xs animate-fade-in">
                          <div className="flex items-center justify-between border-b border-line pb-2">
                            <span className="font-bold text-primary">AI Code Review Analysis</span>
                            {getReviewBadge(review.status, review.score)}
                          </div>
                          <p className="text-ink font-medium leading-relaxed">{review.summary}</p>
                          <p className="text-muted leading-relaxed">{review.correctnessAnalysis}</p>
                          <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-mono">
                            <div className="p-2.5 bg-paper border border-line rounded-lg">
                              <span className="text-muted block text-[10px]">Time Complexity</span>
                              <span className="font-bold text-ink">{review.timeComplexity}</span>
                            </div>
                            <div className="p-2.5 bg-paper border border-line rounded-lg">
                              <span className="text-muted block text-[10px]">Space Complexity</span>
                              <span className="font-bold text-ink">{review.spaceComplexity}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleTryAgain(prob.id)}
                              className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Refine & Try Again</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: MOCK INTERVIEW */}
          {activeTab === 'mock' && (
            <div className="space-y-5">
              {!activeMock ? (
                <div className="bg-paper border border-line p-8 rounded-xl text-center space-y-4 shadow-xs">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mx-auto text-primary">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-ink">
                      Adaptive Technical Mock Interview
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Simulate a real-time interview on <strong>{activeSession.topic}</strong> with sequential adaptive questions and feedback.
                    </p>
                  </div>
                  <button
                    onClick={handleStartMock}
                    disabled={startingMock}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{startingMock ? 'Preparing Interviewer...' : 'Start Mock Interview (4 Questions)'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </button>
                </div>
              ) : (
                <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
                        {activeMock.status === 'COMPLETED' ? 'Interview Complete' : `Question ${activeMock.currentQuestionIndex + 1} of ${activeMock.targetQuestions}`}
                      </span>
                      <h3 className="font-display text-base font-bold text-ink mt-1">
                        Mock Session: {activeMock.topic}
                      </h3>
                    </div>

                    {activeMock.status === 'COMPLETED' && activeMock.overallScore != null && (
                      <span className="text-sm font-bold px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 rounded-lg">
                        Final Score: {activeMock.overallScore}%
                      </span>
                    )}
                  </div>

                  {/* Turn History */}
                  <div className="space-y-4 divide-y divide-line">
                    {activeMock.questions.map((mq) => (
                      <div key={mq.id} className="pt-3 space-y-2">
                        <div className="p-3.5 bg-paper-light rounded-xl border border-line flex items-start gap-2.5">
                          <span className="text-xs font-bold text-primary shrink-0">Interviewer:</span>
                          <p className="text-xs text-ink leading-relaxed">{mq.questionText}</p>
                        </div>

                        {mq.answer && (
                          <div className="pl-6 space-y-2">
                            <div className="p-3 bg-paper rounded-xl border border-line flex items-start gap-2.5">
                              <span className="text-xs font-bold text-muted shrink-0">You:</span>
                              <p className="text-xs text-ink leading-relaxed">{mq.answer.answerText}</p>
                            </div>

                            <div className="p-3 bg-paper-light border border-line rounded-xl text-xs space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-primary">Turn Score: {mq.answer.score}/10</span>
                                <span className="text-muted">{mq.answer.evaluationSummary}</span>
                              </div>
                              {mq.answer.betterResponse && (
                                <p className="text-[11px] text-muted pt-1 border-t border-line">
                                  <strong>Model Response:</strong> {mq.answer.betterResponse}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Active Question Input */}
                  {activeMock.status === 'IN_PROGRESS' && activeMock.currentQuestion && (
                    <form onSubmit={handleSubmitMockTurn} className="pt-3 border-t border-line space-y-3">
                      <label className="text-xs font-semibold text-ink block">
                        Your Technical Response:
                      </label>
                      <textarea
                        value={mockAnswerInput}
                        onChange={(e) => setMockAnswerInput(e.target.value)}
                        placeholder="Explain your approach, trade-offs, and technical solution..."
                        rows={4}
                        className="w-full p-3 bg-paper-light border border-line rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingMock || !mockAnswerInput.trim()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <span>{submittingMock ? 'Evaluating...' : 'Submit Turn Response'}</span>
                          <ArrowRight className="w-4 h-4 text-emerald-200" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ASK COACH (PREMIUM CHAT INTERFACE) */}
          {activeTab === 'coach' && (
            <div className="bg-paper-light border border-line rounded-2xl p-5 sm:p-7 space-y-5 shadow-xs">
              {/* Coach Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-2xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-ink">
                        Technical Interview Coach
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online 24/7
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Topic Context: <strong className="text-ink">{activeSession.topic}</strong> ({activeSession.technology || 'Java'})
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-muted bg-paper px-3 py-1.5 rounded-lg border border-line self-start sm:self-auto">
                  Powered by Gemini Engine
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-4 max-h-[460px] min-h-[260px] overflow-y-auto p-3 sm:p-4 bg-paper rounded-xl border border-line/70">
                {activeSession.coachMessages.length === 0 ? (
                  <div className="py-12 text-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display text-sm font-bold text-ink">
                        How can I help you master {activeSession.topic}?
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">
                        Ask about core theory, edge cases, implementation trade-offs, internal JVM architecture, or interview questions.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeSession.coachMessages.map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      className={`flex gap-3 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      {msg.role !== 'USER' && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`space-y-1 max-w-xl ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted px-1">
                          <span>{msg.role === 'USER' ? 'You' : 'AI Technical Coach'}</span>
                          {msg.createdAt && <span>· {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        <div
                          className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-2xs ${
                            msg.role === 'USER'
                              ? 'bg-primary text-white font-medium rounded-tr-xs'
                              : 'bg-paper-light border border-line text-ink font-normal rounded-tl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>

                      {msg.role === 'USER' && (
                        <div className="w-7 h-7 rounded-lg bg-paper-dark border border-line flex items-center justify-center text-ink shrink-0 mt-1">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Quick Suggestion Prompt Chips */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-muted flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  <span>Suggested Questions to Ask Coach:</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    `Can you give a real-world production example of ${activeSession.topic}?`,
                    `What are the most common interview pitfalls on this topic?`,
                    `How would an interviewer evaluate my depth on ${activeSession.topic}?`,
                    `What are the time and memory trade-offs for this concept?`,
                  ].map((chipPrompt, chipIdx) => (
                    <button
                      key={chipIdx}
                      type="button"
                      onClick={() => setCoachInput(chipPrompt)}
                      className="text-[11px] px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-primary/40 rounded-lg text-ink transition-all cursor-pointer active:scale-95 text-left"
                    >
                      {chipPrompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coach Input Bar */}
              <form onSubmit={handleSendCoachMessage} className="pt-2 flex items-center gap-2.5">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  placeholder={`Ask a question about ${activeSession.topic}...`}
                  className="flex-1 p-3.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm text-ink outline-none transition-all placeholder:text-muted/60"
                />
                <button
                  type="submit"
                  disabled={sendingCoach || !coachInput.trim()}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>{sendingCoach ? 'Analyzing...' : 'Ask Coach'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* 3. LAB HOME & GENERATION DASHBOARD */
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
          {/* Main Natural Language Topic Input Box */}
          <div className="bg-paper-light border border-line p-5 sm:p-7 rounded-2xl space-y-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-ink">
                    What technical topic would you like to master today?
                  </h2>
                  <p className="text-xs text-muted">
                    Type any engineering concept, request a coding challenge, or simulate a technical interview.
                  </p>
                </div>
              </div>
            </div>

            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (topicInput.trim() && !generating) {
                    handleGenerateSession();
                  }
                }
              }}
              placeholder="e.g. Explain Java Polymorphism & Dynamic Dispatch, solve Two Sum coding problem, or conduct a Spring Boot mock interview..."
              rows={3}
              className="w-full p-4 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl text-xs sm:text-sm text-ink outline-none transition-all leading-relaxed placeholder:text-muted/50 resize-none shadow-2xs"
            />

            {/* Curated Topic Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-medium text-muted shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" /> Popular:
              </span>
              {promptSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopicInput(item.title)}
                  className="px-2.5 py-1 text-xs bg-paper hover:bg-paper-dark border border-line hover:border-primary/40 text-ink/80 hover:text-ink rounded-lg transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  {item.title}
                </button>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-line">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1.5 bg-paper px-3 py-1.5 rounded-xl border border-line">
                  <span className="text-muted text-[11px] font-medium">Difficulty:</span>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                    className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-paper px-3 py-1.5 rounded-xl border border-line">
                  <span className="text-muted text-[11px] font-medium">Technology:</span>
                  <select
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-ink focus:outline-none cursor-pointer"
                  >
                    <option value="Auto Detect">Auto Detect</option>
                    <option value="Java">Core Java</option>
                    <option value="Spring Boot">Spring Boot</option>
                    <option value="SQL">SQL</option>
                    <option value="DSA">DSA</option>
                    <option value="React">React</option>
                    <option value="Docker">Docker</option>
                    <option value="Git">Git</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={generating || !topicInput.trim()}
                onClick={() => handleGenerateSession()}
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>{generating ? 'Preparing with AI...' : 'Start Session'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
              </button>
            </div>
          </div>

          {/* Quick Launch Direct Mode Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => {
                setTopicInput('OOP 4 Pillars & Design Patterns');
                handleGenerateSession('OOP 4 Pillars & Design Patterns');
              }}
              className="p-5 bg-paper-light border border-line hover:border-primary/40 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Concept Learn
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Deep-dive explanations, architecture diagrams, and syntax breakdowns.
              </p>
            </div>

            <div
              onClick={() => {
                setTopicInput('Coding Challenge: Two Sum in Java');
                handleGenerateSession('Coding Challenge: Two Sum in Java');
              }}
              className="p-5 bg-paper-light border border-line hover:border-primary/40 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Code className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Coding Challenge
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                In-browser code editor with 3 hints, test runs, and instant AI reviews.
              </p>
            </div>

            <div
              onClick={() => {
                setTopicInput('Mock Interview on Java Concurrency');
                handleGenerateSession('Mock Interview on Java Concurrency');
              }}
              className="p-5 bg-paper-light border border-line hover:border-primary/40 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Mock Interview
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Adaptive AI interviewer with multi-turn scoring and model answers.
              </p>
            </div>

            <div
              onClick={() => {
                setTopicInput('Explain Spring Boot Dependency Injection');
                handleGenerateSession('Explain Spring Boot Dependency Injection');
              }}
              className="p-5 bg-paper-light border border-line hover:border-primary/40 rounded-2xl cursor-pointer transition-all space-y-2 group shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors">
                Ask AI Coach
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Ask tricky interview questions, edge cases, and architectural trade-offs.
              </p>
            </div>
          </div>

          {/* YOUR RECENT PRACTICE (Only shown if real sessions exist in database) */}
          {recentSessions.length > 0 && (
            <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                    Recent Practice Sessions ({recentSessions.length})
                  </h2>
                </div>
                <span className="text-xs text-muted">
                  Saved in database
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleOpenSession(s.id)}
                    className="p-4 bg-paper-light border border-line hover:border-primary/50 rounded-xl cursor-pointer transition-all space-y-2.5 shadow-2xs hover:shadow-xs group hover:-translate-y-[1px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-paper text-primary border border-primary/20 rounded-md">
                        {s.technology || 'Java'}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        {s.createdAt ? s.createdAt.substring(0, 10) : ''}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-ink group-hover:text-primary transition-colors truncate">
                      {s.topic}
                    </h4>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {s.summary || s.userInput}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-line text-xs text-muted">
                      <span>{s.difficulty || 'Beginner'}</span>
                      <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Resume</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity / Mock History (Only shown if real history exists) */}
          {history.length > 0 && (
            <div className="bg-paper border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-line pb-3">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
                  Interview Activity History
                </h2>
              </div>
              <div className="divide-y divide-line">
                {history.slice(0, 5).map((h, hIdx) => (
                  <div key={hIdx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-paper-dark border border-line text-ink rounded-md">
                        {h.type === 'MOCK_INTERVIEW' ? 'Mock Interview' : 'Practice'}
                      </span>
                      <span className="font-semibold text-ink">{h.topic}</span>
                      <span className="text-xs text-muted font-mono">· {h.technology}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {h.score != null && (
                        <span className="font-bold text-primary">{h.score}%</span>
                      )}
                      <span className="text-xs text-muted font-mono">
                        {h.timestamp ? h.timestamp.substring(0, 10) : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};
