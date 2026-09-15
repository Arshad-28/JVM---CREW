import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CrewMemberProfile,
  mapTeamMemberToCrewProfile,
} from '../../services/crewService';
import { CrewCard3D } from '../../components/crew/CrewCard3D';
import { EditCrewMemberModal } from '../../components/crew/EditCrewMemberModal';
import { Edit3 } from 'lucide-react';

export const MyProfilePage: React.FC = () => {
  const { user, updateAccount } = useAuth();
  const [editingMember, setEditingMember] = useState<CrewMemberProfile | null>(null);
  const [, setRefreshKey] = useState(0);

  if (!user) return null;

  const myProfile: CrewMemberProfile = mapTeamMemberToCrewProfile({
    membershipId: 1,
    userId: user.id,
    name: user.name,
    email: user.email,
    serialNumber: user.serialNumber || 'MEMBER',
    position: user.position || 'SDE Intern',
    role: (user.role === 'ADMIN' ? 'LEAD' : user.role) as 'LEAD' | 'MEMBER',
    isCurrentLead: Boolean(user.isCurrentLead),
    joinedAt: new Date().toISOString(),
    isActive: true,
    phoneNumber: user.phoneNumber,
    college: user.college,
    organization: user.organization,
    bio: user.bio,
    githubUrl: user.githubUrl,
    linkedinUrl: user.linkedinUrl,
    photoUrl: user.photoUrl,
    avatarUrl: user.avatarUrl,
  });

  const handleSaveProfile = async (updates: Partial<CrewMemberProfile>) => {
    try {
      await updateAccount({
        name: updates.name || user.name,
        email: updates.email || user.email,
        phoneNumber: updates.phoneNumber || user.phoneNumber,
        college: updates.college || user.college,
        organization: updates.internship || user.organization,
        bio: updates.bio || user.bio,
        githubUrl: updates.githubUrl || updates.github || user.githubUrl,
        linkedinUrl: updates.linkedinUrl || updates.linkedin || user.linkedinUrl,
        photoUrl: updates.photoUrl || user.photoUrl,
        avatarUrl: updates.avatarUrl || user.avatarUrl,
      });
    } catch (err) {
      console.error('Failed to sync profile update with database:', err);
    }
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="border border-line bg-paper p-4 sm:p-6 rounded-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 px-2 py-0.5 rounded-sm">
              PERSONAL WORKSPACE
            </span>
            <span className="font-mono text-xs text-muted font-bold">ID: {myProfile?.serialNumber || user?.serialNumber || 'MEMBER'}</span>
          </div>
          <h1 className="font-display text-2xl font-black text-ink">
            My Profile — Digital Crew Card
          </h1>
          <p className="font-mono text-xs text-muted">
            Private engineering identity, academic background, and dossier controls.
          </p>
        </div>

        {myProfile && (
          <button
            onClick={() => setEditingMember(myProfile)}
            className="px-4 py-2 bg-ink text-paper hover:bg-ink/90 rounded-sm font-mono text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit My Profile</span>
          </button>
        )}
      </div>

      {/* Centerpiece Collectible Character Card (ONLY Current User's Card) */}
      {myProfile ? (
        <div className="py-4">
          <CrewCard3D
            member={myProfile}
            isFocused={true}
            currentUser={user}
            onEdit={() => setEditingMember(myProfile)}
          />
        </div>
      ) : (
        <div className="p-12 text-center text-muted font-mono text-xs border border-line bg-paper rounded-sm">
          No profile data found for current user account.
        </div>
      )}

      {/* Large Centered Modal Profile Editor */}
      <EditCrewMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        currentUser={user}
        onClose={() => setEditingMember(null)}
        onSave={handleSaveProfile}
      />
    </div>
  );
};
