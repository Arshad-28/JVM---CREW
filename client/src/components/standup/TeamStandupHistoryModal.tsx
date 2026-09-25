import React, { useState, useEffect, useMemo } from 'react';
import { api, cacheStore } from '../../services/api';
import { Standup } from '../../types';
import { StandupAudioPlayer } from '../common/StandupAudioPlayer';
import {
  History,
  X,
  Mic,
  FileText,
  Play,
  Pause,
  FileDown,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Calendar,
  Volume2,
  ArrowLeft,
} from 'lucide-react';

interface TeamStandupHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamStandupHistoryModal: React.FC<TeamStandupHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const cachedHistory = cacheStore.get<Standup[]>('team_standup_history');
  const [historyList, setHistoryList] = useState<Standup[]>(() => cachedHistory || []);
  const [loading, setLoading] = useState<boolean>(!cachedHistory);
  const [error, setError] = useState<string | null>(null);

  // Active states
  const [playingStandupId, setPlayingStandupId] = useState<number | null>(null);
  const [selectedDetailStandup, setSelectedDetailStandup] = useState<Standup | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'VOICE' | 'WRITTEN'>('ALL');
  const [exportingDate, setExportingDate] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Load history data when modal opens
  const loadHistory = async () => {
    try {
      if (!historyList.length && !cachedHistory) {
        setLoading(true);
      }
      setError(null);
      const data = await api.getTeamStandupHistory();
      setHistoryList(data || []);
    } catch (err: any) {
      console.error('Failed to load team standup history:', err);
      setError(err?.message || 'Unable to load standup history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    } else {
      setPlayingStandupId(null);
      setSelectedDetailStandup(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDetailStandup) {
          setSelectedDetailStandup(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedDetailStandup, onClose]);

  // Filtered & Grouped History
  const filteredList = useMemo(() => {
    return historyList.filter((item) => {
      // Submission type filter
      const isVoice = item.submissionType === 'VOICE' || Boolean(item.hasVoiceRecording);
      if (filterType === 'VOICE' && !isVoice) return false;
      if (filterType === 'WRITTEN' && isVoice) return false;

      // Search query filter (Member Name, Date, Content)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.userName?.toLowerCase().includes(query);
        const matchesDate = item.date?.toLowerCase().includes(query);
        const matchesProgress = item.yesterday?.toLowerCase().includes(query) || item.today?.toLowerCase().includes(query);
        const matchesBlockers = item.blockers?.toLowerCase().includes(query);
        return matchesName || matchesDate || matchesProgress || matchesBlockers;
      }

      return true;
    });
  }, [historyList, filterType, searchQuery]);

  const dateGroups = useMemo(() => {
    const groups: { [date: string]: Standup[] } = {};
    filteredList.forEach((item) => {
      const d = item.date || 'Unknown Date';
      if (!groups[d]) groups[d] = [];
      groups[d].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => ({
        dateKey,
        items: groups[dateKey],
      }));
  }, [filteredList]);

  const formatGroupHeaderDate = (dateStr: string) => {
    try {
      const parsed = new Date(dateStr + 'T00:00:00');
      return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return dateStr.toUpperCase();
    }
  };

  const formatSubmissionTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString.substring(11, 16);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleExportDayPdf = async (dateKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setExportingDate(dateKey);
      await api.downloadTeamStandupPdf(dateKey);
    } catch (err: any) {
      alert('Failed to export day PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExportingDate(null);
    }
  };

  const handleExportIndividualPdf = async (standupId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setExportingId(standupId);
      await api.downloadStandupPdf(standupId);
    } catch (err: any) {
      alert('Failed to download standup PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden font-sans">
      <div
        className="bg-paper border border-line max-w-4xl w-full h-[85vh] max-h-[85vh] rounded-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* ========================================================================= */}
        {/* 1. STICKY MODAL HEADER                                                    */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-paper border-b border-line px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-base font-bold text-ink">
                  Team Standup History
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper-dark border border-line text-muted">
                  {historyList.length} Total
                </span>
              </div>
              <p className="font-mono text-xs text-muted">
                Review previous team updates and submissions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark rounded-sm transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUB-BAR: SEARCH & FILTERS                                              */}
        {/* ========================================================================= */}
        {!selectedDetailStandup && (
          <div className="shrink-0 bg-paper-dark/60 border-b border-line px-5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search by member, date, or update keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-paper border border-line focus:border-ink rounded-xs font-mono text-xs text-ink placeholder:text-muted focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="font-mono text-[10px] uppercase font-bold text-muted mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Type:</span>
              </span>
              {(['ALL', 'VOICE', 'WRITTEN'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-0.5 rounded-xs font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                    filterType === type
                      ? 'bg-ink text-paper'
                      : 'bg-paper border border-line text-muted hover:text-ink hover:border-ink/50'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type === 'VOICE' ? 'Voice' : 'Written'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SCROLLABLE CONTENT BODY                                                */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
          {/* VIEW DETAILS MODE (DRAWER VIEW) */}
          {selectedDetailStandup ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top back button bar */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <button
                  onClick={() => setSelectedDetailStandup(null)}
                  className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Standup History</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleExportIndividualPdf(selectedDetailStandup.id, e)}
                    disabled={exportingId === selectedDetailStandup.id}
                    className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5 text-accent" />
                    <span>{exportingId === selectedDetailStandup.id ? 'Exporting...' : 'Export Standup PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Standup Details Header Card */}
              <div className="p-4 bg-paper-dark/60 border border-line rounded-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-ink/10 border border-line flex items-center justify-center font-mono text-sm font-black text-ink shrink-0">
                      {getInitials(selectedDetailStandup.userName)}
                    </div>
                    <div>
                      <h4 className="font-mono text-sm font-bold text-ink">
                        {selectedDetailStandup.userName}
                      </h4>
                      <p className="font-mono text-xs text-muted flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatGroupHeaderDate(selectedDetailStandup.date)}</span>
                        {selectedDetailStandup.submittedAt && (
                          <>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{formatSubmissionTime(selectedDetailStandup.submittedAt)}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedDetailStandup.submissionType === 'VOICE' || selectedDetailStandup.hasVoiceRecording ? (
                      <span className="px-2 py-0.5 bg-accent/10 border border-accent/30 text-accent font-mono text-[11px] font-bold rounded-xs flex items-center space-x-1">
                        <Mic className="w-3 h-3" />
                        <span>VOICE STANDUP {selectedDetailStandup.audioDurationSeconds ? `• ${selectedDetailStandup.audioDurationSeconds} sec` : ''}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-paper border border-line text-muted font-mono text-[11px] font-bold rounded-xs flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>WRITTEN STANDUP</span>
                      </span>
                    )}

                    {selectedDetailStandup.confidence && (
                      <span className="px-2 py-0.5 bg-paper border border-line font-mono text-[11px] font-bold text-ink rounded-xs">
                        Confidence: {selectedDetailStandup.confidenceLabel || `${selectedDetailStandup.confidence}/5`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Voice Player in Detail View */}
                {(selectedDetailStandup.submissionType === 'VOICE' || selectedDetailStandup.hasVoiceRecording) && (
                  <div className="pt-2">
                    <StandupAudioPlayer
                      standupId={selectedDetailStandup.id}
                      initialDurationSeconds={selectedDetailStandup.audioDurationSeconds || undefined}
                      title={`${selectedDetailStandup.userName}'s Voice Recording (${selectedDetailStandup.date})`}
                      autoPlay={true}
                    />
                  </div>
                )}
              </div>

              {/* Standup Content Sections */}
              <div className="space-y-3 font-sans text-xs">
                {/* Yesterday / Completed */}
                <div className="p-3.5 bg-paper border border-line rounded-sm space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase text-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Yesterday / Progress</span>
                  </div>
                  <p className="text-ink leading-relaxed whitespace-pre-wrap pl-5">
                    {selectedDetailStandup.yesterday || (selectedDetailStandup.submissionType === 'VOICE' ? 'Recorded via voice standup.' : 'No previous progress specified.')}
                  </p>
                </div>

                {/* Today / Focus */}
                <div className="p-3.5 bg-paper border border-line rounded-sm space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase text-ink">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>Today / Focus</span>
                  </div>
                  <p className="text-ink leading-relaxed whitespace-pre-wrap pl-5">
                    {selectedDetailStandup.today || (selectedDetailStandup.submissionType === 'VOICE' ? 'Recorded via voice standup.' : 'No current focus specified.')}
                  </p>
                </div>

                {/* Learning / Concept */}
                {selectedDetailStandup.learned && (
                  <div className="p-3.5 bg-paper border border-line rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase text-ink">
                      <FileText className="w-3.5 h-3.5 text-muted" />
                      <span>Learning & Insights</span>
                    </div>
                    <p className="text-ink leading-relaxed whitespace-pre-wrap pl-5">
                      {selectedDetailStandup.learned}
                    </p>
                  </div>
                )}

                {/* Blockers */}
                {selectedDetailStandup.blockers && (
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/30 rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Blocker / Roadblock</span>
                    </div>
                    <p className="text-rose-950 font-medium leading-relaxed whitespace-pre-wrap pl-5">
                      {selectedDetailStandup.blockers}
                    </p>
                  </div>
                )}

                {/* Question for Lead */}
                {selectedDetailStandup.questionForLead && (
                  <div className="p-3.5 bg-amber-500/5 border border-amber-500/30 rounded-sm space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold uppercase text-amber-800">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Question for Lead</span>
                    </div>
                    <p className="text-amber-950 italic leading-relaxed pl-5">
                      "{selectedDetailStandup.questionForLead}"
                    </p>
                    {selectedDetailStandup.leadAnswer && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20 pl-5 space-y-1">
                        <span className="font-mono text-[10px] font-bold text-amber-800 uppercase">
                          Lead Response:
                        </span>
                        <p className="text-ink font-sans">
                          {selectedDetailStandup.leadAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* GROUPED HISTORY LIST */
            <>
              {loading ? (
                <div className="py-16 text-center font-mono text-xs text-muted space-y-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse inline-block" />
                  <p>Loading historical team standups...</p>
                </div>
              ) : error ? (
                <div className="p-4 bg-attention/10 border border-attention text-attention font-mono text-xs rounded-xs flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={loadHistory}
                    className="px-2.5 py-1 bg-attention text-paper font-bold rounded-xs hover:bg-attention-dark transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : dateGroups.length === 0 ? (
                <div className="py-16 text-center font-mono text-xs text-muted space-y-1">
                  <History className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                  <p className="font-bold text-ink">No historical submissions found.</p>
                  <p>
                    {searchQuery
                      ? 'Try adjusting your search query or filter.'
                      : 'Past standup recordings and logs will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {dateGroups.map(({ dateKey, items }) => {
                    const isExportingThisDate = exportingDate === dateKey;

                    return (
                      <div
                        key={dateKey}
                        className="border border-line rounded-sm overflow-hidden bg-paper shadow-2xs"
                      >
                        {/* ========================================================= */}
                        {/* COMPACT DATE GROUP HEADER                                 */}
                        {/* ========================================================= */}
                        <div className="bg-paper-dark px-4 py-2.5 border-b border-line flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-xs font-black text-ink uppercase tracking-wide">
                              {formatGroupHeaderDate(dateKey)}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper border border-line text-muted">
                              {items.length} {items.length === 1 ? 'submission' : 'submissions'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleExportDayPdf(dateKey, e)}
                            disabled={isExportingThisDate}
                            className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-[11px] font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                            title={`Export PDF report for ${dateKey}`}
                          >
                            <FileDown className="w-3.5 h-3.5 text-accent" />
                            <span>{isExportingThisDate ? 'Exporting...' : 'Export Day PDF'}</span>
                          </button>
                        </div>

                        {/* ========================================================= */}
                        {/* COMPACT SUBMISSION ROWS                                   */}
                        {/* ========================================================= */}
                        <div className="divide-y divide-line/70">
                          {items.map((standup) => {
                            const isVoice = standup.submissionType === 'VOICE' || Boolean(standup.hasVoiceRecording);
                            const isPlayingThis = playingStandupId === standup.id;
                            const isExportingThis = exportingId === standup.id;

                            return (
                              <div
                                key={standup.id}
                                className="p-3 sm:px-4 sm:py-3 hover:bg-paper-light/70 transition-colors space-y-2.5"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                  {/* Left: Avatar + Name + Metadata */}
                                  <div className="flex items-center space-x-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-ink/5 border border-line flex items-center justify-center font-mono text-xs font-bold text-ink shrink-0">
                                      {getInitials(standup.userName)}
                                    </div>

                                    <div className="min-w-0 space-y-0.5">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono font-bold text-ink text-xs sm:text-sm truncate">
                                          {standup.userName}
                                        </span>
                                      </div>

                                      {/* Information Hierarchy Row */}
                                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted">
                                        {isVoice ? (
                                          <span className="px-1.5 py-0.2 bg-accent/10 text-accent border border-accent/25 rounded-xs font-bold text-[10px] inline-flex items-center gap-1">
                                            <Mic className="w-2.5 h-2.5" />
                                            <span>VOICE</span>
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.2 bg-paper-dark text-muted border border-line rounded-xs font-bold text-[10px] inline-flex items-center gap-1">
                                            <FileText className="w-2.5 h-2.5" />
                                            <span>WRITTEN</span>
                                          </span>
                                        )}

                                        <span>•</span>
                                        <span>{formatSubmissionTime(standup.submittedAt)}</span>

                                        {isVoice && standup.audioDurationSeconds ? (
                                          <>
                                            <span>•</span>
                                            <span className="font-semibold text-ink">{standup.audioDurationSeconds} sec</span>
                                          </>
                                        ) : null}

                                        {standup.confidence ? (
                                          <>
                                            <span>•</span>
                                            <span>
                                              Confidence <strong className="text-ink">{standup.confidenceLabel || `${standup.confidence}/5`}</strong>
                                            </span>
                                          </>
                                        ) : null}

                                        {standup.blockers && (
                                          <>
                                            <span>•</span>
                                            <span className="text-rose-600 font-bold">Has Blocker</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Actions */}
                                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                                    {isVoice && (
                                      <button
                                        type="button"
                                        onClick={() => setPlayingStandupId(isPlayingThis ? null : standup.id)}
                                        className={`px-2.5 py-1 font-mono text-xs font-semibold rounded-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                                          isPlayingThis
                                            ? 'bg-accent text-paper'
                                            : 'bg-ink text-paper hover:bg-ink-light'
                                        }`}
                                        title={isPlayingThis ? 'Close voice player' : 'Play voice standup'}
                                      >
                                        {isPlayingThis ? (
                                          <>
                                            <Pause className="w-3 h-3 fill-current" />
                                            <span>Close</span>
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-3 h-3 fill-current text-accent" />
                                            <span>Play</span>
                                          </>
                                        )}
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => setSelectedDetailStandup(standup)}
                                      className="px-2.5 py-1 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                                      title="View full standup details"
                                    >
                                      <span>Details</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleExportIndividualPdf(standup.id, e)}
                                      disabled={isExportingThis}
                                      className="p-1 text-muted hover:text-ink hover:bg-paper-dark border border-line hover:border-ink rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                                      title="Download individual standup PDF"
                                    >
                                      <FileDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Compact Inline Voice Player */}
                                {isVoice && isPlayingThis && (
                                  <div className="p-2.5 bg-paper-dark border border-line rounded-xs space-y-1.5 animate-in fade-in duration-100">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                      <span className="font-bold text-accent uppercase flex items-center space-x-1">
                                        <Volume2 className="w-3.5 h-3.5" />
                                        <span>Playing {standup.userName}'s Voice Recording</span>
                                      </span>
                                      <button
                                        onClick={() => setPlayingStandupId(null)}
                                        className="text-muted hover:text-ink font-mono text-[10px] cursor-pointer"
                                      >
                                        ✕ Close
                                      </button>
                                    </div>
                                    <StandupAudioPlayer
                                      standupId={standup.id}
                                      initialDurationSeconds={standup.audioDurationSeconds || undefined}
                                      title={`${standup.userName} · ${formatGroupHeaderDate(standup.date)}`}
                                      autoPlay={true}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 4. MODAL FOOTER                                                           */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-paper border-t border-line px-5 py-3 flex items-center justify-between font-mono text-xs">
          <span className="text-muted text-[11px] hidden sm:inline-block">
            {selectedDetailStandup
              ? `Viewing details for ${selectedDetailStandup.userName}`
              : `Showing ${filteredList.length} of ${historyList.length} submissions`}
          </span>

          <div className="flex items-center space-x-2 ml-auto">
            {selectedDetailStandup && (
              <button
                type="button"
                onClick={() => setSelectedDetailStandup(null)}
                className="px-3 py-1.5 bg-paper hover:bg-paper-dark border border-line text-ink font-mono text-xs font-bold rounded-xs transition-colors cursor-pointer"
              >
                Back to List
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
