import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LeaveReason,
  LeaveEmailRecord,
  selectNextUnusedTemplate,
  getUserLeaveHistory,
  saveUserLeaveRecord,
  getTemplatesForReason,
  validateEmail,
  normalizeEmail,
} from '../../services/leaveEmailTemplates';
import {
  X,
  Mail,
  Copy,
  Check,
  Send,
  Edit3,
  FileText,
  AlertCircle,
  RefreshCw,
  History,
  Sparkles,
  CheckCircle2,
  Plus,
  Users,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';

interface LeaveEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_RECIPIENT = 'support@algorithms.com';

export const LeaveEmailModal: React.FC<LeaveEmailModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  // Multi-recipient state
  const [recipients, setRecipients] = useState<string[]>([DEFAULT_RECIPIENT]);
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Leave parameters
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customReturnDate, setCustomReturnDate] = useState('');
  const [reason, setReason] = useState<LeaveReason>('PERSONAL');
  const [customReasonText, setCustomReasonText] = useState('');

  // Selected template & manual cycle override index
  const [overrideTemplateIndex, setOverrideTemplateIndex] = useState<number | undefined>(undefined);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('Template 01');
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');

  // Email subject & body states
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [mailTriggered, setMailTriggered] = useState(false);

  // History state
  const [leaveHistory, setLeaveHistory] = useState<LeaveEmailRecord[]>([]);

  // Body scroll lock & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Refresh history when modal opens or user updates
  useEffect(() => {
    if (isOpen && user?.id) {
      const hist = getUserLeaveHistory(user.id);
      setLeaveHistory(hist);
    }
  }, [isOpen, user]);

  // Initialize dates and reset states on open
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayStr = today.toISOString().substring(0, 10);
      setStartDate(todayStr);

      const nextDay = new Date(today);
      nextDay.setDate(nextDay.getDate() + 1);
      setEndDate(nextDay.toISOString().substring(0, 10));

      setCustomReturnDate('');
      setIsEditing(false);
      setCopied(false);
      setMailTriggered(false);
      setRecipientError(null);
      setOverrideTemplateIndex(undefined);

      // Ensure default recipient is present if list was empty
      if (recipients.length === 0) {
        setRecipients([DEFAULT_RECIPIENT]);
      }
    }
  }, [isOpen]);

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const getCalculatedReturnDate = () => {
    if (customReturnDate) {
      return formatDateString(customReturnDate);
    }
    const targetDateStr = isMultiDay && endDate ? endDate : startDate;
    if (!targetDateStr) return '';

    try {
      const [year, month, day] = targetDateStr.split('-').map(Number);
      const nextDay = new Date(year, month - 1, day);
      nextDay.setDate(nextDay.getDate() + 1);
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(nextDay);
    } catch {
      return '';
    }
  };

  // Recompute generated email whenever inputs or template selection change
  useEffect(() => {
    if (isEditing) return;

    const formattedStart = formatDateString(startDate);
    const formattedEnd = formatDateString(endDate);
    const returnDateStr = getCalculatedReturnDate();
    const userName = user?.name || 'Engineer';

    const dateRangeForSubject =
      isMultiDay && endDate && endDate !== startDate
        ? `${formattedStart} to ${formattedEnd}`
        : formattedStart;

    const dateClause =
      isMultiDay && endDate && endDate !== startDate
        ? `from ${formattedStart} to ${formattedEnd}`
        : `on ${formattedStart}`;

    const approvalClause =
      isMultiDay && endDate && endDate !== startDate
        ? 'I kindly request you to approve my leave for the mentioned dates.'
        : 'I kindly request you to approve my leave for the mentioned date.';

    const userId = user?.id || 0;

    const generated = selectNextUnusedTemplate(
      userId,
      reason,
      {
        userName,
        dateRangeForSubject,
        dateClause,
        approvalClause,
        returnDateStr,
        customReasonText,
      },
      overrideTemplateIndex
    );

    setGeneratedSubject(generated.subject);
    setGeneratedBody(generated.body);
    setCurrentTemplateId(generated.templateId);
    setCurrentTemplateName(generated.templateName);
  }, [
    startDate,
    endDate,
    isMultiDay,
    customReturnDate,
    reason,
    customReasonText,
    user,
    isEditing,
    overrideTemplateIndex,
  ]);

  // Recipient management handlers
  const handleAddRecipient = (rawInput?: string) => {
    const textToAdd = rawInput !== undefined ? rawInput : recipientInput;
    if (!textToAdd || !textToAdd.trim()) return;

    // Support comma or semicolon separated multi-paste
    const candidateEmails = textToAdd
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean);

    let errorFound: string | null = null;
    const toAdd: string[] = [];

    for (const raw of candidateEmails) {
      const normalized = normalizeEmail(raw);
      if (!validateEmail(normalized)) {
        errorFound = `"${raw}" is not a valid email address.`;
        break;
      }
      if (recipients.includes(normalized) || toAdd.includes(normalized)) {
        errorFound = `"${normalized}" is already in the recipient list.`;
        break;
      }
      toAdd.push(normalized);
    }

    if (errorFound) {
      setRecipientError(errorFound);
    } else if (toAdd.length > 0) {
      setRecipients((prev) => [...prev, ...toAdd]);
      setRecipientInput('');
      setRecipientError(null);
    }
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients((prev) => prev.filter((e) => e !== emailToRemove));
    setRecipientError(null);
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddRecipient();
    } else if (e.key === 'Backspace' && !recipientInput && recipients.length > 0) {
      // Remove last recipient on backspace if input is empty
      setRecipients((prev) => prev.slice(0, -1));
    }
  };

  const handleReasonChange = (newReason: LeaveReason) => {
    setReason(newReason);
    setOverrideTemplateIndex(undefined); // Reset override to auto-select next unused template for new reason
  };

  const handleCycleTemplate = () => {
    const pool = getTemplatesForReason(reason);
    const currentIndex =
      overrideTemplateIndex !== undefined
        ? overrideTemplateIndex
        : parseInt(currentTemplateId.replace('Template ', ''), 10) - 1;

    const nextIndex = (currentIndex + 1) % pool.length;
    setOverrideTemplateIndex(nextIndex);
  };

  const getReasonDisplay = (r: LeaveReason) => {
    switch (r) {
      case 'SICK':
        return 'Sick Leave';
      case 'PERSONAL':
        return 'Personal Leave';
      case 'GOING_HOME':
        return 'Travel / Going Home';
      case 'FAMILY':
        return 'Family Commitment';
      case 'EMERGENCY':
        return 'Emergency Leave';
      case 'OTHER':
        return customReasonText.trim() ? customReasonText.trim() : 'General Leave';
    }
  };

  const recordLeaveSent = () => {
    if (!user?.id) return;
    const formattedStart = formatDateString(startDate);
    const formattedEnd = formatDateString(endDate);
    const returnDateStr = getCalculatedReturnDate();

    const activeRecipients = recipients.length > 0 ? recipients : [DEFAULT_RECIPIENT];

    saveUserLeaveRecord(user.id, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      recipient: activeRecipients[0],
      recipients: activeRecipients,
      reason,
      reasonDisplay: getReasonDisplay(reason),
      startDate: formattedStart,
      endDate: isMultiDay ? formattedEnd : formattedStart,
      returnDate: returnDateStr,
      subject: generatedSubject,
      body: generatedBody,
      templateId: currentTemplateId,
    });

    setLeaveHistory(getUserLeaveHistory(user.id));
    setMailTriggered(true);
  };

  const handleCopy = async () => {
    if (recipients.length === 0) {
      setRecipientError('Please specify at least one recipient.');
      return;
    }

    const recipientsHeader = recipients.join(', ');
    const fullText = `TO: ${recipientsHeader}
SUBJECT: ${generatedSubject}

${generatedBody}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = fullText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    recordLeaveSent();
  };

  const handleOpenMailClient = () => {
    if (recipients.length === 0) {
      setRecipientError('Please specify at least one recipient.');
      return;
    }

    recordLeaveSent();
    const toParam = recipients.join(',');
    const mailtoUrl = `mailto:${toParam}?subject=${encodeURIComponent(
      generatedSubject
    )}&body=${encodeURIComponent(generatedBody)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopyPastEmail = async (rec: LeaveEmailRecord) => {
    const toList =
      rec.recipients && rec.recipients.length > 0
        ? rec.recipients.join(', ')
        : rec.recipient || DEFAULT_RECIPIENT;
    const text = `TO: ${toList}\nSUBJECT: ${rec.subject}\n\n${rec.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHistoryId(rec.id);
      setTimeout(() => setCopiedHistoryId(null), 2500);
    } catch {
      // Fallback
    }
  };

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

      {/* Modal Container */}
      <div
        className="relative z-[110] bg-paper border border-line-dark w-full max-w-4xl rounded-2xl shadow-modal flex flex-col max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] overflow-hidden my-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Fixed Header */}
        <div className="bg-surface border-b border-line px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-md bg-primary text-paper flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5 text-primary-soft" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary border border-primary/20 px-2 py-0.5 rounded-xs">
                  CORPORATE MNC FORMAT
                </span>
                <span className="font-mono text-xs text-muted flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {recipients.length} {recipients.length === 1 ? 'Recipient' : 'Recipients'}
                  </span>
                </span>
              </div>
              <h2 className="font-display text-lg font-bold text-ink mt-0.5">
                Leave Request Email Dispatcher
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-surface-soft text-muted hover:text-ink transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Sub-Header Navigation Tabs */}
        <div className="flex items-center space-x-2 bg-surface-soft px-5 py-2.5 border-b border-line shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-1.5 font-mono text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-primary-soft text-primary font-bold border border-primary/25 shadow-2xs'
                : 'bg-surface-raised text-muted hover:text-ink hover:bg-surface-soft border border-line'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Leave Email Composer</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 font-mono text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-primary-soft text-primary font-bold border border-primary/25 shadow-2xs'
                : 'bg-surface-raised text-muted hover:text-ink hover:bg-surface-soft border border-line'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Leave History ({leaveHistory.length})</span>
          </button>
        </div>

        {/* 3. Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-paper">
          {/* TAB 1: GENERATOR / COMPOSER */}
          {activeTab === 'generator' && (
            <div className="space-y-5">
              {/* SECTION A: Multi-Recipient Tag Input Box */}
              <div className="bg-paper-light border border-line p-4 rounded-sm space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-semibold text-ink flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-accent" />
                    <span>1. Dispatch Recipients (To):</span>
                  </label>
                  <span className="font-mono text-[11px] text-muted">
                    {recipients.length} target {recipients.length === 1 ? 'address' : 'addresses'}
                  </span>
                </div>

                {/* Recipient Chips + Add Field Container */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-paper border border-line rounded-sm min-h-[44px] focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                  {recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-sm text-xs font-mono bg-paper-dark border border-line text-ink group"
                    >
                      <Mail className="w-3 h-3 text-accent shrink-0" />
                      <span className="truncate max-w-[220px] sm:max-w-xs">{email}</span>
                      {email === DEFAULT_RECIPIENT && (
                        <span className="text-[9px] font-bold text-accent/80 uppercase tracking-tighter">
                          (default)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(email)}
                        className="text-muted hover:text-red-600 hover:bg-red-50 p-0.5 rounded-xs transition-colors cursor-pointer ml-1"
                        title={`Remove ${email}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {/* Add Input */}
                  <div className="flex-1 flex items-center min-w-[190px]">
                    <input
                      ref={inputRef}
                      type="email"
                      placeholder={
                        recipients.length === 0
                          ? 'Add recipient email (press Enter)...'
                          : 'Add another email (press Enter)...'
                      }
                      value={recipientInput}
                      onChange={(e) => {
                        setRecipientInput(e.target.value);
                        if (recipientError) setRecipientError(null);
                      }}
                      onKeyDown={handleRecipientKeyDown}
                      className="w-full py-1 px-2 bg-transparent text-xs font-mono text-ink placeholder:text-muted focus:outline-none"
                    />
                    {recipientInput.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddRecipient()}
                        className="px-2.5 py-1 bg-accent text-paper hover:bg-accent/90 text-xs font-mono font-medium rounded-sm shrink-0 transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Validation / Duplicate Warning */}
                {recipientError && (
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-red-600 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-sm">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{recipientError}</span>
                  </div>
                )}

                {recipients.length === 0 && (
                  <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-700 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-sm">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Recipient list is currently empty. Please add at least one recipient email.
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION B: Input Controls Grid (Reason & Dates) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-paper-light border border-line p-4 rounded-sm shadow-xs">
                {/* 1. Reason Selector */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs font-semibold text-ink flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-accent" />
                    <span>2. Select Leave Reason:</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => handleReasonChange(e.target.value as LeaveReason)}
                    className="w-full p-2 bg-paper border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="PERSONAL">Personal Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="GOING_HOME">Going Home / Travel</option>
                    <option value="FAMILY">Family Commitment</option>
                    <option value="EMERGENCY">Emergency Leave</option>
                    <option value="OTHER">Other / Custom Reason</option>
                  </select>

                  {reason === 'OTHER' && (
                    <input
                      type="text"
                      placeholder="E.g., Medical Appointment, Exam, Passport Renewal..."
                      value={customReasonText}
                      onChange={(e) => setCustomReasonText(e.target.value)}
                      className="w-full p-2 bg-paper border border-line rounded-sm text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-accent mt-2"
                    />
                  )}
                </div>

                {/* 2. Single vs Multi-day Toggle & Dates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-semibold text-ink flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent" />
                      <span>3. Select Leave Date(s):</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-mono text-muted hover:text-ink select-none">
                      <input
                        type="checkbox"
                        checked={isMultiDay}
                        onChange={(e) => setIsMultiDay(e.target.checked)}
                        className="accent-accent rounded-none"
                      />
                      <span>Multiple Days</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-muted block">Start Date:</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-1.5 bg-paper border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
                      />
                    </div>

                    {isMultiDay ? (
                      <div>
                        <span className="font-mono text-[10px] text-muted block">End Date:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full p-1.5 bg-paper border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
                        />
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono text-[10px] text-muted block">
                          Auto Return Date:
                        </span>
                        <div className="p-1.5 bg-paper-dark border border-line rounded-sm text-xs font-mono text-ink font-semibold truncate">
                          {getCalculatedReturnDate() || 'Next day'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION C: Corporate Template Variation Bar */}
              <div className="p-3 bg-accent-subtle/50 border border-accent/30 rounded-sm flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 bg-paper border border-accent/40 rounded-sm">
                    {currentTemplateId}
                  </span>
                  <span className="text-xs font-medium text-ink font-sans">
                    {currentTemplateName}
                  </span>
                </div>

                <button
                  onClick={handleCycleTemplate}
                  className="px-2.5 py-1 bg-paper border border-line hover:border-accent rounded-sm font-mono text-xs text-ink hover:text-accent font-medium transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  title="Cycle to next corporate template variation"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Cycle Variation</span>
                </button>
              </div>

              {/* SECTION D: Email Preview & Live Editor */}
              <div className="border border-line rounded-sm overflow-hidden bg-paper shadow-xs">
                <div className="bg-paper-dark px-4 py-2.5 border-b border-line flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="font-mono text-xs font-bold text-ink">
                      Generated Email Preview
                    </span>
                  </div>

                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-2.5 py-1 font-mono text-xs rounded-sm border transition-colors flex items-center space-x-1 cursor-pointer ${
                      isEditing
                        ? 'bg-accent text-paper border-accent font-semibold shadow-xs'
                        : 'bg-paper text-ink border-line hover:border-ink'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? 'Done Editing' : 'Edit Email'}</span>
                  </button>
                </div>

                <div className="p-4 space-y-3 font-mono text-xs">
                  {/* Recipient To List in Preview */}
                  <div className="flex items-start space-x-2 border-b border-line pb-2.5">
                    <span className="text-muted w-16 pt-0.5 shrink-0 font-semibold">To:</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {recipients.length > 0 ? (
                        recipients.map((email) => (
                          <span
                            key={email}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-sm bg-accent-subtle text-accent border border-accent/30 font-semibold text-[11px]"
                          >
                            <Mail className="w-2.5 h-2.5 shrink-0" />
                            <span>{email}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-red-500 italic">No recipients selected</span>
                      )}
                    </div>
                  </div>

                  {/* Subject Line in Preview */}
                  <div className="flex items-start space-x-2 border-b border-line pb-2.5">
                    <span className="text-muted w-16 pt-1 shrink-0 font-semibold">Subject:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={generatedSubject}
                        onChange={(e) => setGeneratedSubject(e.target.value)}
                        className="flex-1 p-1.5 bg-paper-light border border-accent rounded-sm font-semibold text-ink focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-ink flex-1 pt-1">{generatedSubject}</span>
                    )}
                  </div>

                  {/* Body in Preview */}
                  <div className="pt-1">
                    {isEditing ? (
                      <textarea
                        rows={12}
                        value={generatedBody}
                        onChange={(e) => setGeneratedBody(e.target.value)}
                        className="w-full p-3 bg-paper-light border border-accent rounded-sm font-sans text-xs text-ink leading-relaxed focus:outline-none resize-y"
                      />
                    ) : (
                      <pre className="font-sans text-xs text-ink leading-relaxed whitespace-pre-wrap font-normal">
                        {generatedBody}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              {/* Notification / Success Status */}
              {mailTriggered && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs text-emerald-800 flex items-center justify-between font-mono animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Leave request dispatched to {recipients.length}{' '}
                      {recipients.length === 1 ? 'recipient' : 'recipients'} and logged to your
                      history!
                    </span>
                  </div>
                  <span className="font-semibold text-[11px] hidden sm:inline">Recorded</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEAVE HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">
                    User Leave Email History
                  </h3>
                  <p className="font-mono text-xs text-muted">
                    Log of leave emails generated and sent by {user?.name || 'User'}
                  </p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 bg-paper-dark border border-line rounded-sm font-semibold text-ink">
                  {leaveHistory.length} Recorded Requests
                </span>
              </div>

              {leaveHistory.length === 0 ? (
                <div className="p-12 text-center border border-line bg-paper-light rounded-sm space-y-2">
                  <History className="w-8 h-8 text-muted mx-auto" />
                  <h4 className="font-display text-sm font-bold text-ink">
                    No Previous Leave Emails Sent
                  </h4>
                  <p className="font-mono text-xs text-muted max-w-md mx-auto">
                    Your leave email history begins when you generate and send or copy a leave
                    request. No dummy history exists.
                  </p>
                </div>
              ) : (
                <div className="border border-line rounded-sm overflow-hidden bg-paper divide-y divide-line font-mono text-xs">
                  {leaveHistory.map((rec) => {
                    const itemRecipients =
                      rec.recipients && rec.recipients.length > 0
                        ? rec.recipients
                        : rec.recipient
                        ? [rec.recipient]
                        : [DEFAULT_RECIPIENT];

                    return (
                      <div
                        key={rec.id}
                        className="p-4 space-y-2.5 hover:bg-paper-light transition-colors"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-ink">{rec.reasonDisplay}</span>
                            <span className="px-2 py-0.5 bg-accent-subtle text-accent border border-accent/30 text-[10px] font-bold rounded-sm">
                              {rec.templateId}
                            </span>
                            <span className="text-[10px] text-muted">
                              {rec.sentAt ? rec.sentAt.substring(0, 10) : ''}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyPastEmail(rec)}
                              className="px-2 py-1 bg-paper border border-line hover:border-ink rounded-sm text-[10px] text-ink font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Copy email to clipboard"
                            >
                              {copiedHistoryId === rec.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[10px] font-bold rounded-sm inline-flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>SENT</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-ink font-semibold">
                          Subject: {rec.subject}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted pt-1 border-t border-line/60">
                          <span>
                            Dates: <strong className="text-ink">{rec.startDate}</strong> → Return:{' '}
                            <strong className="text-ink">{rec.returnDate}</strong>
                          </span>

                          <div className="flex items-center space-x-1 flex-wrap">
                            <span className="font-semibold text-ink">To:</span>
                            {itemRecipients.map((rEmail) => (
                              <span
                                key={rEmail}
                                className="px-1.5 py-0.5 bg-paper-dark text-ink rounded-xs border border-line"
                              >
                                {rEmail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Modal Fixed Footer */}
        <div className="bg-paper-light border-t border-line px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-muted font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Auto-signed as: {user?.name || 'Engineer'}</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-4 py-2 bg-surface-raised border border-line hover:border-primary/40 text-ink text-xs font-mono font-medium rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
            </button>

            <button
              onClick={handleOpenMailClient}
              className="flex-1 sm:flex-none px-5 py-2 bg-primary text-paper hover:bg-primary-hover active:scale-[0.99] text-xs font-mono font-semibold rounded-md transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer hover-lift"
            >
              <Send className="w-3.5 h-3.5 text-primary-soft" />
              <span>Send Leave Request</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-surface-raised border border-line hover:border-ink text-muted hover:text-ink font-mono text-xs font-medium rounded-md transition-colors cursor-pointer"
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
