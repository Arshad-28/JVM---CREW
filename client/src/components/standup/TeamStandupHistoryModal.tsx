import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ChevronDown,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Calendar,
  Volume2,
  ArrowLeft,
  Check,
  RotateCcw,
  SlidersHorizontal,
  User,
} from 'lucide-react';

export type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';
export type SubmissionTypeFilter = 'ALL' | 'VOICE' | 'WRITTEN';
export type BlockerFilter = 'ALL' | 'HAS_BLOCKER' | 'NO_BLOCKER';
export type ConfidenceFilter = 'ALL' | '1' | '2' | '3' | '4' | '5';

interface TeamStandupHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRelativeDateStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TeamStandupHistoryModal: React.FC<TeamStandupHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const cachedHistory = cacheStore.get<Standup[]>('team_standup_history');
  const [historyList, setHistoryList] = useState<Standup[]>(() => cachedHistory || []);
  const [loading, setLoading] = useState<boolean>(!cachedHistory);
  const [error, setError] = useState<string | null>(null);

  // Active view states
  const [playingStandupId, setPlayingStandupId] = useState<number | null>(null);
  const [selectedDetailStandup, setSelectedDetailStandup] = useState<Standup | null>(null);
  const [exportingDate, setExportingDate] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [appliedCustomStart, setAppliedCustomStart] = useState<string>('');
  const [appliedCustomEnd, setAppliedCustomEnd] = useState<string>('');

  const [memberFilter, setMemberFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<SubmissionTypeFilter>('ALL');
  const [blockerFilter, setBlockerFilter] = useState<BlockerFilter>('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('ALL');

  // Popover state
  const [activeDropdown, setActiveDropdown] = useState<'DATE' | 'MEMBER' | 'TYPE' | 'MORE' | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

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
      setActiveDropdown(null);
    }
  }, [isOpen]);

  // Lock background body scroll with layout shift compensation
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  // Click outside toolbar popovers
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    if (activeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [activeDropdown]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDropdown) {
          setActiveDropdown(null);
        } else if (selectedDetailStandup) {
          setSelectedDetailStandup(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeDropdown, selectedDetailStandup, onClose]);

  // Extract unique members from real standup history
  const availableMembers = useMemo(() => {
    const memberMap = new Map<string, { id?: number; name: string }>();
    historyList.forEach((item) => {
      if (item.userName) {
        const key = item.userId ? String(item.userId) : item.userName;
        if (!memberMap.has(key)) {
          memberMap.set(key, { id: item.userId, name: item.userName });
        }
      }
    });
    return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [historyList]);

  // Multi-criteria Filtering
  const filteredList = useMemo(() => {
    const todayStr = getTodayDateStr();
    const yesterdayStr = getRelativeDateStr(1);
    const sevenDaysAgoStr = getRelativeDateStr(6);
    const thirtyDaysAgoStr = getRelativeDateStr(29);

    return historyList.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.userName?.toLowerCase().includes(q);
        const matchesDate = item.date?.toLowerCase().includes(q);
        const matchesYesterday = item.yesterday?.toLowerCase().includes(q);
        const matchesToday = item.today?.toLowerCase().includes(q);
        const matchesBlockers = item.blockers?.toLowerCase().includes(q);
        const matchesLearned = item.learned?.toLowerCase().includes(q);
        const matchesQuestion = item.questionForLead?.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesDate &&
          !matchesYesterday &&
          !matchesToday &&
          !matchesBlockers &&
          !matchesLearned &&
          !matchesQuestion
        ) {
          return false;
        }
      }

      // 2. Date Filter
      if (dateFilter === 'TODAY') {
        if (item.date !== todayStr) return false;
      } else if (dateFilter === 'YESTERDAY') {
        if (item.date !== yesterdayStr) return false;
      } else if (dateFilter === 'LAST_7_DAYS') {
        if (!item.date || item.date < sevenDaysAgoStr || item.date > todayStr) return false;
      } else if (dateFilter === 'LAST_30_DAYS') {
        if (!item.date || item.date < thirtyDaysAgoStr || item.date > todayStr) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (appliedCustomStart && item.date && item.date < appliedCustomStart) return false;
        if (appliedCustomEnd && item.date && item.date > appliedCustomEnd) return false;
      }

      // 3. Member Filter
      if (memberFilter !== 'ALL') {
        const matchById = item.userId && String(item.userId) === memberFilter;
        const matchByName = item.userName && item.userName === memberFilter;
        if (!matchById && !matchByName) return false;
      }

      // 4. Submission Type Filter
      const isVoice = item.submissionType === 'VOICE' || Boolean(item.hasVoiceRecording);
      if (typeFilter === 'VOICE' && !isVoice) return false;
      if (typeFilter === 'WRITTEN' && isVoice) return false;

      // 5. Blocker Filter
      const hasBlocker = Boolean(item.blockers && item.blockers.trim().length > 0);
      if (blockerFilter === 'HAS_BLOCKER' && !hasBlocker) return false;
      if (blockerFilter === 'NO_BLOCKER' && hasBlocker) return false;

      // 6. Confidence Filter
      if (confidenceFilter !== 'ALL') {
        const targetConfidence = parseInt(confidenceFilter, 10);
        if (item.confidence !== targetConfidence) return false;
      }

      return true;
    });
  }, [
    historyList,
    searchQuery,
    dateFilter,
    appliedCustomStart,
    appliedCustomEnd,
    memberFilter,
    typeFilter,
    blockerFilter,
    confidenceFilter,
  ]);

  // Group filtered results by calendar date (descending)
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

  // Active filter count & labels
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      dateFilter !== 'ALL' ||
      memberFilter !== 'ALL' ||
      typeFilter !== 'ALL' ||
      blockerFilter !== 'ALL' ||
      confidenceFilter !== 'ALL'
    );
  }, [searchQuery, dateFilter, memberFilter, typeFilter, blockerFilter, confidenceFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setAppliedCustomStart('');
    setAppliedCustomEnd('');
    setMemberFilter('ALL');
    setTypeFilter('ALL');
    setBlockerFilter('ALL');
    setConfidenceFilter('ALL');
    setActiveDropdown(null);
  };

  const getDateFilterLabel = () => {
    if (dateFilter === 'TODAY') return 'Today';
    if (dateFilter === 'YESTERDAY') return 'Yesterday';
    if (dateFilter === 'LAST_7_DAYS') return 'Last 7 days';
    if (dateFilter === 'LAST_30_DAYS') return 'Last 30 days';
    if (dateFilter === 'CUSTOM') {
      if (appliedCustomStart && appliedCustomEnd) return `${appliedCustomStart} to ${appliedCustomEnd}`;
      if (appliedCustomStart) return `From ${appliedCustomStart}`;
      if (appliedCustomEnd) return `Up to ${appliedCustomEnd}`;
      return 'Custom range';
    }
    return 'Date';
  };

  const getMemberFilterLabel = () => {
    if (memberFilter === 'ALL') return 'Member';
    const found = availableMembers.find((m) => (m.id ? String(m.id) === memberFilter : m.name === memberFilter));
    return found ? found.name : memberFilter;
  };

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

  const handleApplyCustomDateRange = () => {
    setAppliedCustomStart(customStartDate);
    setAppliedCustomEnd(customEndDate);
    setDateFilter('CUSTOM');
    setActiveDropdown(null);
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden font-sans outline-none">
      {/* ========================================================================= */}
      {/* 1. GLASS BLUR BACKDROP OVERLAY                                            */}
      {/* ========================================================================= */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-200 cursor-pointer animate-fade-in"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 2. STANDUP HISTORY MODAL (SHARP, OPAQUE, HIGH CONTRAST)                   */}
      {/* ========================================================================= */}
      <div
        className="relative z-[110] bg-paper border-0 sm:border border-line w-full h-full sm:h-[88vh] sm:max-h-[900px] sm:max-w-5xl sm:rounded-lg shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* 2.1 STICKY MODAL HEADER                                                   */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-paper border-b border-line px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                  Team Standup History
                </h3>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-paper-dark border border-line text-muted">
                  {historyList.length} Total
                </span>
              </div>
              <p className="font-mono text-[11px] sm:text-xs text-muted">
                Review past submissions, blockers, and listen to voice recordings
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
        {/* 2.2 COMPACT ADVANCED FILTER TOOLBAR                                       */}
        {/* ========================================================================= */}
        {!selectedDetailStandup && (
          <div ref={toolbarRef} className="shrink-0 bg-paper-dark/60 border-b border-line px-4 sm:px-6 py-2.5 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search standups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-paper border border-line focus:border-ink rounded-xs font-mono text-xs text-ink placeholder:text-muted focus:outline-hidden transition-colors"
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

              {/* Filter Dropdown Triggers */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {/* 1. DATE FILTER DROPDOWN */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'DATE' ? null : 'DATE')}
                    className={`px-2.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer border ${
                      dateFilter !== 'ALL'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-line hover:border-ink/50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    <span>{getDateFilterLabel()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {activeDropdown === 'DATE' && (
                    <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-40 w-64 bg-paper border border-line rounded-sm shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                      <div className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider pb-1 border-b border-line">
                        Filter by Date
                      </div>

                      <div className="space-y-1 font-mono text-xs">
                        {[
                          { key: 'ALL', label: 'All dates' },
                          { key: 'TODAY', label: 'Today' },
                          { key: 'YESTERDAY', label: 'Yesterday' },
                          { key: 'LAST_7_DAYS', label: 'Last 7 days' },
                          { key: 'LAST_30_DAYS', label: 'Last 30 days' },
                          { key: 'CUSTOM', label: 'Custom range' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => {
                              if (opt.key === 'CUSTOM') {
                                setDateFilter('CUSTOM');
                              } else {
                                setDateFilter(opt.key as DateFilterType);
                                setAppliedCustomStart('');
                                setAppliedCustomEnd('');
                                setActiveDropdown(null);
                              }
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-xs flex items-center justify-between transition-colors ${
                              dateFilter === opt.key ? 'bg-ink text-paper font-bold' : 'hover:bg-paper-dark text-ink'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {dateFilter === opt.key && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>

                      {/* Custom Range Inputs */}
                      {dateFilter === 'CUSTOM' && (
                        <div className="pt-2 border-t border-line space-y-2">
                          <div className="space-y-1">
                            <label className="font-mono text-[10px] uppercase font-bold text-muted block">
                              From:
                            </label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full px-2 py-1 bg-paper border border-line rounded-xs font-mono text-xs text-ink"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-mono text-[10px] uppercase font-bold text-muted block">
                              To:
                            </label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full px-2 py-1 bg-paper border border-line rounded-xs font-mono text-xs text-ink"
                            />
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomStartDate('');
                                setCustomEndDate('');
                                setAppliedCustomStart('');
                                setAppliedCustomEnd('');
                                setDateFilter('ALL');
                              }}
                              className="px-2 py-1 border border-line text-muted hover:text-ink font-mono text-[11px] rounded-xs"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyCustomDateRange}
                              disabled={!customStartDate && !customEndDate}
                              className="px-3 py-1 bg-ink text-paper hover:bg-ink-light font-mono text-[11px] font-bold rounded-xs disabled:opacity-50"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. MEMBER FILTER DROPDOWN */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'MEMBER' ? null : 'MEMBER')}
                    className={`px-2.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer border ${
                      memberFilter !== 'ALL'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-line hover:border-ink/50'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-muted" />
                    <span className="truncate max-w-[120px]">{getMemberFilterLabel()}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {activeDropdown === 'MEMBER' && (
                    <div className="absolute right-0 sm:left-0 top-full mt-1.5 z-40 w-56 max-h-64 overflow-y-auto bg-paper border border-line rounded-sm shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
                      <div className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider px-2 py-1 pb-1.5 border-b border-line">
                        Filter by Member
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMemberFilter('ALL');
                          setActiveDropdown(null);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-xs flex items-center justify-between transition-colors ${
                          memberFilter === 'ALL' ? 'bg-ink text-paper font-bold' : 'hover:bg-paper-dark text-ink'
                        }`}
                      >
                        <span>All Members</span>
                        {memberFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {availableMembers.map((member) => {
                        const val = member.id ? String(member.id) : member.name;
                        const isSelected = memberFilter === val || memberFilter === member.name;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setMemberFilter(val);
                              setActiveDropdown(null);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-xs flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-ink text-paper font-bold' : 'hover:bg-paper-dark text-ink'
                            }`}
                          >
                            <span className="truncate">{member.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. TYPE FILTER DROPDOWN */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'TYPE' ? null : 'TYPE')}
                    className={`px-2.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer border ${
                      typeFilter !== 'ALL'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-line hover:border-ink/50'
                    }`}
                  >
                    <span>
                      {typeFilter === 'ALL' ? 'Type' : typeFilter === 'VOICE' ? 'Type: Voice' : 'Type: Written'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {activeDropdown === 'TYPE' && (
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-44 bg-paper border border-line rounded-sm shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
                      <div className="font-mono text-[11px] font-bold text-ink uppercase tracking-wider px-2 py-1 pb-1.5 border-b border-line">
                        Submission Type
                      </div>
                      {[
                        { key: 'ALL', label: 'All Types' },
                        { key: 'VOICE', label: 'Voice Standup' },
                        { key: 'WRITTEN', label: 'Written Standup' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setTypeFilter(opt.key as SubmissionTypeFilter);
                            setActiveDropdown(null);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-xs flex items-center justify-between transition-colors ${
                            typeFilter === opt.key ? 'bg-ink text-paper font-bold' : 'hover:bg-paper-dark text-ink'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {typeFilter === opt.key && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. MORE FILTERS (Confidence & Blockers) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'MORE' ? null : 'MORE')}
                    className={`px-2.5 py-1.5 rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer border ${
                      blockerFilter !== 'ALL' || confidenceFilter !== 'ALL'
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-paper text-ink border-line hover:border-ink/50'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>More Filters</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {activeDropdown === 'MORE' && (
                    <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-paper border border-line rounded-sm shadow-xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100 font-mono text-xs">
                      {/* Blockers */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                          Blockers
                        </div>
                        <div className="space-y-1">
                          {[
                            { key: 'ALL', label: 'All' },
                            { key: 'HAS_BLOCKER', label: 'Has Blocker' },
                            { key: 'NO_BLOCKER', label: 'No Blocker' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => {
                                setBlockerFilter(opt.key as BlockerFilter);
                              }}
                              className={`w-full text-left px-2 py-1 rounded-xs flex items-center justify-between text-xs transition-colors ${
                                blockerFilter === opt.key ? 'bg-ink text-paper font-bold' : 'hover:bg-paper-dark text-ink'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {blockerFilter === opt.key && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Confidence */}
                      <div className="pt-2 border-t border-line space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                          Confidence
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {(['ALL', '1', '2', '3', '4', '5'] as const).map((conf) => (
                            <button
                              key={conf}
                              type="button"
                              onClick={() => {
                                setConfidenceFilter(conf);
                              }}
                              className={`px-2 py-1 text-center rounded-xs text-xs font-bold transition-colors border ${
                                confidenceFilter === conf
                                  ? 'bg-ink text-paper border-ink'
                                  : 'bg-paper border-line text-muted hover:text-ink hover:bg-paper-dark'
                              }`}
                            >
                              {conf === 'ALL' ? 'All' : `${conf}/5`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-line flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setBlockerFilter('ALL');
                            setConfidenceFilter('ALL');
                          }}
                          className="text-[11px] text-muted hover:text-ink underline cursor-pointer"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(null)}
                          className="px-2.5 py-1 bg-ink text-paper rounded-xs font-bold text-[11px]"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIVE FILTER CHIPS ROW */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-line/60">
                <span className="font-mono text-[10px] uppercase font-bold text-muted mr-1">
                  Active:
                </span>

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {dateFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Date: {getDateFilterLabel()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDateFilter('ALL');
                        setCustomStartDate('');
                        setCustomEndDate('');
                        setAppliedCustomStart('');
                        setAppliedCustomEnd('');
                      }}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {memberFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Member: {getMemberFilterLabel()}</span>
                    <button
                      type="button"
                      onClick={() => setMemberFilter('ALL')}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {typeFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Type: {typeFilter === 'VOICE' ? 'Voice' : 'Written'}</span>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('ALL')}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {blockerFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Blockers: {blockerFilter === 'HAS_BLOCKER' ? 'Has Blocker' : 'No Blocker'}</span>
                    <button
                      type="button"
                      onClick={() => setBlockerFilter('ALL')}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {confidenceFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-paper border border-line font-mono text-[11px] text-ink">
                    <span>Confidence: {confidenceFilter}/5</span>
                    <button
                      type="button"
                      onClick={() => setConfidenceFilter('ALL')}
                      className="text-muted hover:text-ink ml-1 font-bold"
                    >
                      ✕
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="font-mono text-[10px] text-muted hover:text-ink underline ml-auto flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2.3 SCROLLABLE CONTENT BODY (SINGLE PRIMARY SCROLL CONTAINER)             */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6 overscroll-contain">
          {/* VIEW DETAILS MODE (DRAWER VIEW) */}
          {selectedDetailStandup ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top back button bar */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <button
                  onClick={() => setSelectedDetailStandup(null)}
                  className="px-2.5 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Standup History</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleExportIndividualPdf(selectedDetailStandup.id, e)}
                    disabled={exportingId === selectedDetailStandup.id}
                    className="px-2.5 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-ink text-ink rounded-xs font-mono text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5 text-accent" />
                    <span>{exportingId === selectedDetailStandup.id ? 'Exporting...' : 'Export Standup PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Standup Details Header Card */}
              <div className="p-4 bg-paper-dark/60 border border-line rounded-sm space-y-3">
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
                        <Calendar className="w-3 h-3 text-accent" />
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
                <div className="py-16 text-center font-mono text-xs text-muted space-y-2">
                  <History className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                  <p className="font-bold text-ink text-sm">No standups found</p>
                  <p className="max-w-sm mx-auto text-muted">
                    {hasActiveFilters
                      ? 'No standups match your active search and filter criteria.'
                      : 'Past standup recordings and logs will appear here.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-3 px-3 py-1.5 bg-ink text-paper hover:bg-ink-light font-mono text-xs font-bold rounded-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {dateGroups.map(({ dateKey, items }) => {
                    const isExportingThisDate = exportingDate === dateKey;

                    return (
                      <div key={dateKey} className="space-y-1.5">
                        {/* ========================================================= */}
                        {/* CLEAN STICKY DATE GROUP HEADER                            */}
                        {/* ========================================================= */}
                        <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-xs py-2 px-1 border-b border-line flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-xs font-black text-ink uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-accent" />
                              <span>{formatGroupHeaderDate(dateKey)}</span>
                            </span>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-paper-dark border border-line text-muted">
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
                        {/* FLAT SUBMISSION ROWS                                      */}
                        {/* ========================================================= */}
                        <div className="divide-y divide-line/60 bg-paper border border-line/60 rounded-xs">
                          {items.map((standup) => {
                            const isVoice = standup.submissionType === 'VOICE' || Boolean(standup.hasVoiceRecording);
                            const isPlayingThis = playingStandupId === standup.id;
                            const isExportingThis = exportingId === standup.id;

                            return (
                              <div
                                key={standup.id}
                                className="p-3 sm:px-4 sm:py-3 hover:bg-paper-light/80 transition-colors space-y-2"
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
                                        className={`px-3 py-1 font-mono text-xs font-semibold rounded-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
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
                                            <span>Play Voice</span>
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

                                {/* Clean 1-line preview for written standups */}
                                {!isVoice && (standup.yesterday || standup.today || standup.blockers) && (
                                  <div className="pl-11 text-xs space-y-0.5 font-sans">
                                    {standup.yesterday && (
                                      <p className="text-muted line-clamp-1">
                                        <strong className="text-ink font-semibold">Done:</strong> {standup.yesterday}
                                      </p>
                                    )}
                                    {standup.blockers && (
                                      <p className="text-rose-700 font-medium line-clamp-1">
                                        <strong>Blocker:</strong> {standup.blockers}
                                      </p>
                                    )}
                                  </div>
                                )}

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
        {/* 2.4 MODAL FOOTER                                                          */}
        {/* ========================================================================= */}
        <div className="shrink-0 bg-paper border-t border-line px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between font-mono text-xs">
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
    </div>,
    document.body
  );
};
