import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CrewMemberProfile } from '../../services/crewService';
import {
  X,
  Check,
  Edit3,
  Upload,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  User,
  Sparkles,
  Code,
  Eye,
  Linkedin,
  Github,
} from 'lucide-react';
import { CrewCard3D } from './CrewCard3D';
import { normalizeSocialUrl } from '../../utils/greetingEngine';
import { AvatarPickerModal } from './AvatarPickerModal';
import { AVATAR_LIBRARY } from '../../utils/avatarLibrary';

interface EditCrewMemberModalProps {
  isOpen: boolean;
  member: CrewMemberProfile | null;
  currentUser: any;
  onClose: () => void;
  onSave: (updated: Partial<CrewMemberProfile>) => void;
}

const IDENTITY_TITLES = [
  { title: 'THE CAPTAIN', class: 'LEADERSHIP / ARCHITECT' },
  { title: 'THE ACE', class: 'PRECISION / PROBLEM SOLVING' },
  { title: 'THE BUILDER', class: 'ENGINEERING / IMPLEMENTATION' },
  { title: 'THE STRATEGIST', class: 'STRATEGY / LOGIC' },
  { title: 'THE EXPLORER', class: 'DISCOVERY / LEARNING' },
  { title: 'THE ARCHITECT', class: 'SYSTEM DESIGN / INFRASTRUCTURE' },
  { title: 'THE INNOVATOR', class: 'RESEARCH & CREATIVITY' },
  { title: 'THE EXECUTOR', class: 'HIGH OUTPUT / VELOCITY' },
];

export const EditCrewMemberModal: React.FC<EditCrewMemberModalProps> = ({
  isOpen,
  member,
  currentUser,
  onClose,
  onSave,
}) => {
  const isLead = Boolean(currentUser?.isCurrentLead) || currentUser?.role === 'LEAD' || currentUser?.role === 'ADMIN';
  const isSelf = currentUser && member && (
    (currentUser.id !== undefined && member.userId !== undefined && currentUser.id === member.userId) ||
    (currentUser.id !== undefined && member.id !== undefined && currentUser.id === member.id) ||
    (currentUser.email && member.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
  );
  const canEdit = isLead || isSelf;

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identityTitle, setIdentityTitle] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [symbol, setSymbol] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [college, setCollege] = useState('');
  const [internship, setInternship] = useState('');
  const [internshipRole, setInternshipRole] = useState('');
  const [role, setRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Unsaved changes & notification states
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setIdentityTitle(member.identityTitle || '');
      setCharacterClass(member.characterClass || '');
      setSymbol(member.symbol || '');
      setPhotoUrl(member.photoUrl || '');
      setCollege(member.college || '');
      setInternship(member.internship || '');
      setInternshipRole(member.internshipRole || '');
      setRole(member.role || 'MEMBER');
      setBio(member.bio || '');
      setLinkedinUrl(member.linkedinUrl || member.linkedin || '');
      setGithubUrl(member.githubUrl || member.github || '');
      setShowUnsavedPrompt(false);
      setSaveSuccessMsg(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member || !canEdit) return null;

  const isFormDirty =
    member &&
    (name !== (member.name || '') ||
      email !== (member.email || '') ||
      identityTitle !== (member.identityTitle || '') ||
      characterClass !== (member.characterClass || '') ||
      symbol !== (member.symbol || '') ||
      photoUrl !== (member.photoUrl || '') ||
      college !== (member.college || '') ||
      internship !== (member.internship || '') ||
      internshipRole !== (member.internshipRole || '') ||
      role !== (member.role || 'MEMBER') ||
      bio !== (member.bio || '') ||
      linkedinUrl !== (member.linkedinUrl || member.linkedin || '') ||
      githubUrl !== (member.githubUrl || member.github || ''));

  const handleCloseAttempt = () => {
    if (isFormDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normLinkedin = normalizeSocialUrl(linkedinUrl);
    const normGithub = normalizeSocialUrl(githubUrl);

    onSave({
      name: name.trim() || member.name,
      email: email.trim() || member.email,
      identityTitle: identityTitle.trim() || member.identityTitle,
      characterClass: characterClass.trim() || member.characterClass,
      symbol: symbol.trim().toUpperCase() || member.symbol,
      photoUrl: photoUrl.trim() || undefined,
      college: college.trim() || undefined,
      internship: internship.trim() || undefined,
      internshipRole: internshipRole.trim() || undefined,
      role: isLead ? role : member.role,
      bio: bio.trim() || undefined,
      linkedinUrl: normLinkedin || undefined,
      githubUrl: normGithub || undefined,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 1000);
  };

  // Construct draft object for live preview
  const draftLinkedin = normalizeSocialUrl(linkedinUrl);
  const draftGithub = normalizeSocialUrl(githubUrl);

  const draftMember: CrewMemberProfile = {
    ...member,
    name: name.trim() || member.name,
    email: email.trim() || member.email,
    identityTitle: identityTitle.trim() || member.identityTitle,
    characterClass: characterClass.trim() || member.characterClass,
    symbol: symbol.trim().toUpperCase() || member.symbol,
    photoUrl: photoUrl.trim() || member.photoUrl,
    college: college.trim() || member.college,
    internship: internship.trim() || member.internship,
    internshipRole: internshipRole.trim() || member.internshipRole,
    role: isLead ? role : member.role,
    bio: bio.trim() || member.bio,
    linkedinUrl: draftLinkedin || undefined,
    githubUrl: draftGithub || undefined,
    linkedin: draftLinkedin || undefined,
    github: draftGithub || undefined,
  };

  if (!isOpen || !member || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-x-hidden font-sans outline-none"
    >
      {/* Backdrop overlay click */}
      <div
        className="fixed inset-0 z-[100] transition-opacity duration-200 animate-fade-in cursor-pointer"
        style={{
          backgroundColor: 'rgba(15, 23, 20, 0.38)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
        }}
        onClick={handleCloseAttempt}
        aria-hidden="true"
      />

      {/* Large Centered Modal Container */}
      <div
        className="relative z-[110] w-full sm:max-w-5xl bg-[#FAF9F6] border border-slate-300 rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] my-0 sm:my-auto animate-scale-in text-slate-900 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-300 bg-[#F5F4EF] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-sm bg-accent text-paper flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent/30 px-2 py-0.5 rounded-xs">
                  {isLead ? 'LEAD MEMBER CONFIGURATION' : 'PERSONAL CARD CONFIGURATION'}
                </span>
                <span className="font-mono text-xs text-slate-500 font-bold">{member.serialNumber}</span>
              </div>
              <h2 className="font-display text-base font-black text-slate-900 mt-0.5 uppercase tracking-tight">
                Edit Digital Card — {member.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-1.5 rounded-sm hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body (Split: Editor Form + Live Card Preview) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left / Top: Live Card Preview Panel */}
          <div className="lg:col-span-5 p-5 bg-[#F3F2EC] border-b lg:border-b-0 lg:border-r border-slate-300 flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-slate-700 uppercase">
              <Eye className="w-4 h-4 text-accent" />
              <span>LIVE CARD PREVIEW</span>
            </div>

            <div className="w-full flex justify-center py-2">
              <CrewCard3D
                member={draftMember}
                isFocused={true}
                currentUser={currentUser}
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono text-center">
              Changes update live in preview above
            </span>
          </div>

          {/* Right: Form Controls */}
          <form id="crew-edit-modal-form" onSubmit={handleSubmit} className="lg:col-span-7 p-6 overflow-y-auto space-y-5 text-xs">
            {saveSuccessMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-400 font-bold flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>✓ Profile updated successfully! Card saved to database.</span>
              </div>
            )}

            {/* SECTION 1: IDENTITY & PROFILE PHOTO */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <User className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">01 — Identity & Profile Photo</span>
              </div>

              <div className="p-3 bg-white border border-slate-300 rounded-sm space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-full border-2 border-slate-300 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {photoUrl ? (
                      <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono font-bold text-xl text-slate-800">
                        {name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(true)}
                        className="px-3.5 py-1.5 bg-ink text-paper hover:bg-ink-light rounded-sm text-[11px] font-bold transition-colors flex items-center space-x-1.5 shadow-2xs font-mono"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent" />
                        <span>Choose Anime / Gaming Avatar (56 Options)</span>
                      </button>

                      <label className="px-3.5 py-1.5 bg-[#FAF9F6] border border-slate-300 hover:border-slate-500 rounded-sm text-[11px] font-bold text-slate-800 transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs font-mono">
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Upload Custom</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1.5 text-[10px] text-rose-600 hover:underline flex items-center space-x-1 font-mono"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono">Pick a stylized anime, gaming, supercar, bike, or robot avatar</span>
                  </div>
                </div>

                {/* Quick Avatar Presets Strip */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                      Featured Cyber / Anime Avatars:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(true)}
                      className="text-[10px] text-accent font-bold hover:underline font-mono"
                    >
                      View All 56 →
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    {AVATAR_LIBRARY.slice(0, 10).map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setPhotoUrl(av.url)}
                        title={av.label}
                        className={`w-9 h-9 rounded-full border overflow-hidden shrink-0 transition-transform hover:scale-110 ${
                          photoUrl === av.url ? 'border-accent ring-2 ring-accent shadow-sm' : 'border-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <AvatarPickerModal
                isOpen={showAvatarPicker}
                currentAvatarUrl={photoUrl}
                onSelectAvatar={(url) => setPhotoUrl(url)}
                onClose={() => setShowAvatarPicker(false)}
              />

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Full Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isLead}
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-accent disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Registered Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isLead}
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC BACKGROUND */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <GraduationCap className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">02 — Academic Background</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold block uppercase">College / Institution:</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="E.g., Kalpataru Institute of Technology, Tiptur"
                  className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* SECTION 3: PROFESSIONAL & INTERNSHIP */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <Briefcase className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">03 — Professional & Internship</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Organization:</label>
                  <input
                    type="text"
                    value={internship}
                    onChange={(e) => setInternship(e.target.value)}
                    placeholder="E.g., Algorithms365"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Position / Role:</label>
                  <input
                    type="text"
                    value={internshipRole}
                    onChange={(e) => setInternshipRole(e.target.value)}
                    placeholder="E.g., SDE Intern"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: CARD IDENTITY & CLASS */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <Sparkles className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">04 — Card Identity & Class</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Character Title Badge:</label>
                  <input
                    type="text"
                    value={identityTitle}
                    onChange={(e) => setIdentityTitle(e.target.value)}
                    placeholder="E.g., THE CAPTAIN, THE BUILDER..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Character Class Label:</label>
                  <input
                    type="text"
                    value={characterClass}
                    onChange={(e) => setCharacterClass(e.target.value)}
                    placeholder="E.g., LEADERSHIP / ARCHITECT"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 uppercase focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {IDENTITY_TITLES.map((item) => (
                  <button
                    type="button"
                    key={item.title}
                    onClick={() => {
                      setIdentityTitle(item.title);
                      setCharacterClass(item.class);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-xs border font-mono transition-colors ${
                      identityTitle === item.title
                        ? 'bg-accent text-paper border-accent font-bold'
                        : 'bg-white text-slate-700 hover:text-slate-900 border-slate-300'
                    }`}
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block uppercase">Symbol Crest:</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="E.g., K, A, C, P, R"
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-center text-slate-900 uppercase focus:outline-none focus:border-accent"
                  />
                </div>

                {isLead && (
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block uppercase">Team Role:</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'LEAD' | 'MEMBER')}
                      className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-accent"
                    >
                      <option value="LEAD">Team Lead / Captain</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: ENGINEERING DOSSIER BIO */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <Code className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">05 — Engineering Summary Bio</span>
              </div>

              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief engineering summary..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-sm font-sans text-xs text-slate-900 focus:outline-none focus:border-accent"
              />
            </div>

            {/* SECTION 6: SOCIAL PROFILES */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-300 pb-1.5 text-accent font-bold">
                <Linkedin className="w-4 h-4" />
                <span className="uppercase text-[11px] tracking-wider">06 — Professional Social Profiles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold flex items-center space-x-1 uppercase mb-1">
                    <Linkedin className="w-3 h-3 text-[#0077B5]" />
                    <span>LinkedIn Profile URL:</span>
                  </label>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="e.g. linkedin.com/in/username or www.linkedin.com/..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold flex items-center space-x-1 uppercase mb-1">
                    <Github className="w-3 h-3 text-slate-900" />
                    <span>GitHub Profile URL:</span>
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="e.g. github.com/username or https://github.com/..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-sm text-xs font-mono text-slate-900 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-300 bg-[#F5F4EF] flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="px-4 py-2 bg-white border border-slate-300 hover:border-slate-500 rounded-sm text-xs font-mono font-medium text-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="crew-edit-modal-form"
            className="px-5 py-2 bg-accent text-paper hover:bg-accent/90 font-mono text-xs font-bold rounded-sm transition-all shadow-xs flex items-center space-x-1.5 uppercase"
          >
            <Check className="w-4 h-4" />
            <span>SAVE DIGITAL CARD</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/60 p-4">
          <div className="bg-[#FAF9F6] border border-slate-300 max-w-sm w-full p-5 rounded-sm shadow-2xl space-y-4 font-mono text-xs text-slate-900">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm text-slate-900">Unsaved Changes</h3>
            </div>
            <p className="text-slate-700 font-sans text-xs">
              You have unsaved changes to {member.name}'s digital card profile. Are you sure you want to discard them?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3.5 py-1.5 bg-accent text-paper font-bold rounded-sm"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-rose-500 text-rose-600 rounded-sm font-bold"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
