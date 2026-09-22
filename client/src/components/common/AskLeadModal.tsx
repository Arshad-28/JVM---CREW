import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { VoiceSpeechControl } from './VoiceSpeechControl';
import { X, Send, AlertTriangle } from 'lucide-react';

interface AskLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: () => void;
}

const TOPICS = [
  'Java',
  'DSA',
  'Task',
  'Project',
  'General',
  'Other',
];

const PRIORITIES = ['Normal', 'Important', 'Urgent'];

export const AskLeadModal: React.FC<AskLeadModalProps> = ({
  isOpen,
  onClose,
  onSent,
}) => {
  const [message, setMessage] = useState('');
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [topic, setTopic] = useState('Java');
  const [priority, setPriority] = useState('Normal');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleVoiceTranscript = (text: string, mode: 'replace' | 'append') => {
    setInputMethod('voice');
    if (mode === 'append' && message.trim()) {
      setMessage((prev) => prev.trim() + ' ' + text);
    } else {
      setMessage(text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSending(true);
      setError(null);
      const isUrgent = priority === 'Urgent';
      await api.sendLeadMessage({
        message: message.trim(),
        inputMethod,
        relatedTopic: `${topic} · ${priority}`,
        isUrgent,
      });

      setMessage('');
      setTopic('Java');
      setPriority('Normal');
      setInputMethod('text');
      onSent();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send message to Lead');
    } finally {
      setSending(false);
    }
  };

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
        className="relative z-[110] bg-paper border border-line max-w-lg w-full p-6 rounded-2xl shadow-modal space-y-4 my-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent">
              COMMUNICATION CHANNEL
            </span>
            <h2 className="font-display text-lg font-bold text-ink mt-0.5">
              Ask Your Lead
            </h2>
            <p className="text-xs text-muted">
              Ask questions, get guidance, clarify doubts, or flag an urgent blocker anytime.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-ink transition-colors rounded-sm hover:bg-paper-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-attention/10 border border-attention text-xs text-attention rounded-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Topic Selector */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold text-muted uppercase block">
              Topic (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1 rounded-xs font-mono text-[11px] transition-colors ${
                    topic === t
                      ? 'bg-ink text-paper font-semibold shadow-xs'
                      : 'bg-paper border border-line text-ink hover:border-ink'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Question / Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] font-bold text-muted uppercase">
                Your question:
              </label>
              <span className="font-mono text-[10px] text-muted">
                {inputMethod === 'voice' ? '🎙 Voice recorded' : '⌨ Typing'}
              </span>
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (inputMethod !== 'voice') setInputMethod('text');
              }}
              placeholder="Type your question or message for your Lead..."
              className="w-full p-3 bg-paper border border-line rounded-sm text-xs text-ink focus:outline-none focus:border-ink font-sans placeholder:text-muted/60"
              autoFocus
            />

            {/* Voice Control Button */}
            <VoiceSpeechControl
              existingText={message}
              onTranscript={handleVoiceTranscript}
            />
          </div>

          {/* Priority Selector */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] font-bold text-muted uppercase block">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const isUrgent = p === 'Urgent';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 border rounded-xs font-mono text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? isUrgent
                          ? 'border-attention bg-attention text-paper shadow-xs font-bold'
                          : 'border-ink bg-ink text-paper shadow-xs'
                        : 'border-line bg-paper text-ink hover:border-ink'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            {priority === 'Urgent' && (
              <p className="text-[11px] text-attention font-medium mt-1">
                Urgent questions appear immediately at the top of your Lead's action center.
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-line text-muted hover:text-ink font-mono text-xs rounded-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="px-5 py-2 bg-accent text-paper hover:bg-accent-dark font-mono text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send to Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
