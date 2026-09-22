import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Activity,
  Layers,
  Sparkles,
  Database,
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
        setError('Please enter your engineering team name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setError(null);
    setLoading(true);
    setStatusMessage(isRegister ? 'Setting up workspace...' : 'Authenticating...');

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
    <div className="min-h-screen bg-[#F5F4EF] flex flex-col lg:flex-row font-sans selection:bg-primary/20 selection:text-primary">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: BRANDING & PRODUCT SHOWCASE (DESKTOP)                        */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] bg-[#0E1A14] text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-[#1B2F25]">
        {/* Subtle Ambient Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
        
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* Top Brand Bar */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white flex items-center justify-center rounded-lg shadow-sm font-display font-bold text-base tracking-wider border border-emerald-400/20">
              ES
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white tracking-tight block">
                EngineerSpace
              </span>
              <span className="text-[11px] text-emerald-400/80 font-medium tracking-wide uppercase block -mt-0.5">
                Enterprise Engineering Workspace
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>v2.4 Enterprise</span>
          </div>
        </div>

        {/* Middle Hero Statement & Feature Showcase */}
        <div className="relative z-10 space-y-8 my-auto py-10">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-900/40 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              High-Velocity Engineering Operations
            </span>
            <h1 className="font-display text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
              Engineering velocity, tracked with factual rigor.
            </h1>
            <p className="text-emerald-100/70 text-sm xl:text-base leading-relaxed">
              A unified management cockpit for daily standups, sprint execution, homework verification, and executive team intelligence reports.
            </p>
          </div>

          {/* 3 Feature Capability Cards */}
          <div className="grid grid-cols-1 gap-3 max-w-xl">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-white">Daily Standup & Leadership Cockpit</h2>
                <p className="text-xs text-emerald-100/60 leading-relaxed">
                  Real-time attendance compliance, blocker resolution, and automated team lead briefs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-white">Team Performance & Intelligence Reports</h2>
                <p className="text-xs text-emerald-100/60 leading-relaxed">
                  Audited delivery reports for mentors and stakeholders derived 100% from PostgreSQL transactions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold text-white">Curriculum, Homework & Interview Lab</h2>
                <p className="text-xs text-emerald-100/60 leading-relaxed">
                  Structured learning pathways, coding challenges, and homework review queues for all cohorts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust & Compliance Bar */}
        <div className="relative z-10 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-emerald-100/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Team Isolation</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>JWT Authenticated</span>
            </span>
          </div>
          <span>PostgreSQL Persistence</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: AUTHENTICATION FORM                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Mobile Top Navbar (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-line/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary text-white flex items-center justify-center rounded-lg shadow-sm font-display font-bold text-sm">
              ES
            </div>
            <div>
              <span className="font-display font-bold text-base text-ink block">
                EngineerSpace
              </span>
              <span className="text-[10px] text-muted block -mt-0.5">
                Enterprise Workspace
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>System Online</span>
          </span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8 sm:py-12 space-y-7 animate-fade-in">
          {/* Card Box */}
          <div className="bg-white border border-line rounded-2xl shadow-card p-6 sm:p-8 space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-center p-1 bg-paper-dark rounded-xl border border-line">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    !isRegister
                      ? 'bg-white text-ink shadow-xs border border-line/60'
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
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isRegister
                      ? 'bg-white text-ink shadow-xs border border-line/60'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Create Workspace
                </button>
              </div>

              <div className="text-center space-y-1.5 pt-1">
                <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
                  {isRegister ? 'Create Engineering Workspace' : 'Welcome back'}
                </h1>
                <p className="text-xs text-muted">
                  {isRegister
                    ? 'Register your team cohort and lead administrator account'
                    : 'Enter your credentials to access your daily engineering portal'}
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl animate-fade-in flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">
                      Team Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Building2 className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={teamName}
                        onFocus={api.warmup}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. JVM CREW, CLOUD TITANS, DEV OPS"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60 placeholder:text-muted/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">
                      Team Lead Full Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        required
                        disabled={loading}
                        value={name}
                        onFocus={api.warmup}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mohammed Arshad"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60 placeholder:text-muted/60"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink">
                  Corporate Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onMouseEnter={api.warmup}
                    onFocus={api.warmup}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-paper-light border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60 placeholder:text-muted/60"
                    autoFocus={!isRegister}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-ink">
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    value={password}
                    onMouseEnter={api.warmup}
                    onFocus={api.warmup}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? 'Minimum 6 characters' : 'Enter your password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-paper-light border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60 placeholder:text-muted/60"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted hover:text-ink p-1 disabled:opacity-50 transition-colors cursor-pointer"
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
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs hover-lift disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{statusMessage || (isRegister ? 'Creating Workspace...' : 'Signing in...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? 'Create Workspace & Account' : 'Sign In to Workspace'}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Trust Footer inside Card */}
            <div className="pt-4 border-t border-line/70 flex items-center justify-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>JWT Secure</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Role Isolation</span>
              </span>
            </div>
          </div>

          {/* Bottom Switcher Note */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs font-medium text-muted hover:text-primary transition-colors underline underline-offset-4 cursor-pointer"
            >
              {isRegister
                ? 'Already have an active account? Sign In'
                : 'Need to register a new engineering cohort? Create Workspace'}
            </button>
          </div>
        </div>

        {/* Right Column Footer */}
        <footer className="w-full pt-4 text-center text-xs text-muted">
          <p>EngineerSpace · Designed & Developed by Mohammed Arshad</p>
        </footer>
      </div>
    </div>
  );
};
