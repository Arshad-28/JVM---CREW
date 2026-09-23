import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TeamMeeting, MeetingPlatform, CreateTeamMeetingPayload } from '../../types';
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  AlertCircle,
  Video,
  Sparkles,
  Zap,
} from 'lucide-react';

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateTeamMeetingPayload) => Promise<void>;
  initialMeeting?: TeamMeeting | null;
  loading?: boolean;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMeeting,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<MeetingPlatform>('GOOGLE_MEET');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('18:30');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title);
      setPlatform(initialMeeting.platform || 'GOOGLE_MEET');
      setMeetingUrl(initialMeeting.meetingUrl);
      setScheduledDate(initialMeeting.scheduledDate);
      setStartTime(initialMeeting.startTime || '17:30');
      setEndTime(initialMeeting.endTime || '18:30');
      setDescription(initialMeeting.description || '');
    } else {
      setTitle('Weekly Team Sync');
      setPlatform('GOOGLE_MEET');
      setMeetingUrl('');
      const today = new Date().toISOString().substring(0, 10);
      setScheduledDate(today);
      setStartTime('17:30');
      setEndTime('18:30');
      setDescription('Weekly engineering team sync and blockers check-in.');
    }
    setError(null);
  }, [initialMeeting, isOpen]);

  const handleApplyTemplate = (tpl: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  }) => {
    setTitle(tpl.title);
    setStartTime(tpl.startTime);
    setEndTime(tpl.endTime);
    setDescription(tpl.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }
    if (!meetingUrl.trim()) {
      setError('Please provide a valid meeting URL.');
      return;
    }
    let cleanUrl = meetingUrl.trim();
    if (!cleanUrl.startsWith('https://')) {
      if (cleanUrl.startsWith('http://')) {
        cleanUrl = 'https://' + cleanUrl.substring(7);
      } else {
        cleanUrl = 'https://' + cleanUrl;
      }
    }
    if (!scheduledDate) {
      setError('Please select a scheduled date.');
      return;
    }
    if (!startTime.trim()) {
      setError('Please provide a start time.');
      return;
    }

    try {
      setError(null);
      await onSave({
        title: title.trim(),
        platform,
        meetingUrl: cleanUrl,
        scheduledDate,
        startTime: startTime.trim(),
        endTime: endTime.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save meeting.');
    }
  };

  const templates = [
    {
      title: 'Daily Morning Standup',
      startTime: '09:30',
      endTime: '10:00',
      description: 'Daily standup to review progress, today priorities, and unblock team members.',
    },
    {
      title: 'Daily Evening Sync & Blockers',
      startTime: '17:30',
      endTime: '18:15',
      description: 'Review completed tasks, discuss technical hurdles, and align on tomorrow goals.',
    },
    {
      title: 'Architecture & Code Review Sync',
      startTime: '16:00',
      endTime: '17:00',
      description: 'Deep dive into pull requests, system architecture designs, and code standards.',
    },
    {
      title: 'Sprint Review & Demo',
      startTime: '15:00',
      endTime: '16:00',
      description: 'Team demo of completed sprint features and milestone review.',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMeeting ? 'Edit Team Meeting' : 'Schedule Team Meeting'}
      subtitle="Create a shared room for your team."
      kicker="TEAM COMMUNICATION & SYNC"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Quick Template Chips (Only for new meetings) */}
        {!initialMeeting && (
          <div className="space-y-2 p-3 bg-paper rounded-xl border border-line">
            <span className="text-[11px] font-semibold text-muted flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Quick Meeting Templates (1-Click Fill):</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1.5 bg-paper-light hover:bg-primary-soft/50 border border-line hover:border-primary/40 rounded-lg text-ink text-[11px] font-medium transition-all shadow-2xs hover:-translate-y-0.5 cursor-pointer active:scale-95 text-left"
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Meeting Title <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Daily Standup Sync / Sprint Review"
            className="w-full px-4 py-2.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-semibold transition-all placeholder:text-muted/60 shadow-2xs min-h-[44px]"
          />
        </div>

        {/* Platform Selector */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Video Platform <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: 'GOOGLE_MEET' as MeetingPlatform,
                label: 'Google Meet',
                activeClass: 'bg-primary-soft text-primary border-primary ring-1 ring-primary font-bold',
                badge: 'Meet',
              },
              {
                id: 'ZOOM' as MeetingPlatform,
                label: 'Zoom',
                activeClass: 'bg-primary-soft text-primary border-primary ring-1 ring-primary font-bold',
                badge: 'Zoom',
              },
              {
                id: 'MS_TEAMS' as MeetingPlatform,
                label: 'MS Teams',
                activeClass: 'bg-primary-soft text-primary border-primary ring-1 ring-primary font-bold',
                badge: 'Teams',
              },
              {
                id: 'OTHER' as MeetingPlatform,
                label: 'Web Link',
                activeClass: 'bg-primary-soft text-primary border-primary ring-1 ring-primary font-bold',
                badge: 'Custom',
              },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`p-3 border rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs min-h-[44px] ${
                  platform === p.id
                    ? p.activeClass
                    : 'bg-paper hover:bg-paper-dark/60 border-line text-muted hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{p.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Meeting URL */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Meeting URL (HTTPS only) <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
            <input
              type="url"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/..."
              className="w-full pl-10 pr-4 py-2.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-mono text-xs transition-all shadow-2xs placeholder:text-muted/60 min-h-[44px]"
            />
          </div>
          <p className="text-[11px] text-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <span>Team members can click &quot;Join Live Meeting&quot; directly from their dashboard.</span>
          </p>
        </div>

        {/* Date & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              Date <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-mono text-xs transition-all shadow-2xs min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              Start Time <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="5:30 PM / 17:30"
                className="w-full pl-10 pr-3 py-2.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-mono text-xs transition-all shadow-2xs min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              End Time
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="6:30 PM / 18:30"
                className="w-full pl-10 pr-3 py-2.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-mono text-xs transition-all shadow-2xs min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Description / Agenda
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda, discussion points, sprint goals, or blockers check-in..."
            className="w-full p-3.5 bg-paper border border-line hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl outline-none text-ink font-sans text-xs leading-relaxed transition-all shadow-2xs placeholder:text-muted/60"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] min-w-[90px]"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="px-6 shadow-xs min-h-[44px]"
          >
            {initialMeeting ? 'Save Changes' : 'Schedule Team Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
