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
    <div className="min-h-screen bg-paper flex flex-col justify-between font-sans selection:bg-primary-soft selection:text-primary">
      {/* Top Corporate Navbar */}
      <header className="w-full border-b border-line/80 bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary text-white flex items-center justify-center rounded-md shadow-xs font-mono font-bold text-sm tracking-wider">
              ES
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-base tracking-tight text-ink uppercase">
                EngineerSpace
              </span>
              <span className="font-mono text-[10px] text-muted -mt-0.5 tracking-wider uppercase">
                Enterprise Engineering Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-muted">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary font-semibold text-[11px] border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>System Online</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          
          {/* Card Wrapper */}
          <div className="bg-surface-raised border border-line rounded-xl shadow-card p-6 sm:p-8 space-y-6">
            
            {/* Header / Mode Switcher Tabs */}
            <div className="space-y-4">
              <div className="flex items-center justify-center p-1 bg-surface-soft rounded-lg border border-line">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-md transition-all ${
                    !isRegister
                      ? 'bg-surface-raised text-ink shadow-xs border border-line/60'
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
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-md transition-all ${
                    isRegister
                      ? 'bg-surface-raised text-ink shadow-xs border border-line/60'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  New Workspace
                </button>
              </div>

              <div className="text-center space-y-1 pt-1">
                <h1 className="font-display text-xl font-bold text-ink tracking-tight">
                  {isRegister ? 'Create Engineering Workspace' : 'Welcome back'}
                </h1>
                <p className="text-xs text-muted">
                  {isRegister
                    ? 'Register your team identity and lead administrator account'
                    : 'Enter your credentials to access your daily engineering portal'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-md animate-fade-in flex items-start space-x-2">
                <span className="font-mono text-xs font-bold shrink-0 mt-0.5">!</span>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink">
                      Team Name <span className="text-danger">*</span>
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
                        className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-ink">
                      Team Lead Full Name <span className="text-danger">*</span>
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
                        className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md text-xs font-sans text-ink transition-all min-h-[44px] outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink">
                  Corporate Email Address <span className="text-danger">*</span>
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
                    placeholder="engineer@company.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-surface border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md text-xs font-mono text-ink transition-all min-h-[44px] outline-none disabled:opacity-60"
                    autoFocus={!isRegister}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink">
                    Password <span className="text-danger">*</span>
                  </label>
                </div>
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
                    placeholder={isRegister ? 'Minimum 6 characters' : '••••••••••••'}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface border border-line hover:border-primary/40 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-md text-xs font-mono text-ink transition-all min-h-[44px] outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted hover:text-ink p-1 disabled:opacity-50 transition-colors"
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
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-bold rounded-md transition-all flex items-center justify-center space-x-2 shadow-xs hover-lift disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{statusMessage || (isRegister ? 'Creating Workspace...' : 'Signing in...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? 'Create Workspace & Account' : 'Sign In to Workspace'}</span>
                      <ArrowRight className="w-4 h-4 text-primary-soft" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Corporate Security Trust Bar */}
            <div className="pt-4 border-t border-line/80 space-y-2 text-center font-mono text-[11px] text-muted">
              <div className="flex items-center justify-center space-x-4">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>JWT Authenticated</span>
                </span>
                <span>·</span>
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span>Team Isolation</span>
                </span>
              </div>
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
              className="text-xs font-mono text-muted hover:text-primary transition-colors underline underline-offset-4"
            >
              {isRegister
                ? 'Already have an active account? Sign In'
                : 'Need to register a new engineering cohort? Create Workspace'}
            </button>
          </div>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="w-full border-t border-line/80 bg-surface/60 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2">
          <span>EngineerSpace · Designed & Developed by Mohammed Arshad</span>
          <span>PostgreSQL Persistence · Secure Cloud Deployment</span>
        </div>
      </footer>
    </div>
  );
};
