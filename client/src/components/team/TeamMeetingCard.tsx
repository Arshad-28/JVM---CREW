import React, { useState } from 'react';
import { TeamMeeting, MeetingPlatform } from '../../types';
import {
  Video,
  ExternalLink,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  UserCheck,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface TeamMeetingCardProps {
  meeting: TeamMeeting;
  isLead?: boolean;
  onEdit?: (meeting: TeamMeeting) => void;
  onDelete?: (meeting: TeamMeeting) => void;
  isHero?: boolean;
  className?: string;
}

export const getPlatformDetails = (platform: MeetingPlatform) => {
  switch (platform) {
    case 'GOOGLE_MEET':
      return {
        label: 'Google Meet',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        iconBg: 'bg-emerald-600 text-white',
        borderHover: 'hover:border-emerald-500/50',
      };
    case 'ZOOM':
      return {
        label: 'Zoom Video',
        badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        iconBg: 'bg-blue-600 text-white',
        borderHover: 'hover:border-blue-500/50',
      };
    case 'MS_TEAMS':
      return {
        label: 'Microsoft Teams',
        badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
        iconBg: 'bg-purple-600 text-white',
        borderHover: 'hover:border-purple-500/50',
      };
    case 'OTHER':
    default:
      return {
        label: 'Live Web Sync',
        badgeBg: 'bg-paper-dark border-line text-ink',
        iconBg: 'bg-primary text-white',
        borderHover: 'hover:border-primary/50',
      };
  }
};

export const formatMeetingDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

export const TeamMeetingCard: React.FC<TeamMeetingCardProps> = ({
  meeting,
  isLead = false,
  onEdit,
  onDelete,
  isHero = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const platformInfo = getPlatformDetails(meeting.platform);
  const formattedDate = formatMeetingDate(meeting.scheduledDate);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(meeting.meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  if (isHero) {
    return (
      <div
        className={`border border-primary/30 bg-paper-light rounded-2xl p-6 sm:p-8 shadow-card space-y-6 transition-all duration-200 relative overflow-hidden ${className}`}
      >
        {/* Ambient decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${platformInfo.iconBg}`}>
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 border border-primary/25 text-primary px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Next Upcoming Sync
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${platformInfo.badgeBg}`}>
                  {platformInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted bg-paper px-3.5 py-1.5 rounded-xl border border-line">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-ink">{formattedDate}</span>
            <span>·</span>
            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-bold text-ink">{meeting.startTime}</span>
            {meeting.endTime && <span>– {meeting.endTime}</span>}
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
            {meeting.title}
          </h2>
          {meeting.description && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-3xl">
              {meeting.description}
            </p>
          )}
        </div>

        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line relative z-10">
          <div className="flex items-center gap-2 text-xs text-muted">
            <UserCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Host / Lead: <strong className="text-ink font-semibold">{meeting.createdByName || 'Team Lead'}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 bg-paper hover:bg-paper-dark border border-line hover:border-primary/40 rounded-xl text-xs font-semibold text-ink transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Copy meeting link"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-muted" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {isLead && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(meeting)}
                className="px-3.5 py-2.5 bg-paper hover:bg-paper-dark border border-line hover:border-ink rounded-xl text-xs font-semibold text-ink transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted" />
                <span>Edit Sync</span>
              </button>
            )}

            {isLead && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(meeting)}
                className="p-2.5 bg-paper hover:bg-rose-500/10 border border-line hover:border-rose-500/30 rounded-xl text-rose-700 transition-all flex items-center shadow-2xs cursor-pointer active:scale-95"
                title="Delete Meeting"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Video className="w-4 h-4 text-emerald-200" />
              <span>JOIN LIVE MEETING</span>
              <ExternalLink className="w-3.5 h-3.5 text-white/80" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Standard Meeting Card
  return (
    <div
      className={`border border-line bg-paper-light hover:border-primary/40 rounded-2xl p-5 transition-all duration-200 shadow-2xs hover:shadow-card-hover space-y-4 hover:-translate-y-1 group flex flex-col justify-between ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${platformInfo.badgeBg}`}>
                {platformInfo.label}
              </span>
              {meeting.isUpcoming && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  Upcoming
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-bold text-ink truncate leading-snug group-hover:text-primary transition-colors">
              {meeting.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isLead && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(meeting)}
                className="p-1.5 text-muted hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Edit Meeting"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {isLead && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(meeting)}
                className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Delete Meeting"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {meeting.description && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
            {meeting.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted font-mono text-[11px] truncate">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{formattedDate}</span>
          <span>·</span>
          <span className="font-semibold text-ink">{meeting.startTime}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 text-muted hover:text-ink hover:bg-paper rounded-lg transition-colors cursor-pointer active:scale-95"
            title="Copy link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <a
            href={meeting.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            <span>Join</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
