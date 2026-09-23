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
  Video,
  Shield,
  BarChart3,
} from 'lucide-react';
import { TeamIdentityReveal } from './TeamIdentityReveal';
import { NotificationBell } from '../notifications/NotificationBell';

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

  const isLead = Boolean(user.isCurrentLead || user.role === 'LEAD' || user.role === 'ADMIN');

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
      setShowTeamMenu((prev) => !prev);
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
      <header className="bg-paper border-b border-line sticky top-0 z-40 bg-paper/95 backdrop-blur-md font-sans w-full select-none pt-safe transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          
          {/* LEFT: HAMBURGER (Mobile) & BRAND IDENTITY */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            {/* Mobile Hamburger Toggle (44px min touch target) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-10 h-10 -ml-1.5 flex items-center justify-center text-ink hover:text-primary rounded-sm focus-ring transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Team Logo & Brand */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenReveal}
                className="w-8 h-8 bg-primary hover:bg-primary-hover active:scale-95 rounded-sm flex items-center justify-center font-mono font-black text-white text-xs shadow-xs shrink-0 transition-all duration-200 cursor-pointer focus-ring"
                title="View Team Identity"
                aria-label={`View ${cleanTeamName} Team Identity`}
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
                <div className="flex items-center space-x-1.5">
                  <span className="font-display font-black text-xs sm:text-sm tracking-tight text-ink group-hover:text-primary transition-colors uppercase truncate max-w-[130px] sm:max-w-none">
                    {cleanTeamName}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted truncate">
                  {user?.position || 'SDE Intern'} · {isLead ? 'Lead' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP CENTER NAVIGATION */}
          <nav className="hidden md:flex flex-1 items-center justify-center space-x-1.5 px-4 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isTeam = item.id === 'team';
              const active = isTeam
                ? (activeTab === 'team' || activeTab === 'crew' || activeTab === 'meetings' || activeTab === 'reports')
                : (activeTab === item.id);

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
                      active
                        ? 'bg-primary-soft text-primary border-primary/30 font-semibold shadow-xs'
                        : 'text-muted border-transparent hover:text-ink hover:bg-paper-light hover:-translate-y-[1px]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${active ? 'text-primary scale-105' : 'text-muted'}`} />
                    <span>{item.label}</span>
                    {item.hasLeadBadge && (
                      <span className="font-mono text-[9px] font-bold bg-primary text-white px-1.5 py-0.2 rounded-xs ml-1 whitespace-nowrap">
                        Lead
                      </span>
                    )}
                    {isTeam && (
                      <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${active ? 'text-primary rotate-180' : 'text-muted'}`} />
                    )}
                  </button>

                  {/* Team Dropdown */}
                  {isTeam && showTeamMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-[50]"
                        onClick={() => setShowTeamMenu(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 w-60 bg-paper-light/95 backdrop-blur-md border border-line rounded-xl shadow-card-hover py-2 z-[60] animate-scale-in font-sans">
                        {isLead && (
                          <button
                            onClick={() => {
                              setActiveTab('team');
                              setShowTeamMenu(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg mx-auto flex items-center space-x-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                              activeTab === 'team' ? 'bg-primary-soft text-primary font-bold' : 'text-ink hover:bg-paper'
                            }`}
                          >
                            <Users className="w-4 h-4 text-primary shrink-0" />
                            <span>Team Cockpit</span>
                            <span className="font-mono text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-md ml-auto">Lead</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveTab('crew');
                            setShowTeamMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg flex items-center space-x-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                            activeTab === 'crew' ? 'bg-primary-soft text-primary font-bold' : 'text-ink hover:bg-paper'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 text-primary shrink-0" />
                          <span>Meet the Crew</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('meetings');
                            setShowTeamMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg flex items-center space-x-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                            activeTab === 'meetings' ? 'bg-primary-soft text-primary font-bold' : 'text-ink hover:bg-paper'
                          }`}
                        >
                          <Video className="w-4 h-4 text-primary shrink-0" />
                          <span>Team Meetings</span>
                          <span className="font-mono text-[9px] text-primary font-bold ml-auto">Sync</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab('reports');
                            setShowTeamMenu(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg flex items-center space-x-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                            activeTab === 'reports' ? 'bg-primary-soft text-primary font-bold' : 'text-ink hover:bg-paper'
                          }`}
                        >
                          <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                          <span>Performance Reports</span>
                          <span className="font-mono text-[9px] bg-primary-soft text-primary border border-primary/20 px-1.5 py-0.5 rounded-md ml-auto font-semibold">Intelligence</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </nav>

          {/* RIGHT SIDE: STANDUP STATUS + NOTIFICATIONS + PROFILE */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Standup Status Button */}
            {onOpenStandup && (
              <button
                onClick={onOpenStandup}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all duration-200 flex items-center space-x-1.5 whitespace-nowrap shadow-2xs cursor-pointer active:scale-95 hover:-translate-y-[1px] ${
                  standupDoneToday
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 hover:bg-emerald-500/20 hover:shadow-xs'
                    : 'bg-attention-subtle border-attention/30 text-attention hover:bg-attention/15 hover:shadow-xs'
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

            {/* Notification Bell */}
            <NotificationBell onNavigate={(tab) => { setActiveTab(tab); setMobileDrawerOpen(false); }} />

            {/* Profile Menu Trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`group flex items-center space-x-2 pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-lg border transition-all duration-200 select-none text-left shadow-2xs min-h-[38px] cursor-pointer active:scale-95 hover:-translate-y-[1px] ${
                  showUserMenu
                    ? 'bg-paper-light border-primary/40 ring-2 ring-primary/15'
                    : 'bg-paper-light border-line hover:border-line-dark hover:shadow-xs'
                }`}
                title="Account Controls"
                aria-expanded={showUserMenu}
              >
                {/* Profile Avatar */}
                <div className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-line bg-paper-dark flex items-center justify-center font-mono font-bold text-xs text-ink overflow-hidden shrink-0 shadow-2xs">
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

                {/* User Name & Role */}
                <div className="hidden sm:flex flex-col min-w-0 justify-center">
                  <span className="font-display font-bold text-xs sm:text-sm text-ink tracking-tight leading-tight truncate max-w-[130px] md:max-w-[160px]">
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

                {/* Dropdown Chevron */}
                <div className="pl-0.5 flex items-center justify-center shrink-0">
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted group-hover:text-ink transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[50]"
                    onClick={() => setShowUserMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-paper-light border border-line rounded-md shadow-md py-2 z-[60] animate-scale-in font-sans">
                    <div className="px-4 py-3 border-b border-line bg-paper/60 flex items-center space-x-3">
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

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                      >
                        <UserCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-medium">My Profile & Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('meetings');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-medium">Team Meetings</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('crew');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-medium">Meet the Crew</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('reports');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span className="font-medium">Performance Reports</span>
                      </button>

                      {onOpenLeaveEmail && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenLeaveEmail();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-medium">Leave Email Generator</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-ink hover:bg-paper flex items-center space-x-2.5 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-medium">Account Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-line pt-1 mt-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2.5 text-xs text-attention hover:bg-attention-subtle flex items-center space-x-2.5 font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-attention shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-paper-light h-full shadow-2xl border-r border-line flex flex-col z-10 animate-scale-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-line bg-paper flex items-center justify-between pt-safe">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    setMobileDrawerOpen(false);
                    handleOpenReveal(e);
                  }}
                  className="w-7 h-7 bg-ink text-paper rounded-sm flex items-center justify-center font-mono font-bold text-xs shadow-xs"
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
                className="p-1.5 text-muted hover:text-ink rounded-sm focus-ring"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1.5 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                CORE WORKSPACE
              </div>

              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'home'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'home' ? 'text-primary' : 'text-muted'}`} />
                <span>My Day</span>
              </button>

              <button
                onClick={() => handleNavClick('tasks')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'tasks'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <CheckSquare className={`w-4 h-4 shrink-0 ${activeTab === 'tasks' ? 'text-primary' : 'text-muted'}`} />
                <span>Tasks</span>
              </button>

              <button
                onClick={() => handleNavClick('homework')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'homework'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'homework' ? 'text-primary' : 'text-muted'}`} />
                <span>Homework</span>
              </button>

              <button
                onClick={() => handleNavClick('interview-lab')}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'interview-lab'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <GraduationCap className={`w-4 h-4 shrink-0 ${activeTab === 'interview-lab' ? 'text-primary' : 'text-muted'}`} />
                <span>Interview Lab</span>
              </button>

              <div className="pt-3 px-3 py-1.5 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                TEAM & COMMUNICATION
              </div>

              <button
                onClick={() => {
                  setActiveTab('meetings');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'meetings'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <Video className={`w-4 h-4 shrink-0 ${activeTab === 'meetings' ? 'text-primary' : 'text-muted'}`} />
                <span>Team Meetings</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('crew');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'crew'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'crew' ? 'text-primary' : 'text-muted'}`} />
                <span>Meet the Crew</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('reports');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'reports'
                    ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === 'reports' ? 'text-primary' : 'text-muted'}`} />
                <span>Performance Reports</span>
                <span className="font-mono text-[9px] bg-primary text-white px-1.5 py-0.2 rounded-xs ml-auto">Intelligence</span>
              </button>

              {isLead && (
                <button
                  onClick={() => {
                    setActiveTab('team');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                    activeTab === 'team'
                      ? 'bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs'
                      : 'text-ink hover:bg-paper'
                  }`}
                >
                  <Shield className={`w-4 h-4 shrink-0 ${activeTab === 'team' ? 'text-primary' : 'text-muted'}`} />
                  <span>Team Cockpit</span>
                  <span className="font-mono text-[9px] bg-primary text-white px-1.5 py-0.2 rounded-xs ml-auto">Lead</span>
                </button>
              )}

              <div className="pt-3 px-3 py-1.5 font-mono text-[10px] font-bold text-muted uppercase tracking-wider">
                ACCOUNT & PREFERENCES
              </div>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'profile'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <UserCircle className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-accent' : 'text-muted'}`} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold transition-colors min-h-[44px] ${
                  activeTab === 'settings'
                    ? 'bg-ink text-paper shadow-2xs'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-accent' : 'text-muted'}`} />
                <span>Account Settings</span>
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-line bg-paper pb-safe">
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

      {/* Team Identity Reveal Modal */}
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
