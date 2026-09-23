import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, cacheStore } from '../../services/api';
import {
  CrewMemberProfile,
  mapTeamMemberToCrewProfile,
} from '../../services/crewService';
import { CrewCard3D } from '../../components/crew/CrewCard3D';
import { EditCrewMemberModal } from '../../components/crew/EditCrewMemberModal';
import { Users, Crown, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { cleanTeamDisplayName } from '../../utils/greetingEngine';
import { PageContainer } from '../../components/common/PageContainer';

export const MeetTheCrewPage: React.FC = () => {
  const { user, updateAccount } = useAuth();
  const cachedTeam = cacheStore.get<any>('my_team');

  const [crewMembers, setCrewMembers] = useState<CrewMemberProfile[]>(() => {
    if (cachedTeam && cachedTeam.members && cachedTeam.members.length > 0) {
      return cachedTeam.members.map(mapTeamMemberToCrewProfile);
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => !cachedTeam);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<CrewMemberProfile | null>(null);

  const loadTeamCrew = async () => {
    try {
      if (!crewMembers.length && !cacheStore.get<any>('my_team')) {
        setLoading(true);
      }
      const teamData = await api.getMyTeam();
      if (teamData && teamData.members && teamData.members.length > 0) {
        const mapped = teamData.members.map(mapTeamMemberToCrewProfile);
        setCrewMembers(mapped);
      } else {
        setCrewMembers([]);
      }
    } catch (err) {
      console.error('Failed to load team crew members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamCrew();
  }, [user]);

  const handleSaveProfile = async (updates: Partial<CrewMemberProfile>) => {
    if (!editingMember) return;
    try {
      const isSelf = user && (
        (user.id !== undefined && editingMember.userId !== undefined && user.id === editingMember.userId) ||
        (user.id !== undefined && editingMember.id !== undefined && user.id === editingMember.id) ||
        (user.email && editingMember.email && user.email.toLowerCase() === editingMember.email.toLowerCase())
      );
      const isLead = user && (Boolean(user.isCurrentLead) || user.role === 'LEAD' || user.role === 'ADMIN');

      if (isSelf) {
        await updateAccount({
          name: updates.name || editingMember.name,
          email: updates.email || editingMember.email,
          phoneNumber: updates.phoneNumber || editingMember.phoneNumber,
          college: updates.college,
          organization: updates.internship,
          bio: updates.bio,
          githubUrl: updates.githubUrl || updates.github,
          linkedinUrl: updates.linkedinUrl || updates.linkedin,
          photoUrl: updates.photoUrl,
        });
      } else if (isLead) {
        await api.updateTeamMember(editingMember.id, {
          name: updates.name || editingMember.name,
          email: updates.email || editingMember.email,
          serialNumber: updates.serialNumber || editingMember.serialNumber,
          position: updates.internshipRole || editingMember.internshipRole,
          phoneNumber: updates.phoneNumber || editingMember.phoneNumber,
          college: updates.college,
          organization: updates.internship,
          bio: updates.bio,
          githubUrl: updates.githubUrl || updates.github,
          linkedinUrl: updates.linkedinUrl || updates.linkedin,
          photoUrl: updates.photoUrl,
        });
      }
    } catch (err) {
      console.error('Failed to sync profile update with database:', err);
    }
    await loadTeamCrew();
  };

  const selectedMember = selectedMemberId
    ? crewMembers.find((m) => m.id === selectedMemberId) || null
    : null;

  // Split members for 3 top / 2 bottom layout on desktop
  const topMembers = crewMembers.slice(0, 3);
  const bottomMembers = crewMembers.slice(3, 5);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-16 text-center font-mono text-xs text-muted animate-pulse">
        Loading crew dossier...
      </div>
    );
  }

  return (
    <PageContainer width="default" className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-sm mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>{cleanTeamDisplayName(user?.teamName).toUpperCase() || 'TEAM'} CREW COLLECTION</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-black text-ink tracking-tight uppercase">
          MEET THE CREW
        </h1>

        <p className="font-mono text-sm text-muted italic">
          “Different minds. One crew.”
        </p>
      </div>

      {/* Horizontal Team Selector Filter Bar */}
      <div className="flex items-center justify-center flex-wrap gap-2 pb-2 border-b border-line">
        <button
          onClick={() => setSelectedMemberId(null)}
          className={`px-4 py-2 font-mono text-xs font-bold rounded-md border transition-all flex items-center space-x-1.5 ${
            selectedMemberId === null
              ? 'bg-primary-soft text-primary font-bold border-primary/25 shadow-2xs'
              : 'bg-surface-raised text-muted hover:text-ink hover:bg-surface-soft border-line'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>ALL MEMBERS ({crewMembers.length})</span>
        </button>

        {crewMembers.map((member) => {
          const isSelected = selectedMemberId === member.id;
          const isCaptain = member.role === 'LEAD' || Boolean(member.isCurrentLead);

          return (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-md border transition-all flex items-center space-x-1.5 uppercase ${
                isSelected
                  ? isCaptain
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-2xs font-bold'
                    : 'bg-primary-soft text-primary border-primary/25 shadow-2xs font-bold'
                  : 'bg-surface-raised text-muted hover:text-ink hover:bg-surface-soft border-line'
              }`}
            >
              {isCaptain && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              <span>{member.name}</span>
              <span className="opacity-70 text-[10px]">({member.symbol})</span>
            </button>
          );
        })}
      </div>

      {/* VIEW MODE A: SINGLE FOCUSED MEMBER DIGITAL CARD */}
      {selectedMember ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Member Detail Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 font-mono text-xs">
            {/* Left: Compact, single-line Back button */}
            <button
              type="button"
              onClick={() => setSelectedMemberId(null)}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-paper hover:bg-paper-dark border border-line hover:border-ink rounded-xs text-ink font-bold transition-colors whitespace-nowrap shadow-2xs self-start sm:self-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-accent shrink-0" />
              <span className="whitespace-nowrap">Back to Collection</span>
            </button>

            {/* Right: Actual dynamic crew ID badge + flip hint */}
            <div className="flex items-center space-x-2 text-muted font-bold whitespace-nowrap">
              <span className="font-mono font-black text-ink px-2 py-0.5 bg-paper-dark border border-line rounded-xs">
                {selectedMember.serialNumber || 'MEMBER'}
              </span>
              <span>·</span>
              <span className="text-muted">Click card to flip</span>
            </div>
          </div>

          <div className="py-2 flex justify-center">
            <CrewCard3D
              member={selectedMember}
              isFocused={true}
              currentUser={user}
              onEdit={() => setEditingMember(selectedMember)}
            />
          </div>
        </div>
      ) : (
        /* VIEW MODE B: ALL MEMBERS DIGITAL CHARACTER GALLERY GRID */
        crewMembers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-line rounded-sm font-mono text-xs text-muted bg-paper-dark/30">
            No team members added yet.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between font-mono text-xs text-muted border-b border-line pb-2">
              <span>COLLECTION SET — {crewMembers.length} DIGITAL CHARACTER CARDS</span>
              <span className="flex items-center space-x-1 text-accent">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hover for 3D tilt · Click to flip dossier</span>
              </span>
            </div>

            {/* Row 1: Up to 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {topMembers.map((member) => (
                <CrewCard3D
                  key={member.id}
                  member={member}
                  isFocused={false}
                  currentUser={user}
                  onSelect={() => setSelectedMemberId(member.id)}
                  onEdit={() => setEditingMember(member)}
                />
              ))}
            </div>

            {/* Row 2: Remaining Cards Centered */}
            {bottomMembers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {bottomMembers.map((member) => (
                  <CrewCard3D
                    key={member.id}
                    member={member}
                    isFocused={false}
                    currentUser={user}
                    onSelect={() => setSelectedMemberId(member.id)}
                    onEdit={() => setEditingMember(member)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Large Centered Modal Profile Editor */}
      <EditCrewMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        currentUser={user}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveProfile}
      />
    </PageContainer>
  );
};
