import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TeamMeeting, MeetingPlatform, CreateTeamMeetingPayload } from '../../types';
import { Calendar, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMeeting ? 'Edit Team Meeting' : 'Schedule Team Meeting'}
      kicker="TEAM COMMUNICATION & SYNC"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 rounded-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Meeting Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Daily Standup Sync / Sprint Review"
            className="w-full px-3.5 py-2.5 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-medium transition-all"
          />
        </div>

        {/* Platform Selector */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Platform <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'GOOGLE_MEET' as MeetingPlatform, label: 'Google Meet' },
              { id: 'ZOOM' as MeetingPlatform, label: 'Zoom' },
              { id: 'MS_TEAMS' as MeetingPlatform, label: 'MS Teams' },
              { id: 'OTHER' as MeetingPlatform, label: 'Other / Link' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlatform(p.id)}
                className={`px-3 py-2 border rounded-md font-mono text-xs font-bold transition-all ${
                  platform === p.id
                    ? 'bg-primary-soft text-primary border-primary/30 shadow-2xs font-bold'
                    : 'bg-surface-raised hover:bg-surface-soft border-line text-muted hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting URL */}
        <div className="space-y-1.5">
          <label className="block font-bold text-ink">
            Meeting URL (HTTPS only) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 text-muted absolute left-3.5 top-3.5" />
            <input
              type="url"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx or zoom.us/j/..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-mono text-xs transition-all"
            />
          </div>
          <p className="text-[11px] font-mono text-muted">
            Members can easily click "Join Meeting" to open this link in a new tab.
          </p>
        </div>

        {/* Date & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              Date <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-muted absolute left-3.5 top-3.5" />
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full pl-9 pr-2.5 py-2.5 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-mono text-xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              Start Time <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="5:30 PM / 17:30"
                className="w-full pl-9 pr-2.5 py-2.5 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-mono text-xs transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-ink">
              End Time
            </label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="6:30 PM / 18:30"
                className="w-full pl-9 pr-2.5 py-2.5 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-mono text-xs transition-all"
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
            placeholder="Agenda, discussion topics, or notes for the team..."
            className="w-full p-3 bg-surface border border-line focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md outline-none text-ink font-sans text-xs leading-relaxed transition-all"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-line flex items-center justify-end space-x-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
          >
            {initialMeeting ? 'Save Changes' : 'Schedule Meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
