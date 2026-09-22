import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { TeamMeeting, CreateTeamMeetingPayload } from '../../types';
import { TeamMeetingCard } from '../../components/team/TeamMeetingCard';
import { MeetingModal } from '../../components/team/MeetingModal';
import { EmptyState } from '../../components/common/EmptyState';
import { PageContainer } from '../../components/common/PageContainer';
import {
  Video,
  Plus,
  AlertCircle,
} from 'lucide-react';

export const TeamMeetingsSection: React.FC = () => {
  const { user } = useAuth();
  const isLead = Boolean(user?.isCurrentLead || user?.role === 'LEAD' || user?.role === 'ADMIN');

  const cachedMeetings = cacheStore.get<TeamMeeting[]>('team_meetings');
  const [meetings, setMeetings] = useState<TeamMeeting[]>(() => cachedMeetings || []);
  const [loading, setLoading] = useState<boolean>(!cachedMeetings);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<TeamMeeting | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMeetings = async () => {
    try {
      if (!meetings.length && !cacheStore.get<TeamMeeting[]>('team_meetings')) {
        setLoading(true);
      }
      setError(null);
      const data = await api.getTeamMeetings();
      setMeetings(data || []);
    } catch (err: any) {
      console.error('Failed to load team meetings:', err);
      setError(err?.message || 'Failed to load team meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  const handleOpenCreateModal = () => {
    setSelectedMeeting(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (meeting: TeamMeeting) => {
    setSelectedMeeting(meeting);
    setModalOpen(true);
  };

  const handleSaveMeeting = async (payload: CreateTeamMeetingPayload) => {
    try {
      setSaving(true);
      if (selectedMeeting) {
        await api.updateMeeting(selectedMeeting.id, payload);
      } else {
        await api.createMeeting(payload);
      }
      await fetchMeetings();
      setModalOpen(false);
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (meeting: TeamMeeting) => {
    if (!window.confirm(`Are you sure you want to delete "${meeting.title}"?`)) return;
    try {
      await api.deleteMeeting(meeting.id);
      await fetchMeetings();
    } catch (err: any) {
      alert('Failed to delete meeting: ' + err.message);
    }
  };

  const todayStr = new Date().toISOString().substring(0, 10);
  const activeUpcomingMeetings = meetings.filter(
    (m) => m.isActive && (m.scheduledDate >= todayStr || m.isUpcoming)
  );
  const pastMeetings = meetings.filter(
    (m) => !m.isActive || m.scheduledDate < todayStr
  );

  const heroMeeting = activeUpcomingMeetings[0] || null;
  const otherUpcomingMeetings = heroMeeting
    ? activeUpcomingMeetings.slice(1)
    : [];

  return (
    <PageContainer width="default" className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="border border-line bg-paper-light p-5 sm:p-6 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-accent/10 border border-accent/30 text-accent px-2 py-0.5 rounded-xs">
              TEAM COMMUNICATION & MEETINGS
            </span>
            <span className="font-mono text-xs text-muted">
              · Stay connected with your crew
            </span>
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-ink uppercase tracking-tight">
            TEAM MEETINGS
          </h1>
          <p className="text-xs text-muted leading-relaxed font-normal max-w-xl">
            One central place for the team to find current sync links, join live meetings, and keep aligned.
          </p>
        </div>

        {isLead && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-ink hover:bg-ink-light text-paper font-mono text-xs font-bold rounded-sm transition-all shadow-xs flex items-center space-x-2 self-start sm:self-auto shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-md flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchMeetings}
            className="underline font-mono text-xs font-semibold hover:text-ink"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span>Loading team meetings...</span>
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={<Video className="w-5 h-5 text-accent" />}
          title="No Team Meetings Scheduled"
          description={
            isLead
              ? "You haven't scheduled any team syncs yet. Click 'Schedule Meeting' to create a Google Meet, Zoom, or Teams link for your crew."
              : "Your Team Lead hasn't scheduled any upcoming team meetings yet. Check back soon or message your Lead."
          }
          action={
            isLead ? (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-ink hover:bg-ink-light text-paper font-mono text-xs font-bold rounded-sm transition-all shadow-xs flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-accent" />
                <span>Schedule First Meeting</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* UPCOMING HERO MEETING */}
          {heroMeeting && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                Next Upcoming Team Sync
              </span>
              <TeamMeetingCard
                meeting={heroMeeting}
                isLead={isLead}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteMeeting}
                isHero={true}
              />
            </div>
          )}

          {/* OTHER UPCOMING MEETINGS */}
          {otherUpcomingMeetings.length > 0 && (
            <div className="space-y-3">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                Scheduled Upcoming Syncs ({otherUpcomingMeetings.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherUpcomingMeetings.map((m) => (
                  <TeamMeetingCard
                    key={m.id}
                    meeting={m}
                    isLead={isLead}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteMeeting}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PREVIOUS MEETINGS HISTORY */}
          {pastMeetings.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-line">
              <span className="font-mono text-[11px] font-bold text-muted uppercase tracking-wider block">
                Past Meetings History ({pastMeetings.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                {pastMeetings.map((m) => (
                  <TeamMeetingCard
                    key={m.id}
                    meeting={m}
                    isLead={isLead}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteMeeting}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEAD MEETING MODAL */}
      <MeetingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveMeeting}
        initialMeeting={selectedMeeting}
        loading={saving}
      />
    </PageContainer>
  );
};
