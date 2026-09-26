import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TeamManagementInfo, OrganizationTeamSummary } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cleanTeamDisplayName, getTeamInitial, getUserInitial, sanitizeSocialUrl, normalizeSocialUrl } from '../../utils/greetingEngine';
import {
  Edit3,
  UserPlus,
  RotateCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Linkedin,
  Github,
} from 'lucide-react';

export const TeamManagementSection: React.FC = () => {
  const { user } = useAuth();
  const [teamInfo, setTeamInfo] = useState<TeamManagementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');

  const [changeLeadModalOpen, setChangeLeadModalOpen] = useState(false);
  const [selectedNewLeadUserId, setSelectedNewLeadUserId] = useState<number | null>(null);
  const [leadChangeNotes, setLeadChangeNotes] = useState('');

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberCollege, setNewMemberCollege] = useState('');
  const [newMemberOrg, setNewMemberOrg] = useState('Algorithms365');
  const [newMemberSerial, setNewMemberSerial] = useState('');
  const [newMemberBio, setNewMemberBio] = useState('');
  const [newMemberLinkedin, setNewMemberLinkedin] = useState('');
  const [newMemberGithub, setNewMemberGithub] = useState('');
  const [newMemberTransfer, setNewMemberTransfer] = useState(false);

  // Edit Member Modal
  const [editMemberModalOpen, setEditMemberModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberSerial, setEditMemberSerial] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberCollege, setEditMemberCollege] = useState('');
  const [editMemberOrg, setEditMemberOrg] = useState('');
  const [editMemberBio, setEditMemberBio] = useState('');
  const [editMemberLinkedin, setEditMemberLinkedin] = useState('');
  const [editMemberGithub, setEditMemberGithub] = useState('');

  const [orgTeamsModalOpen, setOrgTeamsModalOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<OrganizationTeamSummary[]>([]);
  const [loadingOrgTeams, setLoadingOrgTeams] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const data = await api.getMyTeam();
      setTeamInfo(data);
      setNewCustomName(data.customName || data.displayName || '');
    } catch (err: any) {
      console.error('Failed to load team management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [user]);

  const handleRenameTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await api.updateTeamName(newCustomName);
      setTeamInfo(updated);
      setRenameModalOpen(false);
      setSuccessMsg(`Team renamed to ${updated.displayName} successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rename team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewLeadUserId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await api.changeTeamLead({
        newLeadUserId: selectedNewLeadUserId,
        notes: leadChangeNotes || 'Monthly Lead Rotation',
      });
      setTeamInfo(updated);
      setChangeLeadModalOpen(false);
      setSuccessMsg('Team Lead updated successfully in PostgreSQL.');
      setTimeout(() => setSuccessMsg(null), 4000);
      // Reload page state
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change team lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberPassword || newMemberPassword.length < 6) {
      setErrorMsg('Please specify an initial password of at least 6 characters for the intern.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await api.addTeamMember({
        email: newMemberEmail,
        name: newMemberName,
        password: newMemberPassword.trim(),
        phoneNumber: newMemberPhone,
        college: newMemberCollege,
        organization: newMemberOrg,
        serialNumber: newMemberSerial,
        bio: newMemberBio.trim() || undefined,
        linkedinUrl: normalizeSocialUrl(newMemberLinkedin) || undefined,
        githubUrl: normalizeSocialUrl(newMemberGithub) || undefined,
        transferIfAssigned: newMemberTransfer,
      });
      setTeamInfo(updated);
      setAddMemberModalOpen(false);
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPassword('');
      setNewMemberPhone('');
      setNewMemberCollege('');
      setNewMemberOrg('Algorithms365');
      setNewMemberSerial('');
      setNewMemberBio('');
      setNewMemberLinkedin('');
      setNewMemberGithub('');
      setNewMemberTransfer(false);
      setSuccessMsg('Member onboarded to team and Supabase Auth credentials provisioned successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditMember = (m: any) => {
    setEditingUserId(m.userId);
    setEditMemberName(m.name || '');
    setEditMemberEmail(m.email || '');
    setEditMemberSerial(m.serialNumber || '');
    setEditMemberPhone(m.phoneNumber || '');
    setEditMemberCollege(m.college || '');
    setEditMemberOrg(m.organization || '');
    setEditMemberBio(m.bio || '');
    setEditMemberLinkedin(m.linkedinUrl || '');
    setEditMemberGithub(m.githubUrl || '');
    setEditMemberModalOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await api.updateTeamMember(editingUserId, {
        name: editMemberName.trim(),
        email: editMemberEmail.trim().toLowerCase(),
        serialNumber: editMemberSerial.trim() || undefined,
        phoneNumber: editMemberPhone.trim() || undefined,
        college: editMemberCollege.trim() || undefined,
        organization: editMemberOrg.trim() || undefined,
        bio: editMemberBio.trim() || undefined,
        linkedinUrl: normalizeSocialUrl(editMemberLinkedin) || undefined,
        githubUrl: normalizeSocialUrl(editMemberGithub) || undefined,
      });
      setTeamInfo(updated);
      setEditMemberModalOpen(false);
      setSuccessMsg('Member information and social profiles updated in PostgreSQL.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update team member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number, targetName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the active team roster? Their personal history and account will be preserved.`)) {
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await api.removeTeamMember(targetUserId);
      setTeamInfo(updated);
      setSuccessMsg(`${targetName} was removed from the active team.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOrgTeams = async () => {
    try {
      setOrgTeamsModalOpen(true);
      setLoadingOrgTeams(true);
      const list = await api.getAllTeams();
      setAllTeams(list);
    } catch (err) {
      console.error('Failed to load org teams:', err);
    } finally {
      setLoadingOrgTeams(false);
    }
  };

  const isLeadOrAdmin = user?.role === 'LEAD' || user?.role === 'ADMIN';

  if (loading || !teamInfo) {
    return (
      <div className="border border-line bg-paper rounded-sm p-6 text-center font-mono text-xs text-muted flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span>Loading team management configuration from PostgreSQL...</span>
      </div>
    );
  }

  return (
    <div className="border border-line bg-paper rounded-sm p-5 space-y-5 font-sans shadow-2xs">
      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xs font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-muted hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xs font-mono text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-muted hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. HEADER & IDENTITY BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-sm bg-ink text-paper font-mono font-black text-base flex items-center justify-center shadow-xs">
            {getTeamInitial(teamInfo.displayName || user?.teamName)}
          </div>
          <div>
            <h2 className="font-display text-lg font-black text-ink uppercase tracking-tight">
              {cleanTeamDisplayName(teamInfo.displayName) || cleanTeamDisplayName(user?.teamName) || 'Loading team...'}
            </h2>
            <p className="font-mono text-[11px] text-muted">
              Active Engineering Team · {teamInfo.memberCount} Members
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleOpenOrgTeams}
            className="px-3 py-1.5 border border-line hover:border-ink font-mono text-xs font-bold rounded-xs flex items-center space-x-1.5 text-muted hover:text-ink transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-accent" />
            <span>ALL TEAMS (COHORT)</span>
          </button>

          {isLeadOrAdmin && (
            <button
              onClick={() => setRenameModalOpen(true)}
              className="px-3 py-1.5 bg-paper-dark border border-line hover:border-ink font-mono text-xs font-bold rounded-xs flex items-center space-x-1.5 text-ink transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-accent" />
              <span>EDIT TEAM NAME</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CURRENT LEAD RESPONSIBILITY CARD */}
      <div className="bg-paper-dark/60 border border-line rounded-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-sm bg-accent text-paper font-mono font-black text-xl flex items-center justify-center shadow-xs">
            {getUserInitial(teamInfo.currentLead?.name || user?.name)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-display text-sm font-bold text-ink uppercase">
                {teamInfo.currentLead ? teamInfo.currentLead.name : 'No Active Lead'}
              </span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase">
                CURRENT LEAD
              </span>
            </div>
            <div className="font-mono text-xs text-muted flex flex-wrap items-center gap-2">
              <span className="text-ink font-semibold">SDE Intern</span>
              <span>·</span>
              <span>{teamInfo.currentLead?.email || '—'}</span>
              <span>·</span>
              <span>{teamInfo.currentLead?.periodLabel || 'Active Rotation'}</span>
              {(teamInfo.currentLead?.linkedinUrl || teamInfo.currentLead?.githubUrl) && (
                <>
                  <span>·</span>
                  <div className="flex items-center space-x-1.5">
                    {teamInfo.currentLead?.linkedinUrl && (
                      <a
                        href={sanitizeSocialUrl(teamInfo.currentLead.linkedinUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white border border-[#0077B5]/30 rounded-xs text-[10px] font-bold"
                        title="Open Lead's LinkedIn"
                      >
                        <Linkedin className="w-2.5 h-2.5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {teamInfo.currentLead?.githubUrl && (
                      <a
                        href={sanitizeSocialUrl(teamInfo.currentLead.githubUrl) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-1.5 py-0.2 bg-slate-900/10 text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-900/30 rounded-xs text-[10px] font-bold"
                        title="Open Lead's GitHub"
                      >
                        <Github className="w-2.5 h-2.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isLeadOrAdmin && (
          <button
            onClick={() => {
              setSelectedNewLeadUserId(teamInfo.members[0]?.userId || null);
              setChangeLeadModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink/90 font-mono text-xs font-bold rounded-xs flex items-center space-x-1.5 shadow-xs shrink-0"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>CHANGE LEAD</span>
          </button>
        )}
      </div>

      {/* 3. TEAM MEMBERS ROSTER */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-xs font-bold text-muted uppercase tracking-wider">
            TEAM MEMBERS ({teamInfo.members.length} MEMBERS)
          </span>

          {isLeadOrAdmin && (
            <button
              onClick={() => setAddMemberModalOpen(true)}
              className="px-3 py-1.5 bg-paper border border-line hover:border-ink font-mono text-xs font-semibold rounded-xs flex items-center space-x-1 text-ink shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-accent" />
              <span>+ ADD MEMBER</span>
            </button>
          )}
        </div>

        {/* Desktop Table View (hidden on md-) */}
        <div className="hidden md:block border border-line rounded-xs overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-paper-dark border-b border-line text-muted uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Serial #</th>
                <th className="py-2.5 px-3">Intern Name</th>
                <th className="py-2.5 px-3">Designation</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Joined Date</th>
                {isLeadOrAdmin && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teamInfo.members.map((m) => (
                <tr key={m.membershipId} className={m.isCurrentLead ? 'bg-amber-500/5 font-semibold' : 'hover:bg-paper-dark/30'}>
                  <td className="py-2.5 px-3 font-bold text-ink">{m.serialNumber}</td>
                  <td className="py-2.5 px-3 text-ink">
                    <div>{m.name}</div>
                    <div className="text-[10px] text-muted font-normal flex items-center space-x-2">
                      <span>{m.email}</span>
                      {(m.linkedinUrl || m.githubUrl) && (
                        <span className="inline-flex items-center space-x-1.5">
                          {m.linkedinUrl && (
                            <a
                              href={sanitizeSocialUrl(m.linkedinUrl) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0077B5] hover:underline"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-3 h-3" />
                            </a>
                          )}
                          {m.githubUrl && (
                            <a
                              href={sanitizeSocialUrl(m.githubUrl) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-900 hover:underline"
                              title="GitHub Profile"
                            >
                              <Github className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-muted">{m.position || 'SDE Intern'}</td>
                  <td className="py-2.5 px-3">
                    {m.isCurrentLead ? (
                      <span className="px-2 py-0.5 rounded-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                        CURRENT LEAD
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-xs bg-paper-dark text-muted border border-line text-[10px]">
                        MEMBER
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted text-[11px]">
                    {m.joinedAt ? m.joinedAt.substring(0, 10) : '—'}
                  </td>
                  {isLeadOrAdmin && (
                    <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditMember(m)}
                        className="px-2 py-0.5 border border-line hover:border-ink bg-paper text-ink rounded-xs text-[10px] font-bold"
                        title="Edit Member Details"
                      >
                        Edit
                      </button>
                      {!m.isCurrentLead && (
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.name)}
                          className="px-2 py-0.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xs text-[10px]"
                          title="Remove from active team roster"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (hidden on md+) */}
        <div className="md:hidden divide-y divide-line border border-line rounded-xs">
          {teamInfo.members.map((m) => (
            <div key={m.membershipId} className={`p-3.5 space-y-2.5 ${m.isCurrentLead ? 'bg-amber-500/5' : 'bg-paper'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-ink text-xs font-mono">{m.serialNumber}</span>
                  <span className="font-bold text-ink text-xs">{m.name}</span>
                </div>
                {m.isCurrentLead ? (
                  <span className="px-2 py-0.5 rounded-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase font-mono">
                    CURRENT LEAD
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-xs bg-paper-dark text-muted border border-line text-[10px] font-mono">
                    MEMBER
                  </span>
                )}
              </div>

              <div className="text-[11px] font-mono text-muted space-y-0.5">
                <div>Email: <span className="text-ink">{m.email}</span></div>
                <div>Role: <span className="text-ink">{m.position || 'SDE Intern'}</span></div>
                <div>Joined: <span className="text-ink">{m.joinedAt ? m.joinedAt.substring(0, 10) : '—'}</span></div>
              </div>

              {(m.linkedinUrl || m.githubUrl) && (
                <div className="flex items-center space-x-2 pt-1 font-mono text-[10px]">
                  {m.linkedinUrl && (
                    <a
                      href={sanitizeSocialUrl(m.linkedinUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-[#0077B5]/10 text-[#0077B5] border border-[#0077B5]/30 rounded-xs font-bold"
                    >
                      <Linkedin className="w-2.5 h-2.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {m.githubUrl && (
                    <a
                      href={sanitizeSocialUrl(m.githubUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-slate-900/10 text-slate-900 border border-slate-900/30 rounded-xs font-bold"
                    >
                      <Github className="w-2.5 h-2.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              )}

              {isLeadOrAdmin && (
                <div className="flex items-center justify-end space-x-2 pt-1 border-t border-line">
                  <button
                    onClick={() => handleOpenEditMember(m)}
                    className="px-3 py-1 border border-line hover:border-ink bg-paper text-ink rounded-xs text-xs font-mono font-bold"
                  >
                    Edit Details
                  </button>
                  {!m.isCurrentLead && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.name)}
                      className="px-3 py-1 border border-red-500/20 text-red-600 hover:bg-red-500/10 rounded-xs text-xs font-mono"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: EDIT TEAM NAME */}
      {/* ==================================================== */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-md rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-bold text-ink text-sm">EDIT CUSTOM TEAM NAME</span>
              <button onClick={() => setRenameModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameTeam} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Team Name</label>
                <input
                  type="text"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  placeholder="e.g. STACK, PHOENIX, NOVA"
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-semibold"
                  required
                />
                <p className="text-[10px] text-muted">Team Identity will be: {newCustomName.trim() || 'Team'}</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-3 py-1.5 border border-line rounded-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink/90 font-bold rounded-xs"
                >
                  {submitting ? 'Saving...' : 'Save Team Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: CHANGE TEAM LEAD */}
      {/* ==================================================== */}
      {changeLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-md rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-bold text-ink text-sm">CHANGE CURRENT LEAD</span>
              <button onClick={() => setChangeLeadModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-muted">
              Select one of the SDE Interns from {teamInfo.displayName}. The selected member will receive Lead permissions, while the previous lead returns to normal member status with all personal data preserved.
            </p>

            <form onSubmit={handleChangeLead} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Select New Current Lead</label>
                <select
                  value={selectedNewLeadUserId || ''}
                  onChange={(e) => setSelectedNewLeadUserId(Number(e.target.value))}
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-semibold"
                  required
                >
                  {teamInfo.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.serialNumber}) — SDE Intern {m.isCurrentLead ? '(Already Lead)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Rotation Notes</label>
                <input
                  type="text"
                  value={leadChangeNotes}
                  onChange={(e) => setLeadChangeNotes(e.target.value)}
                  placeholder="e.g. October 2026 Leadership Rotation"
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChangeLeadModalOpen(false)}
                  className="px-3 py-1.5 border border-line rounded-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xs"
                >
                  {submitting ? 'Updating...' : 'Confirm Lead Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD MEMBER */}
      {/* ==================================================== */}
      {addMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-md rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-bold text-ink text-sm">ADD SDE INTERN TO TEAM</span>
              <button onClick={() => setAddMemberModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Intern Full Name"
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Email Address *</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="intern@example.com"
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Initial Password * (Min 6 chars)</label>
                  <input
                    type="text"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="Enter initial password"
                    minLength={6}
                    required
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Crew ID (Optional - Auto Assigned)</label>
                  <input
                    type="text"
                    value={newMemberSerial}
                    onChange={(e) => setNewMemberSerial(e.target.value)}
                    placeholder={teamInfo ? `Auto-assigned (e.g. ${teamInfo.displayName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-00${(teamInfo.members?.length || 1) + 1})` : 'e.g. STACK-002'}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">College / University</label>
                  <input
                    type="text"
                    value={newMemberCollege}
                    onChange={(e) => setNewMemberCollege(e.target.value)}
                    placeholder="Kalpataru Inst of Tech"
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Organization / Cohort</label>
                <input
                  type="text"
                  value={newMemberOrg}
                  onChange={(e) => setNewMemberOrg(e.target.value)}
                  placeholder="Algorithms365"
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px] flex items-center space-x-1">
                    <Linkedin className="w-3 h-3 text-[#0077B5]" />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={newMemberLinkedin}
                    onChange={(e) => setNewMemberLinkedin(e.target.value)}
                    placeholder="e.g. linkedin.com/in/... or https://..."
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px] flex items-center space-x-1">
                    <Github className="w-3 h-3 text-slate-900" />
                    <span>GitHub Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={newMemberGithub}
                    onChange={(e) => setNewMemberGithub(e.target.value)}
                    placeholder="e.g. github.com/... or https://..."
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Engineering Bio / Summary (Optional)</label>
                <input
                  type="text"
                  value={newMemberBio}
                  onChange={(e) => setNewMemberBio(e.target.value)}
                  placeholder="e.g. Backend developer focusing on Spring Boot and microservices"
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-[11px] text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMemberTransfer}
                    onChange={(e) => setNewMemberTransfer(e.target.checked)}
                    className="rounded-xs text-accent focus:ring-0"
                  />
                  <span>Transfer member if currently active in another team</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-3 py-1.5 border border-line rounded-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink/90 font-bold rounded-xs"
                >
                  {submitting ? 'Adding...' : 'Add Intern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3.5: EDIT MEMBER DETAILS (LEAD PRIVILEGE)       */}
      {/* ==================================================== */}
      {editMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-lg rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-bold text-ink text-sm">EDIT SDE INTERN PROFILE & CREDENTIALS</span>
              <button onClick={() => setEditMemberModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditMember} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    value={editMemberName}
                    onChange={(e) => setEditMemberName(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Email Address *</label>
                  <input
                    type="email"
                    value={editMemberEmail}
                    onChange={(e) => setEditMemberEmail(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Crew Serial ID</label>
                  <input
                    type="text"
                    value={editMemberSerial}
                    onChange={(e) => setEditMemberSerial(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Phone Number</label>
                  <input
                    type="tel"
                    value={editMemberPhone}
                    onChange={(e) => setEditMemberPhone(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">College / University</label>
                  <input
                    type="text"
                    value={editMemberCollege}
                    onChange={(e) => setEditMemberCollege(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px]">Organization</label>
                  <input
                    type="text"
                    value={editMemberOrg}
                    onChange={(e) => setEditMemberOrg(e.target.value)}
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px] flex items-center space-x-1">
                    <Linkedin className="w-3 h-3 text-[#0077B5]" />
                    <span>LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={editMemberLinkedin}
                    onChange={(e) => setEditMemberLinkedin(e.target.value)}
                    placeholder="e.g. linkedin.com/in/username or https://..."
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted font-bold block uppercase text-[10px] flex items-center space-x-1">
                    <Github className="w-3 h-3 text-slate-900" />
                    <span>GitHub Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={editMemberGithub}
                    onChange={(e) => setEditMemberGithub(e.target.value)}
                    placeholder="e.g. github.com/username or https://..."
                    className="w-full p-2 bg-paper border border-line rounded-xs text-ink font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted font-bold block uppercase text-[10px]">Engineering Bio / Summary</label>
                <textarea
                  rows={2}
                  value={editMemberBio}
                  onChange={(e) => setEditMemberBio(e.target.value)}
                  placeholder="Summary of engineering focus..."
                  className="w-full p-2 bg-paper border border-line rounded-xs text-ink"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditMemberModalOpen(false)}
                  className="px-3 py-1.5 border border-line rounded-xs text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-ink text-paper hover:bg-ink/90 font-bold rounded-xs"
                >
                  {submitting ? 'Saving...' : 'Save Member Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: ALL ORGANIZATION TEAMS (ORGANIZATION OVERVIEW) */}
      {/* ==================================================== */}
      {orgTeamsModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper border border-line w-full max-w-2xl rounded-sm shadow-xl p-5 space-y-4 font-mono text-xs animate-scale-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-accent" />
                <span className="font-bold text-ink text-sm uppercase">ALL ORGANIZATION TEAMS & COHORTS</span>
              </div>
              <button onClick={() => setOrgTeamsModalOpen(false)} className="text-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingOrgTeams ? (
              <div className="py-8 text-center text-muted">Loading all organization teams...</div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-muted">
                  Organization-level overview of all active internship squads. Each team operates with its own designated Current Lead and isolated deliverables.
                </p>

                <div className="border border-line rounded-xs overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-paper-dark border-b border-line text-muted uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Team Name</th>
                        <th className="py-2.5 px-3">Cohort</th>
                        <th className="py-2.5 px-3">Current Lead</th>
                        <th className="py-2.5 px-3">Lead Term</th>
                        <th className="py-2.5 px-3">Members</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {allTeams.map((t) => (
                        <tr key={t.id} className={t.id === teamInfo.id ? 'bg-amber-500/5 font-semibold' : 'hover:bg-paper-dark/30'}>
                          <td className="py-2.5 px-3 text-ink font-bold">
                            {t.displayName} {t.id === teamInfo.id && <span className="text-[10px] text-accent">(Your Team)</span>}
                          </td>
                          <td className="py-2.5 px-3 text-muted">{t.cohort}</td>
                          <td className="py-2.5 px-3 text-ink">{t.currentLeadName || 'Unassigned'}</td>
                          <td className="py-2.5 px-3 text-muted text-[11px]">{t.currentLeadPeriod || '—'}</td>
                          <td className="py-2.5 px-3 font-bold text-ink">{t.memberCount} interns</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setOrgTeamsModalOpen(false)}
                className="px-4 py-1.5 bg-paper-dark border border-line rounded-xs text-ink font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
