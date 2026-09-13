import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LeaveReason,
  LeaveEmailRecord,
  selectNextUnusedTemplate,
  getUserLeaveHistory,
  saveUserLeaveRecord,
  getTemplatesForReason,
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
} from 'lucide-react';

interface LeaveEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveEmailModal: React.FC<LeaveEmailModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');
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
  const [mailTriggered, setMailTriggered] = useState(false);

  // History state
  const [leaveHistory, setLeaveHistory] = useState<LeaveEmailRecord[]>([]);

  // Refresh history when modal opens or user updates
  useEffect(() => {
    if (isOpen && user?.id) {
      const hist = getUserLeaveHistory(user.id);
      setLeaveHistory(hist);
    }
  }, [isOpen, user]);

  // Initialize dates on open
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
      setOverrideTemplateIndex(undefined);
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
    const userName = user?.name || 'Intern';

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

  const handleReasonChange = (newReason: LeaveReason) => {
    setReason(newReason);
    setOverrideTemplateIndex(undefined); // Reset override to auto-select next unused template for new reason
  };

  const handleCycleTemplate = () => {
    const pool = getTemplatesForReason(reason);
    const currentIndex = overrideTemplateIndex !== undefined
      ? overrideTemplateIndex
      : parseInt(currentTemplateId.replace('Template ', ''), 10) - 1;

    const nextIndex = (currentIndex + 1) % pool.length;
    setOverrideTemplateIndex(nextIndex);
  };

  const getReasonDisplay = (r: LeaveReason) => {
    switch (r) {
      case 'SICK': return 'Sick Leave';
      case 'PERSONAL': return 'Personal Leave';
      case 'GOING_HOME': return 'Travel / Going Home';
      case 'FAMILY': return 'Family Commitment';
      case 'EMERGENCY': return 'Emergency Leave';
      case 'OTHER': return customReasonText.trim() ? customReasonText.trim() : 'General Leave';
    }
  };

  const recordLeaveSent = () => {
    if (!user?.id) return;
    const formattedStart = formatDateString(startDate);
    const formattedEnd = formatDateString(endDate);
    const returnDateStr = getCalculatedReturnDate();

    saveUserLeaveRecord(user.id, {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      recipient: 'support@algorithms.com',
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
    const fullText = `TO: support@algorithms.com
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
    recordLeaveSent();
    const mailtoUrl = `mailto:support@algorithms.com?subject=${encodeURIComponent(
      generatedSubject
    )}&body=${encodeURIComponent(generatedBody)}`;
    window.location.href = mailtoUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-paper border border-line max-w-3xl w-full p-6 rounded-sm shadow-2xl space-y-5 my-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-sm bg-accent text-paper flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent/30 px-2 py-0.5 rounded-sm">
                  CORPORATE MNC FORMAT
                </span>
                <span className="font-mono text-xs text-muted">Recipient: support@algorithms.com</span>
              </div>
              <h2 className="font-display text-lg font-bold text-ink mt-0.5">
                Leave Request Email Dispatcher
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-paper-dark text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Navigation Tabs */}
        <div className="flex space-x-2 border-b border-line pb-2">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-1.5 font-mono text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 ${
              activeTab === 'generator'
                ? 'bg-accent text-paper font-semibold shadow-xs'
                : 'bg-paper-dark text-muted hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Leave Email Generator</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 font-mono text-xs font-medium rounded-sm transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-accent text-paper font-semibold shadow-xs'
                : 'bg-paper-dark text-muted hover:text-ink'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Leave Email History ({leaveHistory.length})</span>
          </button>
        </div>

        {/* 1. GENERATOR TAB */}
        {activeTab === 'generator' && (
          <div className="space-y-5">
            {/* Step 1: Input Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-paper-light border border-line p-4 rounded-sm">
              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs font-medium text-ink block">
                  1. Select Leave Reason:
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
                    placeholder="E.g., Medical Appointment, Passport Renewal..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-sm text-xs font-mono text-ink placeholder:text-muted focus:outline-none focus:border-accent mt-2"
                  />
                )}
              </div>

              {/* Single vs Multi-day Toggle & Dates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-xs font-medium text-ink">
                    2. Select Leave Date(s):
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-mono text-muted">
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
                      <span className="font-mono text-[10px] text-muted block">Auto Return Date:</span>
                      <div className="p-1.5 bg-paper-dark border border-line rounded-sm text-xs font-mono text-ink font-semibold truncate">
                        {getCalculatedReturnDate() || 'Next day'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Template Rotation Banner */}
            <div className="p-3 bg-accent-subtle/50 border border-accent/30 rounded-sm flex items-center justify-between">
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
                className="px-2.5 py-1 bg-paper border border-line hover:border-accent rounded-sm font-mono text-xs text-ink hover:text-accent font-medium transition-colors flex items-center space-x-1.5"
                title="Cycle to next distinct corporate template"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Cycle Variation</span>
              </button>
            </div>

            {/* Email Preview & Edit Box */}
            <div className="border border-line rounded-sm overflow-hidden bg-paper shadow-xs">
              <div className="bg-paper-dark px-4 py-2.5 border-b border-line flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs font-bold text-ink">Generated Email Preview</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-2.5 py-1 font-mono text-xs rounded-sm border transition-colors flex items-center space-x-1 ${
                      isEditing
                        ? 'bg-accent text-paper border-accent font-semibold'
                        : 'bg-paper text-ink border-line hover:border-ink'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditing ? 'Done Editing' : 'Edit Email'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center space-x-2 border-b border-line pb-2">
                  <span className="text-muted w-16">To:</span>
                  <span className="font-semibold text-accent">support@algorithms.com</span>
                </div>

                <div className="flex items-start space-x-2 border-b border-line pb-2">
                  <span className="text-muted w-16 pt-1">Subject:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={generatedSubject}
                      onChange={(e) => setGeneratedSubject(e.target.value)}
                      className="flex-1 p-1 bg-paper-light border border-accent rounded-sm font-semibold text-ink focus:outline-none"
                    />
                  ) : (
                    <span className="font-semibold text-ink flex-1 pt-1">{generatedSubject}</span>
                  )}
                </div>

                <div className="pt-2">
                  {isEditing ? (
                    <textarea
                      rows={12}
                      value={generatedBody}
                      onChange={(e) => setGeneratedBody(e.target.value)}
                      className="w-full p-3 bg-paper-light border border-accent rounded-sm font-sans text-xs text-ink leading-relaxed focus:outline-none"
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
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs text-emerald-700 flex items-center justify-between font-mono">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Leave email recorded in history and dispatched to mail client!</span>
                </div>
                <span className="font-semibold">Recipient: support@algorithms.com</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs text-muted font-mono">
                <AlertCircle className="w-3.5 h-3.5 text-accent" />
                <span>Auto-signed as: {user?.name || 'Member'}</span>
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none px-4 py-2 bg-paper border border-line hover:border-ink text-ink text-xs font-mono font-medium rounded-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                </button>

                <button
                  onClick={handleOpenMailClient}
                  className="flex-1 sm:flex-none px-5 py-2 bg-accent text-paper hover:bg-accent/90 text-xs font-mono font-semibold rounded-sm transition-all shadow-xs flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Leave Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. LEAVE HISTORY TAB (Strict Zero Dummy Data Rule) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  User Leave Email History
                </h3>
                <p className="font-mono text-xs text-muted">
                  Log of leave emails generated and sent by {user?.name || 'Member'}
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 bg-paper-dark border border-line rounded-sm font-semibold">
                {leaveHistory.length} Recorded Requests
              </span>
            </div>

            {leaveHistory.length === 0 ? (
              <div className="p-12 text-center border border-line bg-paper rounded-sm space-y-2">
                <History className="w-8 h-8 text-muted mx-auto" />
                <h4 className="font-display text-sm font-bold text-ink">No Previous Leave Emails Sent</h4>
                <p className="font-mono text-xs text-muted max-w-md mx-auto">
                  Your leave email template history begins only when you actually generate and send a leave request. No dummy history exists.
                </p>
              </div>
            ) : (
              <div className="border border-line rounded-sm overflow-hidden bg-paper divide-y divide-line font-mono text-xs">
                {leaveHistory.map((rec) => (
                  <div key={rec.id} className="p-3.5 space-y-2 hover:bg-paper-dark transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-ink">{rec.reasonDisplay}</span>
                        <span className="px-2 py-0.5 bg-accent-subtle text-accent border border-accent/30 text-[10px] font-bold rounded-sm">
                          {rec.templateId}
                        </span>
                        <span className="text-[10px] text-muted">
                          {rec.sentAt ? rec.sentAt.substring(0, 10) : ''}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold rounded-sm inline-flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>SENT</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-ink font-semibold">
                      Subject: {rec.subject}
                    </div>

                    <div className="text-[10px] text-muted flex items-center justify-between">
                      <span>Leave Dates: {rec.startDate} → Return: {rec.returnDate}</span>
                      <span>To: {rec.recipient}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="border-t border-line pt-3 flex items-center justify-between text-xs font-mono text-muted">
          <span>Always addressed to support@algorithms.com</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink text-ink font-medium rounded-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
