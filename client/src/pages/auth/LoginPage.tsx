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
    <div className="min-h-screen bg-paper flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background Ambient Glow & Subtle Technical Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/6 rounded-full blur-3xl pointer-events-none -mt-32" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-ochre/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#17201C 1px, transparent 1px), linear-gradient(90deg, #17201C 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top minimal bar */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center rounded-lg shadow-2xs border border-ink/20">
            <Terminal className="w-4 h-4 text-paper" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-ink block">
              EngineerSpace
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Workspace Online</span>
          </span>
        </div>
      </div>

      {/* Centered Modern Card */}
      <div className="relative z-10 w-full max-w-[440px] my-auto py-6 animate-fade-in">
        <div className="bg-surface-raised border border-line rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-6 sm:p-9 space-y-6">
          {/* Card Brand & Heading */}
          <div className="text-center space-y-2.5">
            <div className="w-12 h-12 bg-ink text-paper mx-auto flex items-center justify-center rounded-xl shadow-xs transition-transform hover:scale-105 border border-ink/30">
              <Terminal className="w-6 h-6 text-paper" />
            </div>
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
              {isRegister ? 'Register Team & Lead Account' : 'Sign In to Workspace'}
            </h1>
            <p className="text-xs text-muted">
              {isRegister
                ? 'Create a new team and register as Team Lead'
                : 'Enter your credentials to access your workspace'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-danger-soft border border-danger/30 text-danger text-xs rounded-lg animate-fade-in flex items-center space-x-2">
              <span className="font-mono text-xs font-bold shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Full Name (Team Lead) <span className="text-danger">*</span>
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
                      className="w-full pl-10 pr-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-sans outline-none transition-all text-ink min-h-[42px] disabled:opacity-60 placeholder:text-muted/60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Team Name <span className="text-danger">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Users className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={teamName}
                      onFocus={api.warmup}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. JVM CREW, PHOENIX, TITANS"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-sans outline-none transition-all text-ink min-h-[42px] disabled:opacity-60 placeholder:text-muted/60"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-muted">
                    Team identity: <span className="font-bold text-ink">{teamName.trim() || '[Team Name]'}</span>
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                {isRegister ? 'Email / Corporate Email *' : 'Email Address'}
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-sans outline-none transition-all text-ink min-h-[42px] disabled:opacity-60 placeholder:text-muted/60"
                  autoFocus={!isRegister}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">
                Password <span className="text-danger">*</span>
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
                  placeholder={isRegister ? 'Create password (min 6 chars)' : 'Enter your password'}
                  className="w-full pl-10 pr-10 py-2.5 bg-paper border border-line focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-xs font-sans outline-none transition-all text-ink min-h-[42px] disabled:opacity-60 placeholder:text-muted/60"
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
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center space-x-2 shadow-xs hover-lift disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed min-h-[42px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || (isRegister ? 'Creating Account...' : 'Signing in...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Team & Lead Account' : 'Continue to Workspace'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer toggle */}
          <div className="pt-4 border-t border-line/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-primary hover:text-primary-hover hover:underline font-semibold cursor-pointer transition-colors"
            >
              {isRegister ? '← Already registered? Sign in' : 'Register New Team & Lead Account →'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full max-w-5xl py-3 border-t border-line/80 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-2 mt-auto">
        <span className="text-ink font-medium tracking-tight">EngineerSpace · Built by Mohammed Arshad</span>
        <div className="flex items-center space-x-2 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Secure Authentication · PostgreSQL Persistence</span>
        </div>
      </div>
    </div>
  );
};
