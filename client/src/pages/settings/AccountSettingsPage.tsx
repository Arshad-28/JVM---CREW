import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Shield,
  Key,
  Bell,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  CheckSquare,
  UserCircle,
  Mail,
  Save,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { normalizeSocialUrl } from '../../utils/greetingEngine';
import { pushService, PushPermissionStatus } from '../../services/pushNotificationService';
import { NotificationPreferences } from '../../types';
import { PageContainer } from '../../components/common/PageContainer';

interface AccountSettingsPageProps {
  onNavigateTab: (tab: string) => void;
  onOpenLeaveEmail?: () => void;
}

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({
  onNavigateTab,
  onOpenLeaveEmail,
}) => {
  const { user, logout, updateAccount } = useAuth();

  // Account Information Edit State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [college, setCollege] = useState(user?.college || '');
  const [organization, setOrganization] = useState(user?.organization || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl || '');

  const [savingAccount, setSavingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setCollege(user.college || '');
      setOrganization(user.organization || '');
      setBio(user.bio || '');
      setLinkedinUrl(user.linkedinUrl || '');
      setGithubUrl(user.githubUrl || '');
    }
  }, [user]);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification & Web Push Preferences
  const [pushStatus, setPushStatus] = useState<PushPermissionStatus>('DEFAULT');
  const [taskAssigned, setTaskAssigned] = useState(true);
  const [taskReviews, setTaskReviews] = useState(true);
  const [homeworkPublished, setHomeworkPublished] = useState(true);
  const [homeworkReviews, setHomeworkReviews] = useState(true);
  const [standupReminders, setStandupReminders] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    pushService.getStatus().then(setPushStatus);
    api.getNotificationPreferences().then((prefs) => {
      if (prefs) {
        setTaskAssigned(prefs.taskAssigned ?? true);
        setTaskReviews(prefs.taskReviews ?? true);
        setHomeworkPublished(prefs.homeworkPublished ?? true);
        setHomeworkReviews(prefs.homeworkReviews ?? true);
        setStandupReminders(prefs.standupReminders ?? true);
        setTeamUpdates(prefs.teamUpdates ?? true);
      }
    }).catch(() => {});
  }, []);

  const handleTogglePushMaster = async () => {
    setPushLoading(true);
    setPushFeedback(null);
    try {
      if (pushStatus === 'SUBSCRIBED') {
        const res = await pushService.unsubscribeFromPush();
        await api.updateNotificationPreferences({ pushEnabled: false });
        setPushStatus(await pushService.getStatus());
        setPushFeedback(res.message);
      } else {
        const res = await pushService.subscribeToPush();
        if (res.success) {
          await api.updateNotificationPreferences({ pushEnabled: true });
        }
        setPushStatus(await pushService.getStatus());
        setPushFeedback(res.message);
      }
    } catch (err: any) {
      setPushFeedback(err.message || 'Failed to update push subscription');
    } finally {
      setPushLoading(false);
    }
  };

  const handleUpdatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      await api.updateNotificationPreferences({ [key]: value });
    } catch (err) {
      console.error('Failed to update preference:', err);
    }
  };

  if (!user) return null;

  const isLead = user.role === 'LEAD' || user.role === 'ADMIN';
  const crewId = user.serialNumber || 'MEMBER';
  const isAccountDirty =
    name.trim() !== (user.name || '') ||
    email.trim().toLowerCase() !== (user.email || '').toLowerCase() ||
    phoneNumber.trim() !== (user.phoneNumber || '') ||
    college.trim() !== (user.college || '') ||
    organization.trim() !== (user.organization || '') ||
    bio.trim() !== (user.bio || '') ||
    linkedinUrl.trim() !== (user.linkedinUrl || '') ||
    githubUrl.trim() !== (user.githubUrl || '');

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    setAccountSuccess(null);

    if (!name.trim()) {
      setAccountError('Full name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAccountError('Please enter a valid email address.');
      return;
    }

    setSavingAccount(true);
    try {
      await updateAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        college: college.trim() || undefined,
        organization: organization.trim() || undefined,
        bio: bio.trim() || undefined,
        linkedinUrl: normalizeSocialUrl(linkedinUrl) || undefined,
        githubUrl: normalizeSocialUrl(githubUrl) || undefined,
      });
      setAccountSuccess('Account information and social profiles updated in PostgreSQL.');
    } catch (err: any) {
      setAccountError(err.message || 'Unable to update account information. Please try again.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleCancelAccount = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber || '');
    setCollege(user.college || '');
    setOrganization(user.organization || '');
    setBio(user.bio || '');
    setLinkedinUrl(user.linkedinUrl || '');
    setGithubUrl(user.githubUrl || '');
    setAccountError(null);
    setAccountSuccess(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password. Please verify current password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <PageContainer width="narrow" className="space-y-6 sm:space-y-8 animate-fade-in font-sans">
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <button
            onClick={() => onNavigateTab('home')}
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-muted hover:text-ink transition-colors pb-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted group-hover:text-ink transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Workspace</span>
          </button>
          <div className="flex items-center space-x-2.5">
            <h1 className="font-display text-2xl font-black text-ink uppercase tracking-tight">
              Account Settings
            </h1>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs bg-paper-dark border border-line text-ink uppercase">
              {user.role === 'LEAD' ? 'Team Lead' : 'Team Member'}
            </span>
          </div>
          <p className="font-mono text-xs text-muted">
            Manage your personal profile, credentials, security parameters, and notification preferences.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigateTab(isLead ? 'crew' : 'profile')}
            className="px-3 py-1.5 bg-paper border border-line hover:border-ink rounded-sm font-mono text-xs font-semibold text-ink flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <UserCircle className="w-3.5 h-3.5 text-accent" />
            <span>My Profile & Card</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: EDITABLE ACCOUNT INFORMATION */}
      <div className="bg-paper border border-line rounded-sm p-6 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              Account Information
            </h2>
          </div>
          <span className="font-mono text-[10px] text-muted">
            Persisted directly to PostgreSQL
          </span>
        </div>

        {accountSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xs text-xs font-mono flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{accountSuccess}</span>
          </div>
        )}

        {accountError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-800 rounded-xs text-xs font-mono flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{accountError}</span>
          </div>
        )}

        <form onSubmit={handleAccountSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Editable: Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="Enter full name"
                className="w-full px-3 py-2 text-base sm:text-sm bg-paper border border-line focus:border-ink rounded-xs font-medium text-ink outline-none transition-colors"
                required
              />
            </div>

            {/* Editable: Email Address */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="Enter email address"
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
                required
              />
            </div>

            {/* Editable: Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Phone Number</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
              />
            </div>

            {/* Editable: College / University */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>College / University</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="text"
                value={college}
                onChange={(e) => {
                  setCollege(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="Kalpataru Institute of Technology, Tiptur"
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
              />
            </div>

            {/* Editable: LinkedIn Profile URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>LinkedIn Profile URL</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="e.g. linkedin.com/in/username or www.linkedin.com/..."
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
              />
            </div>

            {/* Editable: GitHub Profile URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>GitHub Profile URL</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="e.g. github.com/username or https://github.com/..."
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
              />
            </div>

            {/* Editable: Bio / Engineering Dossier */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-mono text-ink uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Engineering Bio / Summary</span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded-xs font-mono">Editable</span>
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setAccountError(null);
                  setAccountSuccess(null);
                }}
                placeholder="Brief engineering summary or bio..."
                className="w-full px-3 py-2 text-base sm:text-xs font-mono bg-paper border border-line focus:border-ink rounded-xs text-ink outline-none transition-colors"
              />
            </div>

            {/* Read-Only: Crew Serial ID */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Crew Serial ID</span>
                <span className="text-[9px] text-muted bg-paper-dark border border-line px-1 py-0.2 rounded-xs font-mono">Managed by Team Lead</span>
              </label>
              <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs font-mono text-xs text-emerald-800 font-bold select-none">
                {crewId}
              </div>
            </div>

            {/* Read-Only: Role */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted uppercase font-bold tracking-wider flex items-center justify-between">
                <span>System Security Role</span>
                <span className="text-[9px] text-muted bg-paper-dark border border-line px-1 py-0.2 rounded-xs font-mono">Managed by Team Lead</span>
              </label>
              <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs font-mono text-xs text-ink font-semibold select-none flex items-center justify-between">
                <span>{user.position || 'SDE Intern'} · System Role: {user.role}</span>
                <span className="text-[9px] bg-paper border border-line px-1.5 py-0.5 rounded-xs text-muted font-bold">LOCKED</span>
              </div>
            </div>

            {/* Read-Only: Assigned Team / Organization */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-mono text-muted uppercase font-bold tracking-wider flex items-center justify-between">
                <span>Assigned Team / Organization</span>
                <span className="text-[9px] text-muted bg-paper-dark border border-line px-1 py-0.2 rounded-xs font-mono">Managed by Team Lead</span>
              </label>
              <div className="p-2.5 bg-paper-dark/60 border border-line rounded-xs font-semibold text-ink text-sm select-none">
                {user.teamName || user.team?.displayName || user.team?.name || user.organization || 'Assigned Team'}
              </div>
            </div>
          </div>

          {/* Academic & Profile Card Notice */}
          <div className="p-3 bg-paper-dark/50 border border-line rounded-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs">
            <div className="text-muted text-[11px]">
              <span className="font-semibold text-ink">Looking for College, Bio & 3D Collectible Card?</span> Academic information, character archetype, and collectible card presentation are managed in <span className="text-accent font-semibold">My Profile & Card</span>.
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab(isLead ? 'crew' : 'profile')}
              className="inline-flex items-center space-x-1 text-xs text-ink font-bold hover:text-accent shrink-0"
            >
              <span>Edit Profile & Card</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-line">
            <button
              type="button"
              onClick={handleCancelAccount}
              disabled={!isAccountDirty || savingAccount}
              className="px-4 py-2 bg-paper border border-line hover:border-ink rounded-xs font-mono text-xs font-semibold text-muted hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={!isAccountDirty || savingAccount}
              className="px-5 py-2 bg-ink text-paper hover:bg-ink/90 rounded-xs font-mono text-xs font-bold transition-colors shadow-2xs flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5 text-accent" />
              <span>{savingAccount ? 'Saving to Database...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: SECURITY & PASSWORD UPDATE */}
      <div className="bg-paper border border-line rounded-sm p-6 space-y-6 shadow-2xs">
        <div className="flex items-center space-x-2 border-b border-line pb-3">
          <Shield className="w-4 h-4 text-accent" />
          <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
            Security & Authentication
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xs text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-800 rounded-xs text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter existing password"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 text-xs bg-paper border border-line rounded-xs text-ink focus:border-ink outline-none pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-2.5 text-muted hover:text-ink transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submittingPassword}
            className="px-4 py-2 bg-ink text-paper hover:bg-ink/90 rounded-xs font-mono text-xs font-bold transition-colors shadow-2xs flex items-center space-x-2 disabled:opacity-50"
          >
            <Key className="w-3.5 h-3.5 text-accent" />
            <span>{submittingPassword ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* SECTION 3: NOTIFICATIONS & WEB PUSH PREFERENCES */}
      <div className="bg-paper border border-line rounded-sm p-6 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-accent" />
            <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
              Web Push & Notifications
            </h2>
          </div>

          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider border ${
              pushStatus === 'SUBSCRIBED'
                ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30'
                : pushStatus === 'DENIED'
                ? 'bg-rose-500/10 text-rose-800 border-rose-500/30'
                : pushStatus === 'UNSUPPORTED'
                ? 'bg-line text-muted border-line-dark'
                : 'bg-amber-500/10 text-amber-800 border-amber-500/30'
            }`}
          >
            {pushStatus === 'SUBSCRIBED'
              ? 'Active (Subscribed)'
              : pushStatus === 'DENIED'
              ? 'Blocked by Browser'
              : pushStatus === 'UNSUPPORTED'
              ? 'Not Supported'
              : 'Not Enabled'}
          </span>
        </div>

        {/* Master Push Toggle */}
        <div className="p-4 bg-paper-dark/40 border border-line rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-ink flex items-center space-x-1.5">
              <span>Browser Web Push Notifications</span>
            </p>
            <p className="font-mono text-[11px] text-muted mt-0.5">
              Receive instant alerts on your desktop or mobile device even when EngineerSpace is closed.
            </p>
            {pushFeedback && (
              <p className="text-[11px] font-mono text-accent mt-1">
                {pushFeedback}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={pushLoading || pushStatus === 'UNSUPPORTED'}
            onClick={handleTogglePushMaster}
            className={`px-3 py-1.5 rounded-xs font-mono text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              pushStatus === 'SUBSCRIBED'
                ? 'bg-paper text-rose-700 border border-rose-300 hover:bg-rose-50'
                : 'bg-ink text-paper hover:bg-ink-light'
            }`}
          >
            <span>
              {pushLoading
                ? 'Updating...'
                : pushStatus === 'SUBSCRIBED'
                ? 'Disable Push'
                : 'Enable Browser Push'}
            </span>
          </button>
        </div>

        {/* Category Toggles */}
        <div className="space-y-4 pt-1">
          <p className="font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
            Notification Categories
          </p>

          {/* Task Assignments */}
          <div className="flex items-center justify-between py-2 border-b border-line/60">
            <div>
              <p className="text-xs font-semibold text-ink">Task Assignments & Delegations</p>
              <p className="font-mono text-[11px] text-muted">Alerts when new tasks are assigned or reassigned to you</p>
            </div>
            <button
              onClick={() => {
                const next = !taskAssigned;
                setTaskAssigned(next);
                handleUpdatePref('taskAssigned', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                taskAssigned ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  taskAssigned ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Task Reviews & Approvals */}
          <div className="flex items-center justify-between py-2 border-b border-line/60">
            <div>
              <p className="text-xs font-semibold text-ink">Task Reviews & Approvals</p>
              <p className="font-mono text-[11px] text-muted">Notify when tasks are approved or submitted for Lead review</p>
            </div>
            <button
              onClick={() => {
                const next = !taskReviews;
                setTaskReviews(next);
                handleUpdatePref('taskReviews', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                taskReviews ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  taskReviews ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Homework Published */}
          <div className="flex items-center justify-between py-2 border-b border-line/60">
            <div>
              <p className="text-xs font-semibold text-ink">Homework & Assignments Published</p>
              <p className="font-mono text-[11px] text-muted">Notify when new classwork is published or deadlines are updated</p>
            </div>
            <button
              onClick={() => {
                const next = !homeworkPublished;
                setHomeworkPublished(next);
                handleUpdatePref('homeworkPublished', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                homeworkPublished ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  homeworkPublished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Homework Reviews & Solutions */}
          <div className="flex items-center justify-between py-2 border-b border-line/60">
            <div>
              <p className="text-xs font-semibold text-ink">Homework Reviews & Official Solutions</p>
              <p className="font-mono text-[11px] text-muted">Notify when solutions are unlocked or submissions are graded</p>
            </div>
            <button
              onClick={() => {
                const next = !homeworkReviews;
                setHomeworkReviews(next);
                handleUpdatePref('homeworkReviews', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                homeworkReviews ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  homeworkReviews ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Daily Standup Reminders */}
          <div className="flex items-center justify-between py-2 border-b border-line/60">
            <div>
              <p className="text-xs font-semibold text-ink">Daily Standup Reminders</p>
              <p className="font-mono text-[11px] text-muted">Receive reminders for pending daily standup logs</p>
            </div>
            <button
              onClick={() => {
                const next = !standupReminders;
                setStandupReminders(next);
                handleUpdatePref('standupReminders', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                standupReminders ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  standupReminders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Team Activity */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-semibold text-ink">Team Activity & Standup Answers</p>
              <p className="font-mono text-[11px] text-muted">Notify when Lead answers standup questions or team announcements are made</p>
            </div>
            <button
              onClick={() => {
                const next = !teamUpdates;
                setTeamUpdates(next);
                handleUpdatePref('teamUpdates', next);
              }}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                teamUpdates ? 'bg-emerald-700' : 'bg-line-dark'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  teamUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4: QUICK WORKSPACE ACTIONS */}
      <div className="bg-paper border border-line rounded-sm p-6 space-y-4 shadow-2xs">
        <div className="flex items-center space-x-2 border-b border-line pb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-display text-sm font-bold text-ink uppercase tracking-wider">
            Quick Workspace Actions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <button
            onClick={() => onNavigateTab(isLead ? 'crew' : 'profile')}
            className="p-3 border border-line hover:border-ink rounded-xs bg-paper-dark/30 hover:bg-paper-dark transition-colors flex items-center space-x-2 text-ink font-semibold"
          >
            <UserCircle className="w-4 h-4 text-accent" />
            <span>Edit My Profile & Card</span>
          </button>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="p-3 border border-line hover:border-ink rounded-xs bg-paper-dark/30 hover:bg-paper-dark transition-colors flex items-center space-x-2 text-ink font-semibold"
          >
            <CheckSquare className="w-4 h-4 text-accent" />
            <span>My Tasks Board</span>
          </button>

          {onOpenLeaveEmail && (
            <button
              onClick={onOpenLeaveEmail}
              className="p-3 border border-line hover:border-ink rounded-xs bg-paper-dark/30 hover:bg-paper-dark transition-colors flex items-center space-x-2 text-ink font-semibold"
            >
              <Mail className="w-4 h-4 text-accent" />
              <span>Leave Email Generator</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 5: SIGN OUT */}
      <div className="border border-red-500/30 bg-red-500/5 rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <p className="text-xs font-bold text-red-900 uppercase">Session Sign Out</p>
          <p className="text-[11px] text-muted">End your active authenticated workspace session on this device.</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xs transition-colors shadow-2xs flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </PageContainer>
  );
};