import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { cleanTeamDisplayName, getTeamInitial, getUserInitial } from '../../utils/greetingEngine';
import {
  Terminal,
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  Users,
  UserCheck,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
  Mail,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { TeamIdentityReveal } from './TeamIdentityReveal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenStandup?: () => void;
  onOpenLeaveEmail?: () => void;
  standupDoneToday?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  hasLeadBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenStandup,
  onOpenLeaveEmail,
  standupDoneToday = false,
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [fetchedTeamName, setFetchedTeamName] = useState<string>('');
  const [showTeamMenu, setShowTeamMenu] = useState(false);
  const [showTeamReveal, setShowTeamReveal] = useState(false);
  const [revealOrigin, setRevealOrigin] = useState<{ x: number; y: number } | null>(null);

  const handleOpenReveal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowTeamMenu(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setRevealOrigin({
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    });
    setShowTeamReveal(true);
  };

  useEffect(() => {
    if (user && !user.teamName && !user.team?.name) {
      api.getMyTeam().then((t) => {
        if (t?.displayName) {
          setFetchedTeamName(t.displayName);
        }
      }).catch(() => {});
    }
  }, [user]);

  // Listen for external trigger to open mobile drawer (e.g. from bottom nav)
  useEffect(() => {
    const handleOpenDrawer = () => setMobileDrawerOpen(true);
    window.addEventListener('jvm_open_mobile_drawer', handleOpenDrawer);
    return () => window.removeEventListener('jvm_open_mobile_drawer', handleOpenDrawer);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

  if (!user) return null;

  const isLead = user.role === 'LEAD' || user.role === 'ADMIN';

  const navItems: NavItem[] = [
    { id: 'home', label: 'My Day', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'homework', label: 'Homework', icon: Sparkles },
    { id: 'interview-lab', label: 'Interview Lab', icon: GraduationCap },
    { id: 'team', label: 'Team', icon: Users, hasLeadBadge: isLead },
  ];

  const userPhoto = (user as any).photoUrl || (user as any).avatarUrl;

  const handleNavClick = (id: string) => {
    if (id === 'team') {
      if (isLead) {
        setShowTeamMenu((prev) => !prev);
      } else {
        setActiveTab('crew');
        setMobileDrawerOpen(false);
      }
    } else {
      setShowTeamMenu(false);
      setActiveTab(id);
      setMobileDrawerOpen(false);
    }
  };

  const rawTeam = (
    user?.teamName ||
    user?.team?.displayName ||
    user?.team?.name ||
    fetchedTeamName ||
    (user as any)?.organization
  );

  const cleanTeam = cleanTeamDisplayName(rawTeam);
  const cleanTeamName = cleanTeam && cleanTeam.length > 0 ? cleanTeam : (user?.teamName || 'Team');
  const teamInitial = getTeamInitial(cleanTeamName);

  return (
    <>
      <header className="bg-paper border-b border-line sticky top-0 z-40 bg-paper/95 backdrop-blur-md font-sans w-full select-none pt-safe">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* LEFT: HAMBURGER (Mobile) & TEAM LOGO/IDENTITY */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* Mobile Hamburger Toggle (44px min touch target) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 -ml-1.5 flex items-center justify-center text-ink hover:text-accent rounded-sm focus:outline-none transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Team Logo & Brand */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Dynamic Team Initial Square - Click to trigger Team Identity Reveal */}
              <button
                type="button"
                onClick={handleOpenReveal}
                className="w-8 h-8 bg-ink hover:bg-[#0B4EA2] active:scale-95 rounded-sm flex items-center justify-center font-mono font-black text-paper text-xs shadow-xs shrink-0 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/30"
                title="View Organization & Team Identity Reveal"
                aria-label={`View ${cleanTeamName} Organization Identity Reveal`}
              >
                {teamInitial}
              </button>

              <div
                className="flex flex-col min-w-0 cursor-pointer group"
                onClick={() => {
                  setShowTeamMenu(false);
                  setActiveTab('home');
                }}
              >
                <span className="font-display font-black text-xs sm:text-sm tracking-tight text-ink group-hover:text-accent transition-colors uppercase truncate max-w-[140px] sm:max-w-none">
                  {cleanTeamName}
                </span>
                <span className="text-[10px] font-mono text-muted truncate">
                  {user?.position || 'SDE Intern'} · {isLead ? 'Lead' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP CENTER NAVIGATION (Hidden on mobile) */}
          <nav className="hidden md:flex flex-1 items-center justify-center space-x-2 px-4 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isTeam = item.id === 'team';
              const active = isTeam ? (activeTab === 'team' || activeTab === 'crew') : (activeTab === item.id);

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-paper-dark text-ink border-line-dark font-semibold shadow-2xs'
                        : 'text-muted border-transparent hover:text-ink hover:bg-paper-dark/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-accent' : 'text-muted'}`} />
                    <span>{item.label}</span>
                    {item.hasLeadBadge && (
                      <span className="font-mono text-[9px] font-bold bg-[#2D5A43] text-paper px-1.5 py-0.2 rounded-xs ml-1 whitespace-nowrap">
                        Lead
                      </span>
                    )}
                    {isTeam && isLead && (
                      <ChevronDown className="w-3 h-3 text-muted ml-0.5" />
                    )}
                  </button>

                  {/* Team Dropdown for Leads (Desktop) */}
                  {isTeam && isLead && showTeamMenu && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-paper border border-line rounded-sm shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                      <button
                        onClick={() => {
                          setActiveTab('team');
                          setShowTeamMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
                          activeTab === 'team' ? 'bg-paper-dark text-ink font-bold' : 'text-ink hover:bg-paper-dark'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>Team Cockpit</span>
                        <span className="font-mono text-[9px] bg-[#2D5A43] text-paper px-1 rounded-xs ml-auto">Lead</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('crew');
                          setShowTeamMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center space-x-2 transition-colors ${
                          activeTab === 'crew' ? 'bg-paper-dark text-ink font-bold' : 'text-ink hover:bg-paper-dark'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>Meet the Crew</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT SIDE: STANDUP STATUS + PROFILE IDENTITY PILL */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Standup Status Action Button */}
            {onOpenStandup && (
              <button
                onClick={onOpenStandup}
                className={`px-2 sm:px-3 py-1.5 text-xs font-mono font-bold rounded-sm border transition-colors flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap shadow-2xs ${
                  standupDoneToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/20'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-900 hover:bg-amber-500/25'
                }`}
                title={standupDoneToday ? "Today's standup is submitted. Click to view log." : "Today's standup is pending. Click to submit."}
              >
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap uppercase hidden sm:inline">
                  {standupDoneToday ? 'STANDUP DONE ✓' : 'STANDUP PENDING'}
                </span>
                <span className="whitespace-nowrap uppercase sm:hidden text-[10px]">
                  {standupDoneToday ? 'DONE ✓' : 'PENDING'}
                </span>
              </button>
            )}

            {/* User Profile Identity Container */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`group flex items-center space-x-2.5 sm:space-x-3 pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-sm border transition-all duration-150 select-none text-left shadow-2xs min-h-[42px] ${
                  showUserMenu
                    ? 'bg-paper-dark border-ink/40 ring-1 ring-ink/10'
                    : 'bg-paper border-line hover:border-ink/40 hover:bg-paper-dark/60'
                }`}
                title="Account Controls"
                aria-expanded={showUserMenu}
              >
                {/* 1. PROFILE AVATAR (36-40px, perfectly circular, subtle border) */}
                <div className="relative w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full border border-line bg-paper-dark flex items-center justify-center font-mono font-bold text-xs text-ink overflow-hidden shrink-0 shadow-2xs ring-1 ring-black/5">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-xs text-ink">
                      {getUserInitial(user.name)}
                    </span>
                  )}
                </div>

                {/* 2. USER NAME & ROLE BADGE */}
                <div className="flex flex-col min-w-0 justify-center">
                  <span className="font-display font-bold text-xs sm:text-sm text-ink tracking-tight leading-tight truncate max-w-[95px] xs:max-w-[130px] sm:max-w-[160px] md:max-w-[190px]">
                    {user.name}
                  </span>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider ${
                        isLead
                          ? 'bg-accent/15 text-accent border border-accent/30'
                          : 'bg-paper-dark border border-line text-muted'
                      }`}
                    >
                      {isLead ? 'LEAD' : (user.role || 'MEMBER')}
                    </span>
                  </div>
                </div>

                {/* 3. DROPDOWN CHEVRON */}
                <div className="pl-0.5 sm:pl-1 flex items-center justify-center shrink-0">
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted group-hover:text-ink transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Profile Dropdown Menu with Click-Outside Backdrop */}
              {showUserMenu && (
                <>
                  {/* Invisible Backdrop for click-outside dismissal */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-paper border border-line rounded-sm shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                    {/* Account Header with Avatar Snapshot */}
                    <div className="px-3.5 py-2.5 border-b border-line bg-paper-dark/40 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full border border-line overflow-hidden bg-paper-dark shrink-0 flex items-center justify-center shadow-2xs">
                        {userPhoto ? (
                          <img
                            src={userPhoto}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-mono font-bold text-sm text-ink">
                            {getUserInitial(user.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink truncate">{user.name}</p>
                        <p className="font-mono text-[10px] text-muted truncate">{user.email}</p>
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-xs ${
                              isLead
                                ? 'bg-accent/15 text-accent border border-accent/30'
                                : 'bg-paper border border-line text-muted'
                            }`}
                          >
                            {user.position || 'SDE Intern'} · {isLead ? 'LEAD' : (user.role || 'MEMBER')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profile & Navigation Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('crew');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-paper-dark flex items-center space-x-2 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="whitespace-nowrap font-medium">Meet the Crew</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-paper-dark flex items-center space-x-2 transition-colors"
                      >
                        <UserCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="whitespace-nowrap font-medium">My Profile & Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('tasks');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-paper-dark flex items-center space-x-2 transition-colors"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="whitespace-nowrap font-medium">My Tasks</span>
                      </button>

                      {onOpenLeaveEmail && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenLeaveEmail();
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-paper-dark flex items-center space-x-2 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="whitespace-nowrap font-medium">Leave Email Generator</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-paper-dark flex items-center space-x-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="whitespace-nowrap font-medium">Account Settings</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-line pt-1 mt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-attention hover:bg-attention-subtle flex items-center space-x-2 font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-attention shrink-0" />
                        <span className="whitespace-nowrap">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER / SLIDE-IN NAVIGATION MENU */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-paper h-full shadow-2xl border-r border-line flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-line bg-paper-dark/60 flex items-center justify-between pt-safe">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    setMobileDrawerOpen(false);
                    handleOpenReveal(e);
                  }}
                  className="w-7 h-7 bg-ink hover:bg-[#0B4EA2] active:scale-95 text-paper rounded-sm flex items-center justify-center font-mono font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  title="View Organization & Team Identity Reveal"
                >
                  {teamInitial}
                </button>
                <div
                  className="flex flex-col min-w-0 cursor-pointer"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setActiveTab('home');
                  }}
                >
                  <span className="font-display font-bold text-sm text-ink truncate uppercase">
                    {cleanTeamName}
                  </span>
                  <span className="font-mono text-[10px] text-muted truncate">
                    {user.serialNumber || 'MEMBER'} · {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-muted hover:text-ink rounded-sm"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Snapshot */}
            <div className="px-4 py-3 border-b border-line bg-paper-dark/20 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-line bg-paper-dark flex items-center justify-center font-mono font-bold text-sm text-ink overflow-hidden shrink-0 shadow-2xs">
                {userPhoto ? (
                  <img src={userPhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  getUserInitial(user.name)
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-display font-bold text-xs sm:text-sm text-ink truncate">{user.name}</span>
                <span className="font-mono text-[10px] text-muted truncate">{user.email}</span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider ${
                      isLead
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'bg-paper border border-line text-muted'
                    }`}
                  >
                    {isLead ? 'LEAD' : (user.role || 'MEMBER')}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                CORE WORKSPACE
              </div>

              {/* My Day */}
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'home'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-accent' : 'text-muted'}`} />
                <span>My Day</span>
              </button>

              {/* Tasks */}
              <button
                onClick={() => handleNavClick('tasks')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'tasks'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <CheckSquare className={`w-4 h-4 shrink-0 ${activeTab === 'tasks' ? 'text-accent' : 'text-muted'}`} />
                <span>Tasks</span>
              </button>

              {/* Homework */}
              <button
                onClick={() => handleNavClick('homework')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'homework'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'homework' ? 'text-accent' : 'text-muted'}`} />
                <span>Homework</span>
              </button>

              {/* Interview Lab */}
              <button
                onClick={() => handleNavClick('interview-lab')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'interview-lab'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'interview-lab' ? 'text-accent' : 'text-muted'}`} />
                <span>Interview Lab</span>
              </button>

              <div className="pt-3 px-3 py-1 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                TEAM & CREW
              </div>

              {/* Team Cockpit (Lead only) */}
              {isLead && (
                <button
                  onClick={() => {
                    setActiveTab('team');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                    activeTab === 'team'
                      ? 'bg-ink text-paper shadow-2xs'
                      : 'text-ink hover:bg-paper-dark'
                  }`}
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'team' ? 'text-accent' : 'text-muted'}`} />
                  <span>Team Cockpit</span>
                  <span className="font-mono text-[9px] bg-[#2D5A43] text-paper px-1.5 py-0.2 rounded-xs ml-auto">Lead</span>
                </button>
              )}

              {/* Meet the Crew */}
              <button
                onClick={() => {
                  setActiveTab('crew');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'crew'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'crew' ? 'text-accent' : 'text-muted'}`} />
                <span>Meet the Crew</span>
              </button>

              {/* My Profile */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'profile'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <UserCircle className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-accent' : 'text-muted'}`} />
                <span>My Profile</span>
              </button>

              <div className="pt-3 px-3 py-1 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                PREFERENCES & TOOLS
              </div>

              {onOpenLeaveEmail && (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    onOpenLeaveEmail();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs text-ink hover:bg-paper-dark transition-colors min-h-[44px]"
                >
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  <span>Leave Email Generator</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'settings'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper-dark'
                }`}
              >
                <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-accent' : 'text-muted'}`} />
                <span>Account Settings</span>
              </button>
            </div>

            {/* Drawer Footer / Logout */}
            <div className="p-3 border-t border-line bg-paper-dark/30 pb-safe">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs text-attention font-bold bg-attention-subtle hover:bg-attention-subtle/80 rounded-sm transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4 text-attention" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team & Organization Identity Reveal Modal */}
      <TeamIdentityReveal
        isOpen={showTeamReveal}
        teamName={cleanTeamName}
        teamInitial={teamInitial}
        origin={revealOrigin}
        onClose={() => setShowTeamReveal(false)}
      />
    </>
  );
};
