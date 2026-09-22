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
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Sparkles,
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
        handleStartMockWithSession(session);
      } else {
        setActiveSession(session);
        setActiveTab('learn');
      }
      fetchDashboardData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Interview Lab is temporarily unavailable. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartMockWithSession = async (sessionToUse: SessionDetail) => {
    setStartingMock(true);
    try {
      const mockState = await api.startMockInterview({
        technology: sessionToUse.technology,
        topic: sessionToUse.topic,
        difficulty: sessionToUse.difficulty,
        interviewType: 'TECHNICAL',
        targetQuestions: 4,
      });
      setActiveMock(mockState);
      setMockAnswerInput('');
    } catch (err: any) {
      alert('Failed to start mock interview: ' + err.message);
    } finally {
      setStartingMock(false);
    }
  };

  const handleOpenSession = async (sessionId: number) => {
    try {
      setGenerating(true);
      setErrorMessage(null);
      const session = await api.getInterviewSession(sessionId);
      setActiveSession(session);
      setActiveTab('learn');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load session');
    } finally {
      setGenerating(false);
    }
  };

  // Practice Mode: Submit Answer
  const handleSubmitPractice = async (questionId: number) => {
    const answer = practiceAnswers[questionId];
    if (!answer || !answer.trim()) return;

    setSubmittingPractice((prev) => ({ ...prev, [questionId]: true }));
    try {
      const evalResult = await api.submitPracticeAnswer(questionId, answer.trim());
      if (activeSession) {
        const updatedQuestions = activeSession.practiceQuestions.map((q) =>
          q.id === questionId ? { ...q, latestAttempt: evalResult } : q
        );
        setActiveSession({ ...activeSession, practiceQuestions: updatedQuestions });
      }
      fetchDashboardData();
    } catch (err: any) {
      alert('Evaluation error: ' + err.message);
    } finally {
      setSubmittingPractice((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  // Mock Interview: Start Mock
  const handleStartMock = async () => {
    if (!activeSession) return;
    setStartingMock(true);
    try {
      const mockState = await api.startMockInterview({
        technology: activeSession.technology,
        topic: activeSession.topic,
        difficulty: activeSession.difficulty,
        interviewType: 'TECHNICAL',
        targetQuestions: 4,
      });
      setActiveMock(mockState);
      setMockAnswerInput('');
    } catch (err: any) {
      alert('Failed to start mock interview: ' + err.message);
    } finally {
      setStartingMock(false);
    }
  };

  // Mock Interview: Submit Turn Answer
  const handleSubmitMockAnswer = async () => {
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
    // If currently visible, toggle hide
    if (showSolutionMap[problemId]) {
      setShowSolutionMap((prev) => ({ ...prev, [problemId]: false }));
      return;
    }

    // Set visible
    setShowSolutionMap((prev) => ({ ...prev, [problemId]: true }));

    // If solution is already loaded, scroll to it
    if (revealedSolutionMap[problemId]) {
      setTimeout(() => {
        const solEl = document.getElementById(`solution-card-${problemId}`);
        if (solEl) solEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    // Fetch solution on demand
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

  // Coding Practice: Hide Solution
  const handleHideCodingSolution = (problemId: number) => {
    setShowSolutionMap((prev) => ({ ...prev, [problemId]: false }));
  };

  // Coding Practice: Try Again (Focus editor without losing attempt history)
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
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 rounded-xs flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>ACCEPTED · {score}/100</span>
          </span>
        );
      case 'SYNTAX_OR_COMPILATION_ERROR':
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-800 rounded-xs flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            <span>SYNTAX / COMPILATION ERROR · {score}/100</span>
          </span>
        );
      case 'MISUNDERSTOOD_REQUIREMENTS':
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-900 rounded-xs flex items-center space-x-1">
            <HelpCircle className="w-3 h-3 text-purple-700" />
            <span>REQUIREMENTS MISUNDERSTOOD · {score}/100</span>
          </span>
        );
      case 'INCORRECT_LOGIC':
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-800 rounded-xs flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-rose-700" />
            <span>LOGIC ERROR · {score}/100</span>
          </span>
        );
      case 'INEFFICIENT_SOLUTION':
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-800 rounded-xs flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-amber-700" />
            <span>INEFFICIENT SOLUTION · {score}/100</span>
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-paper-dark border border-line text-ink rounded-xs">
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

  // Ask Coach: Send Message
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

  return (
    <PageContainer width="wide" className="space-y-6 font-sans">
      {/* 1. TOP HEADER & BRANDING */}
      <div className="border border-line bg-paper-light p-4 sm:p-5 rounded-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary text-white rounded-xs flex items-center justify-center font-mono font-bold text-xs shadow-xs">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display text-lg font-black tracking-tight text-ink uppercase">
              INTERVIEW LAB
            </h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-primary-soft text-primary border border-primary/20 rounded-xs uppercase">
              AI Learning Coach
            </span>
          </div>
          <p className="text-xs text-muted mt-1 font-medium">
            Learn, practice, and prepare for interviews with your AI coach.
          </p>
        </div>

        {activeSession && (
          <button
            onClick={() => {
              setActiveSession(null);
              setActiveMock(null);
            }}
            className="px-3 py-2 sm:py-1.5 bg-paper-light border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors self-start md:self-auto shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted" />
            <span>← Back to Home / New Topic</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-warning-soft/60 border border-warning/30 rounded-sm flex items-start space-x-3 text-warning">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 2. ACTIVE SESSION WORKSPACE */}
      {activeSession ? (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Active Session Header Banner */}
          <div className="border border-line bg-paper-light p-3.5 sm:p-4 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-xs font-black uppercase px-2 py-0.5 bg-paper-dark border border-line text-primary rounded-xs shadow-2xs">
                  {activeSession.technology} | {activeSession.difficulty}
                </span>
                <span className="text-muted text-xs font-mono hidden sm:inline">—</span>
                <h2 className="font-display text-sm sm:text-base font-bold text-ink truncate max-w-full">
                  {activeSession.topic}
                </h2>
              </div>
            </div>

            {/* Mode Switcher Tabs (Intent-Aware: Only show relevant tabs) */}
            <div className="flex items-center space-x-1 font-mono text-xs border border-line bg-paper-dark p-1 rounded-sm shrink-0 overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => setActiveTab('learn')}
                className={`px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'learn'
                    ? 'bg-paper-light text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-muted hover:text-ink hover:bg-paper-light/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learn</span>
              </button>

              {(activeSession.practiceQuestions.length > 0 || activeTab === 'practice') && (
                <button
                  onClick={() => setActiveTab('practice')}
                  className={`px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'practice'
                      ? 'bg-paper-light text-primary font-bold border border-primary/20 shadow-2xs'
                      : 'text-muted hover:text-ink hover:bg-paper-light/60'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Practice</span>
                </button>
              )}

              {(activeSession.codingProblems.length > 0 || activeTab === 'coding') && (
                <button
                  onClick={() => setActiveTab('coding')}
                  className={`px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'coding'
                      ? 'bg-paper-light text-primary font-bold border border-primary/20 shadow-2xs'
                      : 'text-muted hover:text-ink hover:bg-paper-light/60'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Coding</span>
                </button>
              )}

              {(activeMock != null || activeTab === 'mock') && (
                <button
                  onClick={() => setActiveTab('mock')}
                  className={`px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'mock'
                      ? 'bg-paper-light text-primary font-bold border border-primary/20 shadow-2xs'
                      : 'text-muted hover:text-ink hover:bg-paper-light/60'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Mock Interview</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('coach')}
                className={`px-3 py-1.5 rounded-xs transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'coach'
                    ? 'bg-paper-light text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-muted hover:text-ink hover:bg-paper-light/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Coach</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LEARN */}
          {activeTab === 'learn' && (
            <div className="space-y-4">
              {/* 1. WHAT IS IT? */}
              {activeSession.summary && (
                <div className="border border-line bg-paper p-5 rounded-sm space-y-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                    WHAT IS IT?
                  </span>
                  <p className="text-xs text-ink leading-relaxed font-sans font-medium">
                    {activeSession.summary}
                  </p>
                </div>
              )}

              {/* 2. EXAMPLE & HOW IT WORKS */}
              {activeSession.examples && activeSession.examples.length > 0 && (
                <div className="border border-line bg-paper p-5 rounded-sm space-y-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                    PRACTICAL EXAMPLE & HOW IT WORKS
                  </span>
                  {activeSession.examples.map((ex, idx) => (
                    <div key={idx} className="border border-line bg-paper rounded-xs overflow-hidden">
                      <div className="p-2.5 bg-paper-dark border-b border-line flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">{ex.title}</span>
                        <span className="font-mono text-[10px] text-muted uppercase">{ex.language}</span>
                      </div>
                      <pre className="p-3.5 bg-[#1C1917] text-[#FBFBFA] font-mono text-xs overflow-x-auto leading-relaxed">
                        <code>{ex.code}</code>
                      </pre>
                      {ex.explanation && (
                        <div className="p-3 bg-paper-dark/60 text-xs text-ink border-t border-line leading-relaxed font-sans">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 3. KEY CONCEPTS */}
              {activeSession.keyConcepts && activeSession.keyConcepts.length > 0 && (
                <div className="border border-line bg-paper p-5 rounded-sm space-y-2.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                    KEY CONCEPTS TO REMEMBER
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {activeSession.keyConcepts.map((concept, idx) => (
                      <div key={idx} className="p-3 bg-paper-dark border border-line rounded-xs flex items-start space-x-2.5">
                        <span className="font-mono text-xs font-bold text-accent shrink-0 mt-0.5">#{idx + 1}</span>
                        <p className="text-xs text-ink font-medium leading-relaxed">{concept}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. COMMON MISTAKES */}
              {activeSession.commonMistakes && activeSession.commonMistakes.length > 0 && (
                <div className="border border-line bg-paper p-5 rounded-sm space-y-2.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-attention">
                    COMMON MISTAKES TO AVOID
                  </span>
                  <div className="space-y-2">
                    {activeSession.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="p-3 bg-attention-subtle/20 border border-attention/20 rounded-xs flex items-start space-x-2.5 text-ink">
                        <AlertCircle className="w-4 h-4 text-attention shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">{mistake}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. INTERVIEW TIP / REMEMBER */}
              {activeSession.interviewRelevance && (
                <div className="border border-accent/40 bg-accent-subtle/20 p-5 rounded-sm space-y-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                    HOW TO EXPLAIN THIS IN AN INTERVIEW
                  </span>
                  <p className="text-xs text-ink leading-relaxed font-sans">
                    {activeSession.interviewRelevance}
                  </p>
                </div>
              )}

              {/* 6. NEXT ACTIONS BAR */}
              <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeSession.practiceQuestions.length === 0) {
                        handleGenerateQuestions();
                      }
                      setActiveTab('practice');
                    }}
                    disabled={generatingQuestions}
                    className="px-3.5 py-2 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-accent" />
                    <span>{generatingQuestions ? 'Preparing Questions...' : 'Practice Questions'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeSession.codingProblems.length === 0) {
                        handleGenerateCodingProblem();
                      }
                      setActiveTab('coding');
                    }}
                    disabled={generatingProblem}
                    className="px-3.5 py-2 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <Code className="w-3.5 h-3.5 text-accent" />
                    <span>{generatingProblem ? 'Preparing Challenge...' : 'Try Coding Problem'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!activeMock) {
                        handleStartMock();
                      }
                      setActiveTab('mock');
                    }}
                    disabled={startingMock}
                    className="px-3.5 py-2 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <Mic className="w-3.5 h-3.5 text-accent" />
                    <span>{startingMock ? 'Starting Mock...' : 'Mock Interview'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('coach')}
                  className="px-4 py-2 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  <span>Ask Coach a Question</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRACTICE */}
          {activeTab === 'practice' && (
            <div className="space-y-5">
              {activeSession.practiceQuestions.length === 0 ? (
                <div className="border border-line bg-paper p-8 text-center space-y-4 rounded-sm shadow-2xs">
                  <div className="w-12 h-12 bg-ink text-paper rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      Generate Practice Questions with AI
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto mt-1">
                      Ready to test your knowledge on <strong>{activeSession.topic}</strong>? Generate targeted conceptual, MCQ, debugging, and output-prediction questions.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={generatingQuestions}
                    className="px-5 py-2.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-sm transition-colors shadow-xs inline-flex items-center space-x-2"
                  >
                    <span>{generatingQuestions ? 'Generating Questions with AI...' : 'Generate Practice Questions (4 Questions)'}</span>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </button>
                </div>
              ) : (
                activeSession.practiceQuestions.map((q, idx) => {
                  const evalResult = q.latestAttempt;
                  const isSubmitting = submittingPractice[q.id] || false;
                  const currentAnswer = practiceAnswers[q.id] ?? (evalResult ? evalResult.answerText : '');
                  const hintRevealed = revealedHints[q.id] || false;

                  return (
                    <div key={q.id} className="border border-line bg-paper rounded-sm overflow-hidden shadow-2xs">
                      {/* Question Header */}
                      <div className="p-3 bg-paper-dark border-b border-line flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-accent">#{idx + 1}</span>
                          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-paper border border-line text-ink rounded-xs">
                            {q.questionType}
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-paper border border-line text-muted rounded-xs">
                            {q.difficulty}
                          </span>
                        </div>
                        {evalResult && (
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-xs border ${
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
                      <div className="p-4 space-y-3.5">
                        <p className="text-xs font-medium text-ink leading-relaxed whitespace-pre-wrap">
                          {q.questionText}
                        </p>

                        {/* MCQ Options */}
                        {q.options && q.options.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-start space-x-2.5 p-2 rounded-xs border text-xs cursor-pointer transition-colors ${
                                  currentAnswer === opt
                                    ? 'bg-accent-subtle/30 border-accent text-ink font-medium'
                                    : 'bg-paper border-line text-ink hover:bg-paper-dark'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.id}`}
                                  value={opt}
                                  checked={currentAnswer === opt}
                                  onChange={(e) => setPracticeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  className="mt-0.5 text-accent"
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
                            placeholder="Type your technical answer here as you would in a technical interview..."
                            rows={3}
                            className="w-full p-2.5 bg-paper border border-line rounded-xs text-xs text-ink font-mono focus:outline-none focus:border-ink transition-colors"
                          />
                        )}

                        {/* Hint Box */}
                        {hintRevealed && q.hint && (
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xs flex items-start space-x-2 text-xs text-amber-900 animate-in fade-in">
                            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="leading-normal">{q.hint}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-line">
                          {q.hint ? (
                            <button
                              type="button"
                              onClick={() => setRevealedHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                              className="font-mono text-xs text-muted hover:text-ink flex items-center space-x-1"
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>{hintRevealed ? 'Hide Hint' : 'Need a Hint?'}</span>
                            </button>
                          ) : <div />}

                          <button
                            type="button"
                            disabled={isSubmitting || !currentAnswer.trim()}
                            onClick={() => handleSubmitPractice(q.id)}
                            className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-semibold rounded-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-2xs"
                          >
                            <span>{isSubmitting ? 'Evaluating with AI...' : evalResult ? 'Re-Evaluate Answer' : 'Submit Answer'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-accent" />
                          </button>
                        </div>

                        {/* Real AI Evaluation Breakdown */}
                        {evalResult && (
                          <div className="mt-3 p-3.5 bg-paper-dark border border-line rounded-xs space-y-2 text-xs animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-line pb-2">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                                AI EVALUATION BREAKDOWN
                              </span>
                              <span className="font-mono text-[10px] text-muted">
                                Evaluated on technical accuracy, completeness, and interview readiness
                              </span>
                            </div>

                            {evalResult.whatYouGotRight && (
                              <div className="space-y-0.5">
                                <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase">What you got right:</span>
                                <p className="text-ink leading-normal">{evalResult.whatYouGotRight}</p>
                              </div>
                            )}

                            {evalResult.whatIsMissing && (
                              <div className="space-y-0.5">
                                <span className="font-mono text-[10px] font-bold text-amber-800 uppercase">What is missing:</span>
                                <p className="text-ink leading-normal">{evalResult.whatIsMissing}</p>
                              </div>
                            )}

                            {evalResult.technicalCorrection && (
                              <div className="space-y-0.5">
                                <span className="font-mono text-[10px] font-bold text-rose-800 uppercase">Technical correction:</span>
                                <p className="text-ink leading-normal">{evalResult.technicalCorrection}</p>
                              </div>
                            )}

                            {evalResult.betterInterviewAnswer && (
                              <div className="p-2.5 bg-paper border border-line rounded-xs space-y-1">
                                <span className="font-mono text-[10px] font-bold text-ink uppercase">Senior SDE Interview Answer:</span>
                                <p className="text-ink font-mono text-[11px] leading-relaxed">{evalResult.betterInterviewAnswer}</p>
                              </div>
                            )}

                            {evalResult.interviewTip && (
                              <div className="text-[11px] text-muted italic">
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

          {/* TAB 3: MOCK INTERVIEW */}
          {activeTab === 'mock' && (
            <div className="space-y-5">
              {!activeMock ? (
                <div className="border border-line bg-paper p-6 rounded-sm text-center space-y-4 shadow-2xs">
                  <div className="w-12 h-12 bg-ink text-paper rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Mic className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      Adaptive Technical Mock Interview
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto mt-1">
                      Simulate a live technical interview on <strong>{activeSession.topic}</strong>. The AI interviewer asks questions sequentially and dynamically adapts follow-ups based on your answers.
                    </p>
                  </div>
                  <button
                    onClick={handleStartMock}
                    disabled={startingMock}
                    className="px-5 py-2.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-sm transition-colors shadow-xs inline-flex items-center space-x-2"
                  >
                    <span>{startingMock ? 'Preparing Interviewer...' : 'Start Mock Interview (4 Questions)'}</span>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </button>
                </div>
              ) : (
                <div className="border border-line bg-paper rounded-sm overflow-hidden space-y-4 p-5 shadow-2xs">
                  {/* Mock Status Header */}
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-paper-dark border border-line text-accent rounded-xs">
                        {activeMock.status === 'COMPLETED' ? 'INTERVIEW COMPLETE' : `QUESTION ${activeMock.currentQuestionIndex + 1} OF ${activeMock.targetQuestions}`}
                      </span>
                      <h3 className="font-display text-base font-bold text-ink mt-1">
                        Mock Interview: {activeMock.topic}
                      </h3>
                    </div>

                    {activeMock.status === 'COMPLETED' && activeMock.overallScore != null && (
                      <span className="font-mono text-sm font-black px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 rounded-xs">
                        Overall Score: {activeMock.overallScore}%
                      </span>
                    )}
                  </div>

                  {/* Turn History */}
                  <div className="space-y-3.5 divide-y divide-line">
                    {activeMock.questions.map((mq) => (
                      <div key={mq.id} className="pt-3 space-y-2">
                        {/* Question Bubble */}
                        <div className="flex items-start space-x-2.5 bg-paper-dark p-3 rounded-xs border border-line">
                          <span className="font-mono text-xs font-bold text-accent shrink-0">INTERVIEWER:</span>
                          <p className="text-xs text-ink font-medium leading-relaxed">{mq.questionText}</p>
                        </div>

                        {/* Candidate Answer */}
                        {mq.answer && (
                          <div className="pl-6 space-y-2">
                            <div className="flex items-start space-x-2 bg-paper p-3 rounded-xs border border-line">
                              <span className="font-mono text-xs font-bold text-muted shrink-0">YOU:</span>
                              <p className="text-xs text-ink leading-relaxed font-mono">{mq.answer.answerText}</p>
                            </div>

                            {/* Evaluation Note */}
                            <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs text-xs space-y-1 font-sans">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold uppercase text-accent">Turn Score: {mq.answer.score}/10</span>
                                <span className="text-[10px] text-muted">{mq.answer.evaluationSummary}</span>
                              </div>
                              {mq.answer.betterResponse && (
                                <p className="text-[11px] text-muted pt-1 border-t border-line font-mono">
                                  <strong>Model Response:</strong> {mq.answer.betterResponse}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Active Question Input if In Progress */}
                  {activeMock.status === 'IN_PROGRESS' && activeMock.currentQuestion && (
                    <div className="pt-3 border-t border-line space-y-3">
                      <label className="font-mono text-[11px] font-bold text-muted uppercase block">
                        Your Technical Response
                      </label>
                      <textarea
                        value={mockAnswerInput}
                        onChange={(e) => setMockAnswerInput(e.target.value)}
                        placeholder="State your technical answer clearly as if speaking directly to the hiring manager..."
                        rows={4}
                        className="w-full p-3 bg-paper border border-line rounded-xs text-xs text-ink font-mono focus:outline-none focus:border-ink transition-colors"
                      />
                      <div className="flex justify-end">
                        <button
                          disabled={submittingMock || !mockAnswerInput.trim()}
                          onClick={handleSubmitMockAnswer}
                          className="px-5 py-2 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-2xs"
                        >
                          <span>{submittingMock ? 'Evaluating & Adapting...' : 'Submit Response →'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Completed Final Evaluation Report */}
                  {activeMock.status === 'COMPLETED' && activeMock.report && (
                    <div className="pt-4 border-t border-line space-y-4 animate-in fade-in">
                      <div className="p-4 bg-paper-dark border border-line rounded-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold uppercase text-accent">
                            FINAL EXECUTIVE EVALUATION REPORT
                          </span>
                          <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-paper border border-line text-ink rounded-xs">
                            {activeMock.report.readinessLevel}
                          </span>
                        </div>

                        <p className="text-xs text-ink leading-relaxed">
                          {activeMock.report.executiveSummary}
                        </p>

                        {/* Rubric Radar Table */}
                        {activeMock.report.rubricScores && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-line">
                            {Object.entries(activeMock.report.rubricScores).map(([category, val]) => (
                              <div key={category} className="p-2 bg-paper border border-line rounded-xs text-center">
                                <span className="font-mono text-[9px] text-muted uppercase block truncate">{category}</span>
                                <span className="font-mono text-sm font-bold text-ink">{val}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Strong & Weak Areas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 bg-paper border border-line rounded-xs space-y-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-emerald-800">STRONG AREAS</span>
                          <ul className="text-xs space-y-1 text-ink list-disc list-inside">
                            {activeMock.report.strongAreas.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3.5 bg-paper border border-line rounded-xs space-y-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-amber-800">AREAS TO REVISE</span>
                          <ul className="text-xs space-y-1 text-ink list-disc list-inside">
                            {activeMock.report.weakAreas.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Recommended Next Step */}
                      {activeMock.report.recommendedNextTopic && (
                        <div className="p-3.5 bg-accent-subtle/30 border border-accent/30 rounded-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono text-[10px] font-bold uppercase text-accent">RECOMMENDED NEXT TOPIC</span>
                            <p className="text-xs font-bold text-ink mt-0.5">{activeMock.report.recommendedNextTopic}</p>
                          </div>
                          <button
                            onClick={() => {
                              setTopicInput(activeMock.report!.recommendedNextTopic);
                              setActiveSession(null);
                              setActiveMock(null);
                              handleGenerateSession(activeMock.report!.recommendedNextTopic);
                            }}
                            className="px-3 py-1.5 bg-ink text-paper font-mono text-xs font-semibold rounded-xs shadow-2xs"
                          >
                            Practice Next Topic →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CODING PRACTICE */}
          {activeTab === 'coding' && (
            <div className="space-y-4">
              {activeSession.codingProblems.length === 0 ? (
                <div className="border border-line bg-paper p-8 text-center space-y-4 rounded-sm shadow-2xs">
                  <div className="w-12 h-12 bg-ink text-paper rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <Code className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">
                      Generate Coding Challenge with AI
                    </h3>
                    <p className="text-xs text-muted max-w-md mx-auto mt-1">
                      Practice writing real code for <strong>{activeSession.topic}</strong>. The AI will provide starter code, constraints, test cases, and analyze your solution with a thorough code review.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateCodingProblem}
                    disabled={generatingProblem}
                    className="px-5 py-2.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-sm transition-colors shadow-xs inline-flex items-center space-x-2"
                  >
                    <span>{generatingProblem ? 'Generating Coding Challenge with AI...' : 'Generate Coding Challenge'}</span>
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </button>
                </div>
              ) : (
                activeSession.codingProblems.map((prob) => {
                  const currentCode = codeInputs[prob.id] ?? prob.starterCode ?? '';
                  const isReviewing = submittingCode[prob.id] || false;
                  const isHintLoading = loadingHintMap[prob.id] || false;
                  const isSolutionLoading = loadingSolutionMap[prob.id] || false;
                  const review = prob.latestAttempt;
                  const revealedHints = revealedHintsMap[prob.id] || (prob.hints && prob.hints.length > 0 ? [prob.hints[0]] : (prob.hint ? [prob.hint] : []));
                  const revealedSolution = revealedSolutionMap[prob.id] || prob.solution;
                  const isSolutionVisible = Boolean(showSolutionMap[prob.id] && (revealedSolutionMap[prob.id] || prob.solution));

                  return (
                    <div key={prob.id} className="border border-line bg-paper rounded-sm overflow-hidden space-y-4 p-5 shadow-2xs">
                      {/* Problem Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-paper-dark border border-line text-muted rounded-xs">
                              {prob.difficulty}
                            </span>
                            <span className="font-mono text-[10px] text-muted uppercase">
                              {activeSession.technology || 'Java'}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-accent-subtle/30 text-accent border border-accent/30 rounded-xs uppercase">
                              {prob.questionType === 'METHOD' ? 'Java Method' : 'Java Program (Main Class)'}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-ink mt-1">{prob.title}</h3>
                        </div>

                        {review && (
                          <div>
                            {getReviewBadge(review.status, review.score)}
                          </div>
                        )}
                      </div>

                      {/* Problem Statement */}
                      <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                        {prob.problemStatement}
                      </p>

                      {/* Structure Guidance Banner for Beginners */}
                      <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs flex items-center justify-between text-xs font-mono text-muted">
                        <span>
                          {prob.questionType === 'METHOD'
                            ? '💡 Format: Implement the requested Java method within the class.'
                            : '💡 Format: Complete runnable program with public class Main and public static void main(String[] args).'}
                        </span>
                      </div>

                      {/* Examples */}
                      {prob.examples && prob.examples.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase">Examples</span>
                          <div className="space-y-2">
                            {prob.examples.map((ex, exIdx) => (
                              <div key={exIdx} className="p-2.5 bg-paper-dark border border-line rounded-xs font-mono text-xs space-y-1">
                                <p><strong>Input:</strong> {ex.input}</p>
                                <p><strong>Output:</strong> {ex.output}</p>
                                {ex.explanation && <p className="text-muted text-[11px] font-sans"><strong>Explanation:</strong> {ex.explanation}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Constraints */}
                      {prob.constraints && prob.constraints.length > 0 && (
                        <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs">
                          <span className="font-mono text-[10px] font-bold text-muted uppercase block mb-1">Constraints</span>
                          <ul className="font-mono text-xs text-muted list-disc list-inside space-y-0.5">
                            {prob.constraints.map((c, cIdx) => (
                              <li key={cIdx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Progressive Hints Card */}
                      {revealedHints.length > 0 && (
                        <div className="p-3.5 bg-accent-subtle/20 border border-accent/30 rounded-xs space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold uppercase text-accent flex items-center space-x-1.5">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>CONCEPTUAL HINTS ({revealedHints.length}/3)</span>
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {revealedHints.map((hintText, hIdx) => (
                              <div key={hIdx} className="text-xs text-ink font-sans flex items-start space-x-2">
                                <span className="font-mono text-[10px] font-bold text-accent shrink-0 mt-0.5">#{hIdx + 1}</span>
                                <p className="leading-relaxed">{hintText}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Code Editor Area */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-muted uppercase block">
                            Solution Editor ({activeSession.technology || 'Java'} · {prob.questionType === 'METHOD' ? 'Method' : 'Main Class'})
                          </span>
                          <span className="font-mono text-[10px] text-muted">
                            Write your code & submit for AI review
                          </span>
                        </div>
                        <textarea
                          id={`code-editor-${prob.id}`}
                          value={currentCode}
                          onChange={(e) => setCodeInputs((prev) => ({ ...prev, [prob.id]: e.target.value }))}
                          rows={10}
                          className="w-full p-3 bg-[#1C1917] text-[#FBFBFA] border border-line rounded-xs text-xs font-mono focus:outline-none focus:border-accent leading-relaxed"
                          placeholder="// Write your solution here..."
                        />
                      </div>

                      {/* Learning & Submission Actions Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-line">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isHintLoading}
                            onClick={() => handleGetCodingHint(prob.id)}
                            className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-2xs"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-accent" />
                            <span>
                              {isHintLoading
                                ? 'Generating Hint...'
                                : revealedHints.length > 0
                                ? `Get Next Hint (${revealedHints.length}/3)`
                                : 'Get Hint'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isSolutionLoading}
                            onClick={() => handleToggleCodingSolution(prob.id)}
                            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-2xs ${
                              isSolutionVisible
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-900 hover:bg-amber-500/30'
                                : 'bg-accent-subtle/30 border border-accent/40 hover:border-accent text-ink'
                            }`}
                          >
                            {isSolutionVisible ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                                <span>Hide Solution</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-accent" />
                                <span>{isSolutionLoading ? 'Revealing Solution...' : 'View Solution'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSubmitCode(prob.id)}
                          disabled={isReviewing || !currentCode.trim()}
                          className="px-5 py-2 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-2xs"
                        >
                          <span>{isReviewing ? 'Analyzing Code with AI...' : 'Submit Code for AI Review'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-accent" />
                        </button>
                      </div>

                      {/* COMPLETE REVEALED REFERENCE SOLUTION (Zero Penalty, Hidden by Default) */}
                      {isSolutionVisible && revealedSolution && (
                        <div
                          id={`solution-card-${prob.id}`}
                          className="border border-accent/40 bg-accent-subtle/10 rounded-sm p-4 space-y-4 animate-in fade-in duration-200 mt-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-accent/20 gap-2">
                            <div>
                              <div className="flex items-center space-x-2">
                                <Sparkles className="w-4 h-4 text-accent" />
                                <span className="font-mono text-xs font-black uppercase text-accent">
                                  COMPLETE REFERENCE SOLUTION
                                </span>
                                <span className="font-mono text-[10px] px-1.5 py-0.2 bg-paper border border-line text-muted rounded-xs">
                                  {prob.questionType === 'METHOD' ? 'METHOD' : 'FULL PROGRAM'}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted mt-0.5 font-sans">
                                Reviewing the solution will not penalize your practice progress or mark this problem solved.
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleHideCodingSolution(prob.id)}
                                className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-muted hover:text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                              >
                                <EyeOff className="w-3.5 h-3.5 text-muted" />
                                <span>Hide Solution</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTryAgain(prob.id)}
                                className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-bold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-accent" />
                                <span>Try Again / Write Code</span>
                              </button>
                            </div>
                          </div>

                          {/* Reference Code Block */}
                          <div className="space-y-1.5">
                            <span className="font-mono text-[10px] font-bold text-muted uppercase">Reference Code</span>
                            <pre className="p-3 bg-[#1C1917] text-[#FBFBFA] border border-line rounded-xs font-mono text-xs overflow-x-auto leading-relaxed">
                              <code>{revealedSolution.code}</code>
                            </pre>
                          </div>

                          {/* Approach & Explanation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-accent uppercase">Algorithmic Approach</span>
                              <p className="text-xs text-ink font-medium">{revealedSolution.approach}</p>
                              {revealedSolution.whyItWorks && (
                                <p className="text-[11px] text-muted pt-1 border-t border-line font-sans">
                                  {revealedSolution.whyItWorks}
                                </p>
                              )}
                            </div>

                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase">Complexity Analysis</span>
                              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                                <div className="p-1.5 bg-paper-dark border border-line rounded-xs">
                                  <span className="text-[9px] text-muted block">Time</span>
                                  <span className="font-bold text-ink">{revealedSolution.timeComplexity}</span>
                                </div>
                                <div className="p-1.5 bg-paper-dark border border-line rounded-xs">
                                  <span className="text-[9px] text-muted block">Space</span>
                                  <span className="font-bold text-ink">{revealedSolution.spaceComplexity}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Step-by-Step Explanation */}
                          {revealedSolution.explanation && (
                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase">Step-by-Step Explanation</span>
                              <p className="text-xs text-ink leading-relaxed font-sans whitespace-pre-wrap">
                                {revealedSolution.explanation}
                              </p>
                            </div>
                          )}

                          {/* Important Syntax & Language Notes */}
                          {revealedSolution.syntaxNotes && (
                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase">Syntax & Language Notes</span>
                              <p className="text-xs text-ink leading-relaxed font-sans">
                                {revealedSolution.syntaxNotes}
                              </p>
                            </div>
                          )}

                          {/* Example Walkthrough */}
                          {revealedSolution.exampleWalkthrough && (
                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase">Example Walkthrough</span>
                              <p className="text-xs text-ink font-mono whitespace-pre-wrap leading-relaxed">
                                {revealedSolution.exampleWalkthrough}
                              </p>
                            </div>
                          )}

                          {/* Edge Cases */}
                          {revealedSolution.edgeCases && revealedSolution.edgeCases.length > 0 && (
                            <div className="p-3 bg-paper border border-line rounded-xs space-y-1">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase">Critical Edge Cases Handled</span>
                              <ul className="text-xs text-ink font-mono list-disc list-inside space-y-0.5">
                                {revealedSolution.edgeCases.map((ec, ecIdx) => (
                                  <li key={ecIdx}>{ec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bottom Try Again Action */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleTryAgain(prob.id)}
                              className="px-4 py-2 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors shadow-2xs flex items-center space-x-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-accent" />
                              <span>Try Again (Solve It In Editor)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Real AI Code Review Feedback */}
                      {review && (
                        <div className="p-4 bg-paper-dark border border-line rounded-xs space-y-3 text-xs animate-in fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-2 gap-2">
                            <span className="font-mono text-[10px] font-bold uppercase text-accent">
                              AI CODE REVIEW & COMPLEXITY ANALYSIS
                            </span>
                            {getReviewBadge(review.status, review.score)}
                          </div>

                          <div className="space-y-1">
                            <span className="font-mono text-[10px] font-bold text-muted uppercase">Summary</span>
                            <p className="text-ink font-medium leading-relaxed">{review.summary}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="font-mono text-[10px] font-bold text-muted uppercase">Technical Correctness Analysis</span>
                            <p className="text-muted leading-relaxed font-sans whitespace-pre-wrap">{review.correctnessAnalysis}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                            <div className="p-2 bg-paper border border-line rounded-xs">
                              <span className="text-[10px] text-muted block">Time Complexity</span>
                              <span className="font-bold text-ink">{review.timeComplexity}</span>
                            </div>
                            <div className="p-2 bg-paper border border-line rounded-xs">
                              <span className="text-[10px] text-muted block">Space Complexity</span>
                              <span className="font-bold text-ink">{review.spaceComplexity}</span>
                            </div>
                          </div>

                          {review.edgeCases && review.edgeCases.length > 0 && (
                            <div className="pt-2 border-t border-line">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase block mb-1">Edge Cases Evaluation</span>
                              <ul className="list-disc list-inside text-muted space-y-0.5 font-mono">
                                {review.edgeCases.map((ec, ecIdx) => (
                                  <li key={ecIdx}>{ec}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {review.suggestedImprovements && review.suggestedImprovements.length > 0 && (
                            <div className="pt-2 border-t border-line">
                              <span className="font-mono text-[10px] font-bold text-muted uppercase block mb-1">Key Improvements</span>
                              <ul className="list-disc list-inside text-muted space-y-0.5 font-sans">
                                {review.suggestedImprovements.map((imp, iIdx) => (
                                  <li key={iIdx}>{imp}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {review.optimizedSolution && (
                            <div className="pt-2 border-t border-line space-y-1">
                              <span className="font-mono text-[10px] font-bold text-accent uppercase block">
                                Recommended / Correct Pattern
                              </span>
                              <pre className="p-2.5 bg-[#1C1917] text-[#FBFBFA] rounded-xs font-mono text-xs overflow-x-auto">
                                <code>{review.optimizedSolution}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: ASK COACH */}
          {activeTab === 'coach' && (
            <div className="border border-line bg-paper rounded-sm overflow-hidden p-4 space-y-4 shadow-2xs">
              <div className="border-b border-line pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                  AI TECHNICAL INTERVIEW COACH
                </span>
                <h3 className="font-display text-sm font-bold text-ink mt-0.5">
                  Ask anything about technology, coding, interviews, or concepts
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  General-purpose technical coach powered by Gemini 2.5 Flash. You can ask any software question or switch topics anytime.
                </p>
              </div>

              {/* Chat Message History */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {activeSession.coachMessages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted space-y-3">
                    <p>Ask anything about concepts, code examples, interview questions, architecture, or debugging.</p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                      {[
                        'What is inheritance in Java?',
                        'Explain polymorphism with code',
                        'Give me an SQL joins interview question',
                        'Explain dependency injection in Spring Boot',
                        'What is Docker and how does it work?',
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCoachInput(s)}
                          className="px-2 py-1 bg-paper-dark border border-line hover:border-ink rounded-xs font-mono text-[10px] text-ink transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activeSession.coachMessages.map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}
                    >
                      <span className="font-mono text-[9px] text-muted mb-1 uppercase">
                        {msg.role === 'USER' ? 'You' : 'EngineerSpace Coach'}
                      </span>
                      <div
                        className={`p-3 rounded-xs text-xs max-w-xl leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'USER'
                            ? 'bg-ink text-paper font-mono'
                            : 'bg-paper-dark border border-line text-ink'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Coach Input Bar */}
              <form onSubmit={handleSendCoachMessage} className="pt-2 border-t border-line flex items-center space-x-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  placeholder="Ask anything about technology, coding, interviews, or concepts..."
                  className="flex-1 p-2.5 bg-paper border border-line rounded-xs text-xs text-ink focus:outline-none focus:border-ink transition-colors"
                />
                <button
                  type="submit"
                  disabled={sendingCoach || !coachInput.trim()}
                  className="px-4 py-2.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  <Send className="w-3.5 h-3.5 text-accent" />
                  <span>{sendingCoach ? 'Thinking...' : 'Ask AI'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* 3. LAB HOME & GENERATION DASHBOARD */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Natural Language Topic Input Box */}
          <div className="border border-line bg-paper p-6 rounded-sm space-y-4 shadow-2xs">
            <div>
              <label className="font-mono text-xs font-bold text-ink uppercase tracking-wider block">
                WHAT DO YOU WANT TO LEARN OR PRACTICE?
              </label>
              <p className="text-xs text-muted mt-0.5">
                Ask a question, describe what you learned, or ask for a coding problem...
              </p>
            </div>

            <textarea
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Explain Java loops | I learned variables and data types | Give me a coding problem on if-else | Take a mock interview on Spring Boot"
              rows={3}
              className="w-full p-3 bg-paper border border-line rounded-xs text-xs text-ink font-sans focus:outline-none focus:border-ink transition-colors leading-relaxed"
            />

            {/* Quick Topic Suggestions (Exactly 3 small suggestions) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="font-mono text-[10px] text-muted uppercase mr-1">Try prompt:</span>
              {[
                'Explain Java loops',
                'Give me a coding problem on if-else',
                'Help me understand inheritance',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setTopicInput(chip)}
                  className="px-2.5 py-1 bg-paper-dark border border-line hover:border-ink text-[11px] text-ink rounded-xs transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-line">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-[10px] font-bold text-muted uppercase">Difficulty:</span>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                    className="p-1.5 bg-paper border border-line rounded-xs font-mono text-xs text-ink focus:outline-none"
                  >
                    <option value="BEGINNER">Beginner (Default)</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-[10px] font-bold text-muted uppercase">Tech:</span>
                  <select
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value)}
                    className="p-1.5 bg-paper border border-line rounded-xs font-mono text-xs text-ink focus:outline-none"
                  >
                    <option value="Auto Detect">Auto Detect (Default)</option>
                    <option value="Java">Java</option>
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
                className="w-full sm:w-auto px-6 py-2.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-sm transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 shadow-xs"
              >
                <span>{generating ? 'Preparing your practice...' : 'START PRACTICE'}</span>
                <ArrowRight className="w-4 h-4 text-accent" />
              </button>
            </div>
          </div>

          {/* YOUR RECENT PRACTICE (Only shown if real sessions exist in database) */}
          {recentSessions.length > 0 && (
            <div className="border border-line bg-paper rounded-sm p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                  YOUR RECENT PRACTICE
                </span>
                <span className="font-mono text-[10px] text-muted">
                  {recentSessions.length} sessions saved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleOpenSession(s.id)}
                    className="p-3.5 bg-paper border border-line hover:border-ink rounded-xs cursor-pointer transition-all space-y-2 shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 bg-paper-dark border border-line text-ink rounded-xs">
                        {s.technology || 'Java'}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {s.createdAt ? s.createdAt.substring(0, 10) : ''}
                      </span>
                    </div>
                    <h4 className="font-display text-xs font-bold text-ink group-hover:text-accent transition-colors truncate">
                      {s.topic}
                    </h4>
                    <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                      {s.summary || s.userInput}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-line text-[10px] font-mono text-muted">
                      <span>{s.difficulty || 'Beginner'}</span>
                      <span className="text-accent group-hover:translate-x-0.5 transition-transform">Resume →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity / Mock History (Only shown if real history exists) */}
          {history.length > 0 && (
            <div className="border border-line bg-paper rounded-sm p-4 space-y-3 shadow-2xs">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted block border-b border-line pb-2">
                YOUR RECENT INTERVIEW ACTIVITY
              </span>
              <div className="divide-y divide-line">
                {history.slice(0, 5).map((h, hIdx) => (
                  <div key={hIdx} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 bg-paper-dark border border-line text-ink rounded-xs">
                        {h.type === 'MOCK_INTERVIEW' ? 'MOCK INTERVIEW' : 'PRACTICE'}
                      </span>
                      <span className="font-medium text-ink">{h.topic}</span>
                      <span className="font-mono text-[10px] text-muted">· {h.technology}</span>
                    </div>
                    <div className="flex items-center space-x-3 self-start sm:self-auto">
                      {h.score != null && (
                        <span className="font-mono font-bold text-ink">{h.score}%</span>
                      )}
                      <span className="font-mono text-[10px] text-muted">
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
