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
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  Code2,
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
        setError('Please enter your team name (e.g. Phoenix, Code Titans).');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setError(null);
    setLoading(true);
    setStatusMessage(isRegister ? 'Creating Account...' : 'Signing in...');

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
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* Header bar */}
      <header className="w-full border-b border-line bg-paper/60 backdrop-blur-md z-10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-ink block leading-none">
              EngineerSpace
            </span>
            <span className="text-[10px] font-mono text-muted tracking-wider uppercase">
              Engineering Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface border border-line text-[11px] font-mono text-muted">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: 2-Column Split on Large Screens */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* Left Hero / Brand Column (Hidden on mobile or stacked) */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-soft border border-primary/20 text-xs font-mono text-primary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production Platform for Engineering Teams</span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
                Where Interns Ship <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-accent">
                  Production Code.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-lg leading-relaxed">
                Streamline daily standups, team task boards, technical homework, and AI-driven interview readiness in one unified engineering environment.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-lg bg-surface border border-line flex items-start space-x-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-md bg-primary-soft text-primary mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-ink">Daily Standups & Audio</h2>
                  <p className="text-[11px] text-muted">Async text & audio check-ins with automated lead briefs.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-surface border border-line flex items-start space-x-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-md bg-accent-subtle text-accent mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-ink">Kanban Sprint Board</h2>
                  <p className="text-[11px] text-muted">Real-time task tracking with sprint velocity metrics.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-surface border border-line flex items-start space-x-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-md bg-primary-soft text-primary mt-0.5">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-ink">AI Interview Lab</h2>
                  <p className="text-[11px] text-muted">Real-time technical mock interviews with instant AI feedback.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-surface border border-line flex items-start space-x-3 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-md bg-accent-subtle text-accent mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-ink">Team Isolation & Auth</h2>
                  <p className="text-[11px] text-muted">Secure role-based controls for Leads and Members.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[450px] bg-surface/90 backdrop-blur-xl border border-line-dark p-6 sm:p-8 rounded-xl shadow-modal relative">
              
              {/* Card Header & Toggle */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">
                      ES
                    </div>
                    <span className="text-xs font-mono text-muted uppercase tracking-wider">
                      {isRegister ? 'Workspace Creation' : 'Secure Authorization'}
                    </span>
                  </div>
                </div>

                <div className="flex rounded-lg bg-paper-dark p-1 border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      !isRegister
                        ? 'bg-primary text-paper font-semibold shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      isRegister
                        ? 'bg-primary text-paper font-semibold shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Register Team
                  </button>
                </div>

                <div>
                  <h2 className="font-display text-lg font-bold text-ink tracking-tight">
                    {isRegister ? 'Register Team & Lead Account' : 'Sign in to Workspace'}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {isRegister
                      ? 'Create a team workspace and provision your Team Lead credentials.'
                      : 'Access your team dashboard, daily standups, and tasks.'}
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-4 p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-lg animate-fade-in flex items-start space-x-2">
                  <span className="font-mono font-bold mt-0.5">!</span>
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1">
                        Full Name (Team Lead) <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-muted absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          disabled={loading}
                          value={name}
                          onFocus={api.warmup}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Mercer"
                          className="w-full pl-9 pr-3 py-2 bg-paper-dark border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-sans outline-none transition-all text-ink disabled:opacity-60 placeholder:text-muted/60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink-secondary mb-1">
                        Team Name <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-muted absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          disabled={loading}
                          value={teamName}
                          onFocus={api.warmup}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Phoenix, Code Titans"
                          className="w-full pl-9 pr-3 py-2 bg-paper-dark border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-sans outline-none transition-all text-ink disabled:opacity-60 placeholder:text-muted/60"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Email Address <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onFocus={api.warmup}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="engineer@team.com"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full pl-9 pr-3 py-2 bg-paper-dark border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-mono outline-none transition-all text-ink disabled:opacity-60 placeholder:text-muted/60"
                      autoFocus={!isRegister}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-secondary mb-1">
                    Password <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={loading}
                      value={password}
                      onFocus={api.warmup}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegister ? 'Min 6 characters' : 'Enter your password'}
                      className="w-full pl-9 pr-9 py-2 bg-paper-dark border border-line focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-mono outline-none transition-all text-ink disabled:opacity-60 placeholder:text-muted/60"
                    />
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted hover:text-ink p-0.5 disabled:opacity-50 transition-colors"
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
                    className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-paper text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 font-sans cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-paper" />
                        <span>{statusMessage || (isRegister ? 'Creating Account...' : 'Signing in...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{isRegister ? 'Create Team & Launch Workspace' : 'Sign In to Workspace'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Secure guarantee badge */}
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between text-[11px] text-muted">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>256-bit Encrypted Token Auth</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isRegister ? 'Already registered?' : 'Need a team?'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-line bg-paper/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2 z-10">
        <span className="text-ink font-medium tracking-tight">
          EngineerSpace · Designed & Developed by Mohammed Arshad
        </span>
        <span className="text-[10px] text-muted">
          v2.4.0 · Production Engineering Platform
        </span>
      </footer>
    </div>
  );
};

