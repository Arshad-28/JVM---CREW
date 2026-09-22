import React from 'react';
import { TeamMeeting, MeetingPlatform } from '../../types';
import {
  Video,
  ExternalLink,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  UserCheck,
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
        badgeBg: 'bg-success-soft border-success/30 text-success',
        iconBg: 'bg-success text-white',
      };
    case 'ZOOM':
      return {
        label: 'Zoom',
        badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-800',
        iconBg: 'bg-blue-600 text-white',
      };
    case 'MS_TEAMS':
      return {
        label: 'Microsoft Teams',
        badgeBg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800',
        iconBg: 'bg-indigo-600 text-white',
      };
    case 'OTHER':
    default:
      return {
        label: 'Web Meeting',
        badgeBg: 'bg-paper-dark border-line text-ink',
        iconBg: 'bg-primary text-white',
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
  const platformInfo = getPlatformDetails(meeting.platform);
  const formattedDate = formatMeetingDate(meeting.scheduledDate);

  if (isHero) {
    return (
      <div
        className={`border border-primary/30 bg-paper-light rounded-lg p-5 sm:p-7 shadow-card space-y-5 transition-all duration-200 relative overflow-hidden ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-sm flex items-center justify-center shadow-xs ${platformInfo.iconBg}`}>
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-primary-soft border border-primary/20 text-primary px-2 py-0.5 rounded-xs">
                  UPCOMING MEETING
                </span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs border ${platformInfo.badgeBg}`}>
                  {platformInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-muted">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="font-semibold text-ink">{formattedDate}</span>
            <span>·</span>
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-ink">{meeting.startTime}</span>
            {meeting.endTime && <span>– {meeting.endTime}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-black text-ink tracking-tight uppercase">
            {meeting.title}
          </h2>
          {meeting.description && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed font-normal max-w-2xl">
              {meeting.description}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line">
          <div className="flex items-center space-x-2 font-mono text-xs text-muted">
            <UserCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Created by: <strong className="text-ink font-semibold">{meeting.createdByName || 'Team Lead'}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isLead && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(meeting)}
                className="px-3.5 py-2 bg-paper-light hover:bg-paper-dark border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink transition-colors flex items-center space-x-1.5 shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted" />
                <span>Edit Sync</span>
              </button>
            )}

            {isLead && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(meeting)}
                className="px-3 py-2 bg-paper-light hover:bg-danger-soft border border-line hover:border-danger/30 rounded-sm font-mono text-xs font-semibold text-danger transition-colors flex items-center space-x-1 shadow-2xs"
                title="Delete Meeting"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold rounded-sm transition-all shadow-xs flex items-center space-x-2 hover:-translate-y-[1px] active:translate-y-0 shrink-0"
            >
              <Video className="w-4 h-4 text-white" />
              <span>JOIN MEETING</span>
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
      className={`border border-line bg-paper-light hover:border-line-dark rounded-md p-4 sm:p-5 transition-all duration-150 shadow-2xs space-y-3.5 hover:-translate-y-[1px] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs border ${platformInfo.badgeBg}`}>
              {platformInfo.label}
            </span>
            {meeting.isUpcoming && (
              <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs bg-primary-soft text-primary border border-primary/20">
                UPCOMING
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-ink truncate leading-snug">
            {meeting.title}
          </h3>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {isLead && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(meeting)}
              className="p-1.5 text-muted hover:text-ink hover:bg-paper-dark/60 rounded-sm transition-colors"
              title="Edit Meeting"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isLead && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(meeting)}
              className="p-1.5 text-muted hover:text-danger hover:bg-danger-soft rounded-sm transition-colors"
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

      <div className="pt-2 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
        <div className="flex items-center space-x-2 text-muted">
          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{formattedDate}</span>
          <span>·</span>
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-bold text-ink">{meeting.startTime}</span>
        </div>

        <a
          href={meeting.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-primary-soft hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-sm font-mono text-xs font-bold transition-all inline-flex items-center justify-center space-x-1.5 shadow-2xs self-start sm:self-auto hover:-translate-y-[1px] active:translate-y-0"
        >
          <span>Join</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
