import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TeamMeeting } from '../../types';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Radio,
  User as UserIcon,
} from 'lucide-react';

interface TeamMeetingAlertPopupProps {
  onNavigateTab?: (tab: string) => void;
}

export const TeamMeetingAlertPopup: React.FC<TeamMeetingAlertPopupProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<TeamMeeting | null>(null);
  const [dismissedId, setDismissedId] = useState<number | null>(null);
  const [minimized, setMinimized] = useState<boolean>(false);

  const checkUpcomingMeeting = useCallback(async () => {
    if (!user) return;
    try {
      const nextMeeting = await api.getUpcomingMeeting();
      if (!nextMeeting || !nextMeeting.isActive) {
        setMeeting(null);
        return;
      }

      setMeeting(nextMeeting);

      // Check if explicitly dismissed
      const isDismissed = sessionStorage.getItem(`dismissed_meeting_${nextMeeting.id}`);
      if (isDismissed) {
        setDismissedId(nextMeeting.id);
      } else {
        setDismissedId(null);
      }
    } catch {
      // Non-critical background failure
    }
  }, [user]);

  // Initial check and periodic fast polling (15s) so teammates get immediate alerts
  useEffect(() => {
    checkUpcomingMeeting();
    const interval = setInterval(checkUpcomingMeeting, 15000);

    const handleMeetingCreated = () => {
      sessionStorage.clear();
      setDismissedId(null);
      setMinimized(false);
      checkUpcomingMeeting();
    };

    const handleMeetingCompleted = (e: any) => {
      const completedId = e?.detail?.id;
      if (!completedId || meeting?.id === completedId) {
        setMeeting(null);
      }
      checkUpcomingMeeting();
    };

    window.addEventListener('jvm_meeting_created', handleMeetingCreated);
    window.addEventListener('jvm_meeting_completed', handleMeetingCompleted);
    window.addEventListener('jvm_notification_received', handleMeetingCreated);
    window.addEventListener('focus', checkUpcomingMeeting);

    return () => {
      clearInterval(interval);
      window.removeEventListener('jvm_meeting_created', handleMeetingCreated);
      window.removeEventListener('jvm_meeting_completed', handleMeetingCompleted);
      window.removeEventListener('jvm_notification_received', handleMeetingCreated);
      window.removeEventListener('focus', checkUpcomingMeeting);
    };
  }, [checkUpcomingMeeting, meeting?.id]);

  if (!meeting || !meeting.isActive) {
    return null;
  }

  // If dismissed, hide completely so it doesn't obstruct the user
  if (dismissedId === meeting.id) {
    return null;
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  const isToday = meeting.scheduledDate === todayStr;

  const handleDismiss = () => {
    sessionStorage.setItem(`dismissed_meeting_${meeting.id}`, 'true');
    setDismissedId(meeting.id);
  };

  const handleJoin = () => {
    if (meeting.meetingUrl) {
      window.open(meeting.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewMeetings = () => {
    if (onNavigateTab) {
      onNavigateTab('meetings');
    }
  };

  const isLiveNow = isToday; // highlight today's meetings as live/priority

  const platformLabel: Record<string, string> = {
    GOOGLE_MEET: 'Google Meet',
    ZOOM: 'Zoom Meeting',
    MS_TEAMS: 'Microsoft Teams',
    OTHER: 'Video Room',
  };
  const currentPlatformLabel = platformLabel[meeting.platform] || 'Google Meet';

  return (
    <div className="fixed bottom-14 right-5 sm:bottom-16 sm:right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] animate-slide-up pointer-events-auto">
      {minimized ? (
        <div
          onClick={() => setMinimized(false)}
          className="bg-paper border-2 border-primary/50 text-ink rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-primary hover:scale-[1.02] transition-all backdrop-blur-md bg-paper/95 ring-2 ring-primary/20"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Video className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate text-ink">{meeting.title}</span>
              <span className="text-[10px] text-muted font-medium">Click to expand & join sync</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1 text-muted hover:text-ink rounded-lg transition-colors shrink-0"
            title="Dismiss popup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-paper border border-line rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-xl bg-paper/98 ring-1 ring-black/5 dark:ring-white/10">
          {/* Header Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                <Radio className="w-3 h-3 animate-pulse text-rose-600" />
                {isLiveNow ? 'Team Meeting' : 'Upcoming Sync'}
              </span>
              <span className="text-[11px] font-mono text-muted">{currentPlatformLabel}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                className="p-1 text-muted hover:text-ink rounded-md transition-colors text-xs font-mono"
                title="Minimize alert"
              >
                _
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-muted hover:text-ink rounded-md transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="space-y-1.5">
            <h4 className="font-display text-base font-bold text-ink tracking-tight line-clamp-1">
              {meeting.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-muted">
              <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-medium text-ink">
                {meeting.createdByName ? `${meeting.createdByName} (Team Lead)` : 'Team Lead'}
              </span>
              <span>is conducting a meeting</span>
            </div>
          </div>

          {/* Schedule Badges */}
          <div className="flex flex-wrap items-center gap-2 py-1 text-[11px] font-mono text-muted">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper-dark/60 border border-line rounded-lg">
              <Calendar className="w-3 h-3 text-muted" />
              <span>{isToday ? 'Today' : meeting.scheduledDate}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper-dark/60 border border-line rounded-lg">
              <Clock className="w-3 h-3 text-muted" />
              <span className="font-semibold text-ink">
                {meeting.startTime}
                {meeting.endTime ? ` – ${meeting.endTime}` : ''}
              </span>
            </div>
          </div>

          {meeting.description && (
            <p className="text-xs text-muted line-clamp-2 leading-relaxed bg-paper-light border border-line/60 rounded-xl p-2.5">
              {meeting.description}
            </p>
          )}

          {/* Actions */}
          <div className="pt-1 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleJoin}
              className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-sans cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Join Meeting Now</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              type="button"
              onClick={handleViewMeetings}
              className="py-2.5 px-3 bg-paper border border-line hover:border-ink/30 text-ink text-xs font-medium rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              View Syncs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
