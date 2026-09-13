import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AvatarPickerModal } from './AvatarPickerModal';
import { AVATAR_LIBRARY } from '../../utils/avatarLibrary';

interface EditCrewMemberDrawerProps {
  isOpen: boolean;
  member: CrewMemberProfile | null;
  currentUser: any;
  onClose: () => void;
  onSave: (updated: Partial<CrewMemberProfile>) => void;
}

const IDENTITY_TITLES = [
  'THE CAPTAIN',
  'THE ACE',
  'THE BUILDER',
  'THE STRATEGIST',
  'THE EXPLORER',
  'THE ARCHITECT',
  'THE INNOVATOR',
  'THE EXECUTOR',
  'THE PROBLEM SOLVER',
];

export const EditCrewMemberDrawer: React.FC<EditCrewMemberDrawerProps> = ({
  isOpen,
  member,
  currentUser,
  onClose,
  onSave,
}) => {
  const isLead = currentUser?.role === 'LEAD' || currentUser?.role === 'ADMIN';

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identityTitle, setIdentityTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [college, setCollege] = useState('');
  const [internship, setInternship] = useState('');
  const [internshipRole, setInternshipRole] = useState('');
  const [role, setRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  const [bio, setBio] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Unsaved changes & notification states
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setEmail(member.email || '');
      setIdentityTitle(member.identityTitle || '');
      setSymbol(member.symbol || '');
      setPhotoUrl(member.photoUrl || '');
      setCollege(member.college || '');
      setInternship(member.internship || '');
      setInternshipRole(member.internshipRole || '');
      setRole(member.role || 'MEMBER');
      setBio(member.bio || '');
      setShowUnsavedPrompt(false);
      setSaveSuccessMsg(false);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  const isFormDirty =
    member &&
    (name !== (member.name || '') ||
      email !== (member.email || '') ||
      identityTitle !== (member.identityTitle || '') ||
      symbol !== (member.symbol || '') ||
      photoUrl !== (member.photoUrl || '') ||
      college !== (member.college || '') ||
      internship !== (member.internship || '') ||
      internshipRole !== (member.internshipRole || '') ||
      role !== (member.role || 'MEMBER') ||
      bio !== (member.bio || ''));

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

    onSave({
      name: name.trim() || member.name,
      email: email.trim() || member.email,
      identityTitle: identityTitle.trim() || member.identityTitle,
      symbol: symbol.trim().toUpperCase() || member.symbol,
      photoUrl: photoUrl.trim() || undefined,
      college: college.trim() || undefined,
      internship: internship.trim() || undefined,
      internshipRole: internshipRole.trim() || undefined,
      role: isLead ? role : member.role,
      bio: bio.trim() || undefined,
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={handleCloseAttempt} />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-md bg-paper border-l border-line h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-line bg-paper-dark flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-sm bg-accent text-paper flex items-center justify-center font-bold shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-accent-subtle text-accent border border-accent/30 px-1.5 py-0.2 rounded-xs">
                  {isLead ? 'LEAD MEMBER EDITOR' : 'PERSONAL PROFILE EDITOR'}
                </span>
              </div>
              <h2 className="font-display text-base font-bold text-ink mt-0.5">
                Edit Member Card — {member.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAttempt}
            className="p-1.5 rounded-sm hover:bg-paper text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Form */}
        <form id="crew-edit-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5 font-mono text-xs">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-700 font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>✓ Profile updated successfully!</span>
            </div>
          )}

          {/* SECTION 1: IDENTITY & PHOTO */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-line pb-1.5 text-accent font-bold">
              <User className="w-4 h-4" />
              <span className="uppercase text-[11px]">1. Identity & Profile Photo</span>
            </div>

            {/* Photo Upload & Preview */}
            <div className="p-3 bg-paper-light border border-line rounded-sm space-y-3">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-accent/40 bg-paper flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {photoUrl ? (
                    <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-mono font-bold text-lg text-accent">
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(true)}
                      className="px-3 py-1.5 bg-accent text-white hover:bg-accent/90 rounded-sm text-[11px] font-bold transition-colors flex items-center space-x-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choose Avatar (56 Options)</span>
                    </button>

                    <label className="px-3 py-1.5 bg-paper border border-line hover:border-accent rounded-sm text-[11px] font-bold text-ink transition-colors cursor-pointer flex items-center space-x-1.5">
                      <Upload className="w-3.5 h-3.5 text-accent" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-[10px] text-rose-600 hover:underline flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Preset Thumbnails */}
              <div className="pt-2 border-t border-line/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] font-bold text-muted uppercase">Featured Anime / Cyber Avatars:</span>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(true)}
                    className="text-[9px] text-accent font-bold hover:underline"
                  >
                    View All 56 →
                  </button>
                </div>
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                  {AVATAR_LIBRARY.slice(0, 8).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setPhotoUrl(av.url)}
                      title={av.label}
                      className={`w-8 h-8 rounded-full border overflow-hidden shrink-0 transition-transform hover:scale-110 ${
                        photoUrl === av.url ? 'border-accent ring-1 ring-accent' : 'border-line'
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

            {/* Full Name & Email */}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted font-bold block uppercase">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isLead}
                  className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent disabled:opacity-75"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block uppercase">Registered Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isLead}
                  className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-line pb-1.5 text-accent font-bold">
              <GraduationCap className="w-4 h-4" />
              <span className="uppercase text-[11px]">2. Academic Background</span>
            </div>

            <div>
              <label className="text-[10px] text-muted font-bold block uppercase">College / Institution:</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="E.g., Kalpataru Institute of Technology, Tiptur"
                className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* SECTION 3: PROFESSIONAL */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-line pb-1.5 text-accent font-bold">
              <Briefcase className="w-4 h-4" />
              <span className="uppercase text-[11px]">3. Professional & Internship</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted font-bold block uppercase">Organization:</label>
                <input
                  type="text"
                  value={internship}
                  onChange={(e) => setInternship(e.target.value)}
                  placeholder="E.g., Algorithms365"
                  className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[10px] text-muted font-bold block uppercase">Position / Role:</label>
                <input
                  type="text"
                  value={internshipRole}
                  onChange={(e) => setInternshipRole(e.target.value)}
                  placeholder="E.g., SDE Intern"
                  className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: TEAM IDENTITY & CLASS */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 border-b border-line pb-1.5 text-accent font-bold">
              <Sparkles className="w-4 h-4" />
              <span className="uppercase text-[11px]">4. Team Identity & Card Class</span>
            </div>

            <div>
              <label className="text-[10px] text-muted font-bold block uppercase">Character Title Badge:</label>
              <input
                type="text"
                value={identityTitle}
                onChange={(e) => setIdentityTitle(e.target.value)}
                placeholder="E.g., THE CAPTAIN, THE BUILDER..."
                className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono font-bold text-ink uppercase focus:outline-none focus:border-accent"
              />
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {IDENTITY_TITLES.map((titleSug) => (
                  <button
                    type="button"
                    key={titleSug}
                    onClick={() => setIdentityTitle(titleSug)}
                    className={`text-[9px] px-2 py-0.5 rounded-xs border font-mono transition-colors ${
                      identityTitle === titleSug
                        ? 'bg-accent text-paper border-accent font-bold'
                        : 'bg-paper-dark text-muted hover:text-ink border-line'
                    }`}
                  >
                    {titleSug}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted font-bold block uppercase">Symbol Crest:</label>
                <input
                  type="text"
                  maxLength={2}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="E.g., K, A, C, S, E"
                  className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono font-bold text-center text-ink uppercase focus:outline-none focus:border-accent"
                />
              </div>

              {isLead && (
                <div>
                  <label className="text-[10px] text-muted font-bold block uppercase">Team Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'LEAD' | 'MEMBER')}
                    className="w-full p-2 bg-paper-light border border-line rounded-sm text-xs font-mono font-bold text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="LEAD">Team Lead / Captain</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: ABOUT / BIO */}
          <div className="space-y-2">
            <label className="text-[10px] text-muted font-bold block uppercase">5. Engineering Summary / Bio:</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description..."
              className="w-full p-2.5 bg-paper-light border border-line rounded-sm font-sans text-xs text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-line bg-paper-dark flex items-center justify-between">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="px-3.5 py-1.5 bg-paper border border-line hover:border-ink rounded-sm text-xs font-mono font-medium text-ink transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="crew-edit-form"
            className="px-4 py-1.5 bg-accent text-paper hover:bg-accent/90 rounded-sm font-mono text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/60 p-4">
          <div className="bg-paper border border-line max-w-sm w-full p-5 rounded-sm shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-display font-bold text-sm text-ink">Unsaved Changes</h3>
            </div>
            <p className="text-muted font-sans text-xs">
              You have unsaved changes to {member.name}'s card profile. Are you sure you want to discard them?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-1.5 bg-accent text-paper font-bold rounded-sm"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="px-3 py-1.5 bg-paper border border-line hover:border-rose-500 text-rose-600 rounded-sm font-bold"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
