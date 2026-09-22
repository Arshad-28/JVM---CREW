import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Terminal,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Users,
  Loader2,
  Video,
  GraduationCap,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    api.warmup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!teamName.trim()) {
        setError('Please enter your team name (e.g. STACK, PHOENIX, CODE TITANS).');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setError(null);
    setLoading(true);
    setStatusMessage(isRegister ? 'Creating Workspace...' : 'Signing in...');

    const handleStatusUpdate = (msg: string) => {
      setStatusMessage(msg);
    };

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (isRegister) {
        await register(
          {
            name: name.trim(),
            email: cleanEmail,
            password: password.trim(),
            teamName: teamName.trim(),
            role: 'LEAD',
          },
          handleStatusUpdate
        );
      } else {
        await login(cleanEmail, password.trim(), handleStatusUpdate);
      }
      window.dispatchEvent(new CustomEvent('jvm_fresh_login'));
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans selection:bg-primary-soft selection:text-primary relative overflow-hidden">
      {/* Top minimal bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-primary text-white flex items-center justify-center rounded-sm shadow-xs font-mono font-bold text-xs">
            ES
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-sm sm:text-base tracking-tight text-ink uppercase">
              EngineerSpace
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[11px] text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          <span className="hidden sm:inline">Professional Engineering Workspace</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto my-auto py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* LEFT: BRAND STORY & ENGINEERING MOTIF (Desktop) */}
          <div className="lg:col-span-7 space-y-6 hidden lg:block animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-primary-soft border border-primary/20 rounded-xs font-mono text-[11px] text-primary font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Engineered for High-Performance Teams</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-3xl xl:text-4xl font-black text-ink tracking-tight uppercase leading-tight">
                The Purposeful Workspace for Engineering Teams.
              </h1>
              <p className="text-sm text-muted font-normal leading-relaxed max-w-xl">
                A unified operating system for engineering cohorts. Capture daily standups, orchestrate sprint tasks, submit classwork, practice technical interviews, and join live team syncs.
              </p>
            </div>

            {/* Feature Pillars */}
            <div className="grid grid-cols-2 gap-4 pt-2 max-w-lg font-sans">
              <div className="p-4 bg-paper-light border border-line rounded-md space-y-1.5 shadow-2xs hover:-translate-y-[1px] transition-transform">
                <div className="flex items-center space-x-2 text-xs font-bold text-ink">
                  <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Daily Standup & Audio</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Written & voice standups synced with cloud audio storage.
                </p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-md space-y-1.5 shadow-2xs hover:-translate-y-[1px] transition-transform">
                <div className="flex items-center space-x-2 text-xs font-bold text-ink">
                  <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Tasks & Review Queue</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Engineering workflow from assignment to Lead approval.
                </p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-md space-y-1.5 shadow-2xs hover:-translate-y-[1px] transition-transform">
                <div className="flex items-center space-x-2 text-xs font-bold text-ink">
                  <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Interview & Coding Lab</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Interactive practice, AI coaching, and mock technical sessions.
                </p>
              </div>

              <div className="p-4 bg-paper-light border border-line rounded-md space-y-1.5 shadow-2xs hover:-translate-y-[1px] transition-transform">
                <div className="flex items-center space-x-2 text-xs font-bold text-ink">
                  <Video className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Team Meetings & Sync</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  One place for scheduled Meet, Zoom, and Teams calls.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: AUTH CARD */}
          <div className="lg:col-span-5 w-full max-w-[440px] mx-auto animate-fade-in">
            <div className="bg-surface-raised border border-line p-6 sm:p-8 rounded-lg shadow-elevated space-y-6">
              
              {/* Card Header */}
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 bg-primary text-white mx-auto flex items-center justify-center rounded-sm shadow-xs mb-2 font-mono font-bold text-sm">
                  ES
                </div>
                <h2 className="font-display text-xl font-black text-ink tracking-tight uppercase">
                  {isRegister ? "Create Team's Workspace" : 'Sign In to Workspace'}
                </h2>
                <p className="text-xs text-muted font-normal">
                  {isRegister
                    ? 'Register your team identity and lead account'
                    : 'Enter your credentials to access your daily workspace'}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-sm animate-fade-in flex items-start space-x-2">
                  <span className="font-mono text-xs font-bold shrink-0 mt-0.5">!</span>
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="space-y-1.5 font-sans">
                      <label className="block text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                        Team Name <span className="text-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Users className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          required
                          disabled={loading}
                          value={teamName}
                          onFocus={api.warmup}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. STACK, PHOENIX, NOVA"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-line-dark focus-ring rounded-sm text-xs font-sans text-ink transition-colors min-h-[44px] disabled:opacity-60"
                        />
                      </div>
                      <p className="text-[10px] font-mono text-muted">
                        Workspace identity will be <strong className="text-ink font-semibold">{teamName.trim() || '[Team Name]'}</strong>
                      </p>
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <label className="block text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                        Team Lead Full Name <span className="text-danger">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          required
                          disabled={loading}
                          value={name}
                          onFocus={api.warmup}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Kumar"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-line-dark focus-ring rounded-sm text-xs font-sans text-ink transition-colors min-h-[44px] disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5 font-sans">
                  <label className="block text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                    {isRegister ? 'Team Lead Email Address *' : 'Email Address'}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onMouseEnter={api.warmup}
                      onFocus={api.warmup}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@domain.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-line-dark focus-ring rounded-sm text-xs font-mono text-ink transition-colors min-h-[44px] disabled:opacity-60"
                      autoFocus={!isRegister}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 font-sans">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                      Password <span className="text-danger">*</span>
                    </label>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-muted absolute left-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={password}
                      onMouseEnter={api.warmup}
                      onFocus={api.warmup}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegister ? 'Min 6 characters' : 'Enter your password'}
                      className="w-full pl-9 pr-9 py-2.5 bg-paper-light border border-line hover:border-line-dark focus-ring rounded-sm text-xs font-mono text-ink transition-colors min-h-[44px] disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted hover:text-ink p-1 disabled:opacity-50"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={api.warmup}
                    className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover active:translate-y-0 text-white text-xs font-bold rounded-sm transition-all duration-160 flex items-center justify-center space-x-2 shadow-xs hover:-translate-y-[1px] disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>{statusMessage || (isRegister ? 'Creating Workspace...' : 'Signing in...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{isRegister ? 'Create Workspace & Account' : 'Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Toggle Mode Link */}
              <div className="pt-3 border-t border-line text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-primary hover:underline font-semibold transition-colors"
                >
                  {isRegister
                    ? 'Already have a workspace? Sign In'
                    : 'Register New Team & Lead Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-3 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2">
        <span className="text-ink font-medium flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>EngineerSpace · Designed & Developed by Mohammed Arshad</span>
        </span>
        <span className="text-[10px]">Secure JWT Authentication · Team Isolation</span>
      </footer>
    </div>
  );
};
