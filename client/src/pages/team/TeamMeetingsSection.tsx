import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import { TeamMeeting, CreateTeamMeetingPayload } from '../../types';
import { TeamMeetingCard } from '../../components/team/TeamMeetingCard';
import { MeetingModal } from '../../components/team/MeetingModal';
import { PageContainer } from '../../components/common/PageContainer';
import { showToast } from '../../components/common/Toast';
import {
  Video,
  Plus,
  AlertCircle,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const TeamMeetingsSection: React.FC = () => {
  const { user } = useAuth();
  const isLead = Boolean(user?.isCurrentLead || user?.role === 'LEAD' || user?.role === 'ADMIN');

  const cachedMeetings = cacheStore.get<TeamMeeting[]>('team_meetings');
  const [meetings, setMeetings] = useState<TeamMeeting[]>(() => cachedMeetings || []);
  const [loading, setLoading] = useState<boolean>(!cachedMeetings);
  const [error, setError] = useState<string | null>(null);

  // Tab Filter State - Smart initial filter: default to ALL or PAST if no upcoming meetings
  const [viewFilter, setViewFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
        showToast('success', 'Meeting Updated', 'Team meeting details have been updated.');
      } else {
        await api.createMeeting(payload);
        showToast(
          'success',
          'Meeting Scheduled & Teammates Notified',
          'All teammates have received an in-app alert and top-up popup.'
        );
        window.dispatchEvent(new CustomEvent('jvm_meeting_created', { detail: payload }));
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

  const handleToggleComplete = async (meeting: TeamMeeting, completed: boolean) => {
    // 1. Optimistic UI update: instantly update UI so the user experiences zero lag
    setMeetings((prev) =>
      prev.map((m) => (m.id === meeting.id ? { ...m, isActive: !completed } : m))
    );

    try {
      if (completed) {
        await api.completeMeeting(meeting.id);
        showToast('success', 'Meeting Concluded', `"${meeting.title}" marked as completed and moved to Past History.`);
        window.dispatchEvent(new CustomEvent('jvm_meeting_completed', { detail: { id: meeting.id } }));
      } else {
        await api.reopenMeeting(meeting.id);
        showToast('success', 'Meeting Reopened', `"${meeting.title}" restored to active upcoming syncs.`);
        window.dispatchEvent(new CustomEvent('jvm_meeting_created', { detail: meeting }));
      }
      await fetchMeetings();
    } catch (err: any) {
      // Revert optimistic update on error
      setMeetings((prev) =>
        prev.map((m) => (m.id === meeting.id ? { ...m, isActive: meeting.isActive } : m))
      );
      showToast('error', 'Status Update Failed', err?.message || 'Failed to update meeting status.');
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

  // Filter meetings for the grid
  const filteredMeetings = meetings.filter((m) => {
    if (viewFilter === 'UPCOMING') {
      return m.isActive && (m.scheduledDate >= todayStr || m.isUpcoming);
    }
    if (viewFilter === 'PAST') {
      return !m.isActive || m.scheduledDate < todayStr;
    }
    return true; // 'ALL'
  }).filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.createdByName && m.createdByName.toLowerCase().includes(q))
    );
  });

  // When upcoming is selected and hero is shown, avoid showing the exact same card twice in the grid
  const gridMeetings = (viewFilter === 'UPCOMING' && heroMeeting)
    ? filteredMeetings.filter((m) => m.id !== heroMeeting.id)
    : filteredMeetings;

  return (
    <PageContainer width="default" className="space-y-6 sm:space-y-8 font-sans pb-16">
      {/* 1. ATMOSPHERIC HEADER BANNER */}
      <div className="bg-paper-light border border-line rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded-full text-xs font-semibold shadow-2xs">
              <Video className="w-3.5 h-3.5" />
              Team Video & Sync Studio
            </span>
            <span className="text-muted/40">·</span>
            {activeUpcomingMeetings.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeUpcomingMeetings.length} Upcoming Sync Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted font-medium bg-paper px-2.5 py-0.5 rounded-full border border-line">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All Syncs Concluded
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Team Meetings & Syncs
          </h1>

          <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            One central hub for the engineering crew to discover upcoming syncs, join live video rooms in 1-click, and review meeting agendas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-paper border border-line rounded-xl text-xs font-mono text-muted shadow-2xs">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span><strong className="text-ink font-bold">{meetings.length}</strong> Total · <strong className="text-emerald-700">{pastMeetings.length}</strong> Done</span>
          </div>

          {isLead && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Schedule Sync</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs rounded-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={fetchMeetings}
            className="underline font-mono text-xs font-semibold hover:text-ink cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span>Connecting to Team Sync Hub...</span>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-paper-light border border-line rounded-2xl p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-2xs">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              No Team Meetings Scheduled Yet
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {isLead
                ? "Schedule your team's next daily standup, sprint review, or architecture spike in 1-click."
                : "Your Team Lead hasn't scheduled any upcoming team meetings yet. Check back soon or request a sync."}
            </p>
          </div>

          {isLead && (
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-200" />
                <span>Schedule First Team Sync</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {/* 2. UPCOMING HERO MEETING SHOWCASE (Only when there is an active upcoming sync) */}
          {heroMeeting && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Next Meeting
              </span>
              <TeamMeetingCard
                meeting={heroMeeting}
                isLead={isLead}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteMeeting}
                onToggleComplete={handleToggleComplete}
                isHero={true}
              />
            </div>
          )}

          {/* 3. INTERACTIVE VIEW FILTER TABS & SEARCH */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-1.5 bg-paper p-1 rounded-xl border border-line overflow-x-auto no-scrollbar">
              <button
                onClick={() => setViewFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                  viewFilter === 'ALL'
                    ? 'bg-paper-light text-primary font-bold shadow-xs border border-primary/20'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All Meetings ({meetings.length})
              </button>

              <button
                onClick={() => setViewFilter('UPCOMING')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                  viewFilter === 'UPCOMING'
                    ? 'bg-paper-light text-primary font-bold shadow-xs border border-primary/20'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Upcoming ({activeUpcomingMeetings.length})
              </button>

              <button
                onClick={() => setViewFilter('PAST')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                  viewFilter === 'PAST'
                    ? 'bg-paper-light text-primary font-bold shadow-xs border border-primary/20'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Past History ({pastMeetings.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search meetings by title or host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-paper border border-line rounded-xl text-xs text-ink placeholder:text-muted/60 focus:outline-hidden focus:border-primary w-full sm:w-64 transition-all"
              />
              <span className="text-xs text-muted font-mono shrink-0 hidden md:inline">
                {gridMeetings.length + (viewFilter === 'UPCOMING' && heroMeeting ? 1 : 0)} of {meetings.length}
              </span>
            </div>
          </div>

          {/* 4. MEETINGS GRID OR ENGAGING ACTIVE GUIDELINES */}
          {viewFilter === 'UPCOMING' && gridMeetings.length === 0 && heroMeeting ? (
            <div className="bg-paper-light border border-line rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-display text-sm font-bold text-ink">
                    Team Sync Guidelines & Active Agenda
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted bg-paper px-2.5 py-1 rounded-md border border-line">
                  Featured sync is live above
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="bg-paper p-3.5 rounded-xl border border-line/70 space-y-1">
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Crisp 15-Minute Standup
                  </div>
                  <p className="text-muted leading-relaxed text-[11px]">
                    Share what was completed, active blockers, and daily deliverables quickly.
                  </p>
                </div>

                <div className="bg-paper p-3.5 rounded-xl border border-line/70 space-y-1">
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Screen Share & Code Reviews
                  </div>
                  <p className="text-muted leading-relaxed text-[11px]">
                    Share terminal or IDE tabs for architecture spikes and PR walkthroughs.
                  </p>
                </div>

                <div className="bg-paper p-3.5 rounded-xl border border-line/70 space-y-1">
                  <div className="font-semibold text-ink flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Instant Task Tracking
                  </div>
                  <p className="text-muted leading-relaxed text-[11px]">
                    Action items can be logged directly into Member Mission Control right after the call.
                  </p>
                </div>
              </div>
            </div>
          ) : gridMeetings.length === 0 ? (
            <div className="bg-paper-light border border-dashed border-line rounded-2xl p-10 text-center space-y-4 max-w-lg mx-auto my-4 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mx-auto shadow-2xs">
                {viewFilter === 'UPCOMING' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Video className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-display text-base font-bold text-ink">
                  {viewFilter === 'UPCOMING'
                    ? "All Syncs Completed"
                    : viewFilter === 'PAST'
                    ? "No Past Meetings Yet"
                    : "No Meetings Found"}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {viewFilter === 'UPCOMING'
                    ? "All team meetings have concluded. You can review past syncs or schedule the next standup."
                    : viewFilter === 'PAST'
                    ? "Concluded meetings will appear here with history and attendance."
                    : "No meetings matched your search criteria."}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {viewFilter === 'UPCOMING' && pastMeetings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewFilter('PAST')}
                    className="px-4 py-2 bg-paper hover:bg-paper-dark border border-line text-ink rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
                  >
                    View Past History ({pastMeetings.length})
                  </button>
                )}
                {isLead && (
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Meeting</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridMeetings.map((m) => (
                <TeamMeetingCard
                  key={m.id}
                  meeting={m}
                  isLead={isLead}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteMeeting}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEAD MEETING SCHEDULE MODAL */}
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
