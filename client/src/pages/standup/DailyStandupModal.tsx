import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Mic, Square, RotateCcw, Send, CheckCircle2, 
  AlertTriangle, PenTool, FileDown, Loader2 
} from 'lucide-react';
import { api, getLocalTodayDateString } from '../../services/api';
import { Standup } from '../../types';
import { StandupAudioPlayer } from '../../components/common/StandupAudioPlayer';

interface DailyStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmitted?: () => void;
  initialMode?: 'WRITE' | 'VOICE' | 'VIEW';
  viewOnly?: boolean;
  isEditing?: boolean;
  targetDate?: string;
  initialStandup?: Standup | null;
  modalTitle?: string;
}

export const DailyStandupModal: React.FC<DailyStandupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSubmitted,
  initialMode = 'WRITE',
  viewOnly = false,
  isEditing = false,
  targetDate,
  initialStandup,
  modalTitle,
}) => {
  const effectiveDate = targetDate || initialStandup?.date || getLocalTodayDateString();

  // Mode: WRITE | VOICE | VIEW
  const [activeTab, setActiveTab] = useState<'WRITE' | 'VOICE' | 'VIEW'>(initialMode);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [existingStandup, setExistingStandup] = useState<Standup | null>(null);

  // Form states (Written)
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [learned, setLearned] = useState('');
  const [confidence, setConfidence] = useState<number>(4);
  const [questionForLead, setQuestionForLead] = useState('');

  // Form states (Voice)
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Submission / status states
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for media recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStandup) {
        setExistingStandup(initialStandup);
        setYesterday(initialStandup.yesterday || '');
        setToday(initialStandup.today || '');
        setBlockers(initialStandup.blockers || '');
        setLearned(initialStandup.learned || '');
        setConfidence(initialStandup.confidence || 4);
        setQuestionForLead(initialStandup.questionForLead || '');
        setActiveTab('VIEW');
        setLoadingInitial(false);
      } else {
        loadTodayStandup();
      }
    } else {
      cleanupVoice();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, effectiveDate, initialStandup]);

  const cleanupVoice = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAudioBlob(null);
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const loadTodayStandup = async () => {
    setLoadingInitial(true);
    setErrorMessage(null);
    try {
      const standup = await api.getTodayStandup(effectiveDate);
      if (standup) {
        setExistingStandup(standup);
        setYesterday(standup.yesterday || '');
        setToday(standup.today || '');
        setBlockers(standup.blockers || '');
        setLearned(standup.learned || '');
        setConfidence(standup.confidence || 4);
        setQuestionForLead(standup.questionForLead || '');

        if (viewOnly || (!isEditing && initialMode === 'VIEW')) {
          setActiveTab('VIEW');
        } else if (isEditing) {
          setActiveTab(standup.hasVoiceRecording || standup.submissionType === 'VOICE' ? 'VOICE' : 'WRITE');
        } else {
          setActiveTab(initialMode);
        }
      } else {
        setExistingStandup(null);
        setActiveTab(initialMode === 'VIEW' ? 'WRITE' : initialMode);
      }
    } catch (err: any) {
      console.warn('Could not load existing standup:', err);
      setActiveTab(initialMode === 'VIEW' ? 'WRITE' : initialMode);
    } finally {
      setLoadingInitial(false);
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAudioBlob(null);
    audioChunksRef.current = [];
    setRecordSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Voice recording is not supported in this browser. Please use Chrome, Edge, or Firefox.');
        return;
      }

      // Studio-grade audio constraints for maximum voice clarity & background noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      let mimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/wav',
      ];

      for (const t of candidateTypes) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const options: MediaRecorderOptions = {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 128000, // 128 kbps crystal-clear studio voice recording
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const finalBlob = new Blob(audioChunksRef.current, { type: finalType });
        if (finalBlob.size > 0) {
          const url = URL.createObjectURL(finalBlob);
          setAudioBlob(finalBlob);
          setPreviewUrl(url);
        } else {
          setErrorMessage('No audio was captured. Please check your microphone and try again.');
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev: number) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in browser settings.'
          : 'Failed to access microphone. Please check your audio input device.'
      );
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        // requestData may fail if recorder is already stopping
      }
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterday.trim() || !today.trim() || !learned.trim()) {
      setErrorMessage('Please fill in all required fields (Yesterday, Today, Learned).');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const saved = await api.submitStandup({
        date: effectiveDate,
        yesterday: yesterday.trim(),
        today: today.trim(),
        blockers: blockers.trim() ? blockers.trim() : undefined,
        learned: learned.trim(),
        confidence,
        questionForLead: questionForLead.trim() ? questionForLead.trim() : undefined,
      });

      setExistingStandup(saved);
      setSuccessMessage('Daily Standup submitted successfully!');
      window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
      onSuccess?.();
      onSubmitted?.();
      setActiveTab('VIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit daily standup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBlob) {
      setErrorMessage('Please record your voice standup before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const extension = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : audioBlob.type.includes('wav') ? 'wav' : 'webm';
      const file = new File([audioBlob], `standup_${effectiveDate}.${extension}`, { type: audioBlob.type || 'audio/webm' });

      const formData = new FormData();
      formData.append('voice', file);
      formData.append('audio', file);
      formData.append('date', effectiveDate);
      formData.append('durationSeconds', String(recordSeconds || 0));
      if (confidence) {
        formData.append('confidence', String(confidence));
      }
      if (questionForLead.trim()) {
        formData.append('questionForLead', questionForLead.trim());
      }

      const saved = await api.submitVoiceStandup(formData);
      setExistingStandup(saved);
      setSuccessMessage('Voice Standup recorded and submitted successfully!');
      window.dispatchEvent(new CustomEvent('jvm_standup_submitted'));
      onSuccess?.();
      onSubmitted?.();
      cleanupVoice();
      setActiveTab('VIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit voice standup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!existingStandup?.id) return;
    try {
      setDownloadingPdf(true);
      setErrorMessage(null);
      await api.downloadStandupPdf(existingStandup.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download standup PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const confidenceLabels = ['Blocked', 'Low', 'Moderate', 'High', 'Unstoppable'];

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-x-hidden font-sans outline-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-200 animate-fade-in cursor-pointer"
        style={{
          backgroundColor: 'rgba(15, 23, 20, 0.38)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-[110] bg-paper border border-line-dark w-full sm:max-w-2xl rounded-2xl shadow-modal flex flex-col max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-paper-light">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-ink text-paper rounded-sm">
              {activeTab === 'VOICE' ? <Mic className="w-4 h-4 text-accent" /> : <PenTool className="w-4 h-4 text-accent" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-bold text-base text-ink">
                  {modalTitle || 'Daily Standup'}
                </h2>
                <span className="font-mono text-[11px] px-2 py-0.5 bg-paper-dark border border-line text-muted rounded-xs">
                  {existingStandup?.date || effectiveDate}
                </span>
                {existingStandup && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    STANDUP DONE ✓
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted">
                {viewOnly 
                  ? 'Audit log of submitted daily engineering progress and focus.'
                  : 'One unified standup: capture accomplishments, today\'s goals, learnings & blockers.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls (Only shown when not view-only) */}
        {!viewOnly && !initialStandup && (
          <div className="px-4 pt-3 pb-2 border-b border-line bg-paper flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
            <div className="flex space-x-1.5 font-mono text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  cleanupVoice();
                  setActiveTab('WRITE');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'WRITE'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/25 shadow-2xs'
                    : 'bg-surface-raised hover:bg-surface-soft text-muted hover:text-ink border border-line'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Write Standup</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('VOICE');
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
                  activeTab === 'VOICE'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/25 shadow-2xs'
                    : 'bg-surface-raised hover:bg-surface-soft text-muted hover:text-ink border border-line'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Record Voice</span>
              </button>

              {existingStandup && (
                <button
                  type="button"
                  onClick={() => {
                    cleanupVoice();
                    setActiveTab('VIEW');
                  }}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
                    activeTab === 'VIEW'
                      ? 'bg-primary-soft text-primary font-bold border border-primary/25 shadow-2xs'
                      : 'bg-surface-raised hover:bg-surface-soft text-muted hover:text-ink border border-line'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>View Submitted</span>
                </button>
              )}
            </div>

            {existingStandup && activeTab !== 'VIEW' && (
              <button
                type="button"
                onClick={() => setActiveTab('VIEW')}
                className="text-[11px] font-mono text-primary hover:underline font-semibold"
              >
                View current submission
              </button>
            )}
          </div>
        )}

        {/* Alert Notifications */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 bg-attention/10 border border-attention/30 text-attention text-xs rounded-sm flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="m-4 mb-0 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs rounded-sm flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-mono">{successMessage}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingInitial ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-2 text-muted font-mono text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <span>Loading standup details...</span>
          </div>
        ) : (
          <div className="p-4 overflow-y-auto flex-1 space-y-4 font-sans text-xs">
            
            {/* ============================================================== */}
            {/* TAB 1: WRITE STANDUP FORM                                      */}
            {/* ============================================================== */}
            {activeTab === 'WRITE' && (
              <form onSubmit={handleWriteSubmit} className="space-y-4">
                {/* Accomplished Yesterday */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    1. What did you accomplish yesterday? <span className="text-attention">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={yesterday}
                    onChange={(e) => setYesterday(e.target.value)}
                    placeholder="e.g. Implemented custom thread pool rejection handler and verified thread queue saturation..."
                    className="w-full p-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none resize-none font-sans"
                  />
                </div>

                {/* Working on Today */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    2. What will you work on today? <span className="text-attention">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={today}
                    onChange={(e) => setToday(e.target.value)}
                    placeholder="e.g. Solve 3 tree traversal problems on LeetCode and draft JPA entity graphs for task history..."
                    className="w-full p-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none resize-none font-sans"
                  />
                </div>

                {/* Blockers */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-ink">
                      3. Any blockers or technical hurdles? (Optional)
                    </label>
                    <span className="font-mono text-[10px] text-attention font-medium">
                      Auto-generates Team Blocker
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder="e.g. High latency in Postgres connection pool during stress test, or need review on Auth filter..."
                    className="w-full p-2.5 bg-paper border border-line focus:border-attention rounded-sm text-xs outline-none resize-none font-sans"
                  />
                  {blockers.trim() && (
                    <p className="font-mono text-[10px] text-attention mt-1">
                      Note: Non-empty blockers will immediately appear on the Team Blocker Board for lead assistance.
                    </p>
                  )}
                </div>

                {/* Key Insight Learned */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    4. Key concept / insight learned? <span className="text-attention">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={learned}
                    onChange={(e) => setLearned(e.target.value)}
                    placeholder="e.g. Learned how ForkJoinPool carrier threads manage cooperative multitasking for Virtual Threads in Java 21..."
                    className="w-full p-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none resize-none font-sans"
                  />
                </div>

                {/* Confidence Level */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">
                    5. Confidence level for today's goals (1–5) <span className="text-attention">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const selected = confidence === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setConfidence(lvl)}
                          className={`py-2 px-2 border rounded-md text-center transition-all ${
                            selected
                              ? 'bg-primary-soft text-primary border-primary/40 shadow-2xs font-bold'
                              : 'bg-surface-raised hover:bg-surface-soft border-line text-ink'
                          }`}
                        >
                          <div className="font-mono text-sm">{lvl}</div>
                          <div className="text-[10px] truncate">{confidenceLabels[lvl - 1]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question / Note for Lead */}
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    6. Question or note for Team Lead? (Optional)
                  </label>
                  <input
                    type="text"
                    value={questionForLead}
                    onChange={(e) => setQuestionForLead(e.target.value)}
                    placeholder="e.g. Could you review PR #42 or discuss architecture on thread safety during 1:1?"
                    className="w-full p-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-md text-xs outline-none font-sans"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('VOICE')}
                    className="text-xs text-muted hover:text-ink font-mono flex items-center space-x-1 self-start sm:self-auto py-1"
                  >
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span>Prefer voice? Record voice instead</span>
                  </button>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 border border-line hover:border-line-dark rounded-md text-xs text-muted hover:text-ink transition-colors font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !yesterday.trim() || !today.trim() || !learned.trim()}
                      className="flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 bg-primary hover:bg-primary-hover active:scale-[0.99] text-paper text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 shadow-xs hover-lift"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-primary-soft" />
                          <span>{existingStandup ? 'Update Standup' : 'Submit Standup'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* TAB 2: RECORD VOICE STANDUP                                    */}
            {/* ============================================================== */}
            {activeTab === 'VOICE' && (
              <form onSubmit={handleVoiceSubmit} className="space-y-4">
                <div className="p-6 bg-paper-dark border border-line rounded-sm flex flex-col items-center justify-center text-center space-y-4">
                  
                  {!isRecording && !previewUrl && (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto text-accent">
                        <Mic className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-ink">
                          Record Daily Standup Voice Note
                        </h3>
                        <p className="font-mono text-xs text-muted max-w-sm mx-auto mt-1">
                          Speak your updates clearly: yesterday's achievements, today's goals, key learnings & blockers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-paper font-mono text-xs font-bold rounded-sm shadow-xs transition-colors inline-flex items-center space-x-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Start Recording</span>
                      </button>
                    </div>
                  )}

                  {isRecording && (
                    <div className="space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-attention/20 animate-ping absolute inset-0 mx-auto" />
                        <div className="w-20 h-20 rounded-full bg-attention text-white flex items-center justify-center mx-auto relative shadow-lg">
                          <Mic className="w-10 h-10 animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-mono text-2xl font-bold text-ink">
                          {formatTimer(recordSeconds)}
                        </div>
                        <p className="font-mono text-[11px] text-attention font-semibold uppercase tracking-wider">
                          ● Recording in progress...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-5 py-2.5 bg-attention hover:bg-attention/90 text-white font-mono text-xs font-bold rounded-sm shadow-xs transition-colors inline-flex items-center space-x-2"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop Recording</span>
                      </button>
                    </div>
                  )}

                  {!isRecording && previewUrl && (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-ink">
                          Audio Preview ({formatTimer(recordSeconds)})
                        </span>
                        <button
                          type="button"
                          onClick={startRecording}
                          className="font-mono text-xs text-muted hover:text-ink flex items-center space-x-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-record</span>
                        </button>
                      </div>

                      <StandupAudioPlayer
                        audioUrl={previewUrl}
                        initialDurationSeconds={recordSeconds}
                        title="Your Standup Voice Recording"
                        onRerecord={startRecording}
                      />
                    </div>
                  )}
                </div>

                {/* Additional Voice Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      Confidence Level (1–5)
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => {
                        const selected = confidence === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setConfidence(lvl)}
                            className={`py-1.5 border rounded-sm text-center font-mono text-xs transition-colors ${
                              selected
                                ? 'bg-ink text-paper border-ink font-bold'
                                : 'bg-paper hover:bg-paper-dark border-line text-ink'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Question or note for Team Lead?
                    </label>
                    <input
                      type="text"
                      value={questionForLead}
                      onChange={(e) => setQuestionForLead(e.target.value)}
                      placeholder="e.g. Blocked on deployment credentials..."
                      className="w-full p-2 bg-paper border border-line focus:border-ink rounded-sm text-xs outline-none font-sans"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('WRITE')}
                    className="text-xs text-muted hover:text-ink font-mono flex items-center space-x-1 self-start sm:self-auto py-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Prefer writing? Switch to text standup</span>
                  </button>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 border border-line hover:border-line-dark rounded-sm text-xs text-muted hover:text-ink transition-colors font-mono"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || isRecording || !audioBlob}
                      className="flex-1 sm:flex-initial px-4 py-2 sm:py-1.5 bg-accent hover:bg-accent-hover text-paper text-xs font-semibold rounded-sm transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading Voice...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Voice Standup</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ============================================================== */}
            {/* TAB 3: VIEW SUBMITTED STANDUP                                  */}
            {/* ============================================================== */}
            {activeTab === 'VIEW' && existingStandup && (
              <div className="space-y-4">
                {/* Voice player if present */}
                {(existingStandup.hasVoiceRecording || existingStandup.submissionType === 'VOICE') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-xs text-muted">
                      <span className="font-bold text-ink flex items-center space-x-1">
                        <Mic className="w-3.5 h-3.5 text-accent" />
                        <span>Voice Standup Recording</span>
                      </span>
                      {existingStandup.audioDurationSeconds ? (
                        <span className="font-mono text-xs text-accent font-bold">
                          {existingStandup.audioDurationSeconds} sec
                        </span>
                      ) : null}
                    </div>
                    <StandupAudioPlayer
                      standupId={existingStandup.id}
                      initialDurationSeconds={existingStandup.audioDurationSeconds || undefined}
                      title={modalTitle || `Standup Voice • ${existingStandup.userName || 'Member'}`}
                    />
                  </div>
                )}

                {/* Submitted text sections (Omitting empty fields) */}
                <div className="space-y-3">
                  {existingStandup.yesterday && (
                    <div className="p-3 bg-paper-dark border border-line rounded-sm space-y-1">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                        1. Accomplished Yesterday / Progress
                      </div>
                      <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                        {existingStandup.yesterday}
                      </p>
                    </div>
                  )}

                  {existingStandup.today && (
                    <div className="p-3 bg-paper-dark border border-line rounded-sm space-y-1">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                        2. Working on Today / Next Focus
                      </div>
                      <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                        {existingStandup.today}
                      </p>
                    </div>
                  )}

                  {existingStandup.learned && (
                    <div className="p-3 bg-paper-dark border border-line rounded-sm space-y-1">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                        3. Key Concept Learned
                      </div>
                      <p className="text-xs text-ink whitespace-pre-wrap leading-relaxed">
                        {existingStandup.learned}
                      </p>
                    </div>
                  )}

                  {existingStandup.blockers && (
                    <div className="p-3 bg-red-500/5 border border-red-500/30 rounded-sm space-y-1">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-700">
                        4. Blockers & Technical Hurdles
                      </div>
                      <p className="text-xs text-red-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {existingStandup.blockers}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confidence & Question for Lead */}
                {(existingStandup.confidence || existingStandup.questionForLead) && (
                  <div className="p-3 bg-paper-dark border border-line rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2 font-mono text-xs">
                    {existingStandup.confidence ? (
                      <div>
                        <span className="text-muted">Confidence Level: </span>
                        <span className="font-bold text-ink">
                          {existingStandup.confidence}/5 ({confidenceLabels[(existingStandup.confidence || 4) - 1]})
                        </span>
                      </div>
                    ) : <div />}

                    {existingStandup.questionForLead && (
                      <div className="text-ink">
                        <span className="text-muted">Note for Lead: </span>
                        <span className="italic font-sans text-xs">"{existingStandup.questionForLead}"</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Lead Answer if available */}
                {existingStandup.leadAnswer && (
                  <div className="p-3 bg-accent/5 border border-accent/20 rounded-sm space-y-1">
                    <div className="font-mono text-[10px] font-bold text-accent uppercase tracking-wider">
                      Lead Feedback / Response
                    </div>
                    <p className="text-xs text-ink font-sans">
                      {existingStandup.leadAnswer}
                    </p>
                  </div>
                )}

                {/* View Actions */}
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  {existingStandup.id ? (
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="px-3 py-1.5 border border-line hover:border-ink rounded-sm font-mono text-xs text-ink hover:bg-paper-dark transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {downloadingPdf ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-accent" />
                      )}
                      <span>Download PDF</span>
                    </button>
                  ) : <div />}

                  <div className="flex space-x-2">
                    {!viewOnly && !initialStandup && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('WRITE')}
                        className="px-3 py-1.5 bg-paper-dark hover:bg-line border border-line text-ink rounded-sm font-mono text-xs font-semibold transition-colors flex items-center space-x-1"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Edit Standup</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 bg-ink hover:bg-ink-light text-paper rounded-sm font-mono text-xs font-semibold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
