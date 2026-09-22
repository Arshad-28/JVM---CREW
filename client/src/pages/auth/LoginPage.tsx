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
  Shield,
  Activity,
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
        setError('Please enter your team name.');
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
    <div className="min-h-screen bg-paper flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent-subtle selection:text-accent relative overflow-hidden">
      {/* ========================================================================= */}
      {/* DYNAMIC ANIMATED BACKGROUND ORBS & GRID                                   */}
      {/* ========================================================================= */}
      
      {/* Floating Gradient Orb 1 (Top Left Emerald) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />

      {/* Floating Gradient Orb 2 (Bottom Right Warm Ochre) */}
      <div className="absolute -bottom-20 -right-20 w-[420px] h-[420px] bg-accent/8 rounded-full blur-3xl pointer-events-none animate-float-reverse" />

      {/* Pulsing Ambient Core (Center Top) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

      {/* Dynamic Animated Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.045] pointer-events-none animate-drift-grid"
        style={{
          backgroundImage: `
            linear-gradient(to right, #17201C 1px, transparent 1px),
            linear-gradient(to bottom, #17201C 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Radial fade mask for grid edges */}
      <div className="absolute inset-0 bg-radial from-transparent via-paper/40 to-paper pointer-events-none" />

      {/* Floating Subtle Geometric Badges */}
      <div className="hidden md:flex absolute top-28 left-[12%] items-center gap-2 px-3 py-1.5 rounded-full bg-paper/80 border border-line/60 shadow-2xs backdrop-blur-xs font-mono text-[10px] text-muted animate-float-slow pointer-events-none">
        <Activity className="w-3 h-3 text-primary animate-pulse" />
        <span>Live PostgreSQL Telemetry</span>
      </div>

      <div className="hidden md:flex absolute bottom-28 right-[12%] items-center gap-2 px-3 py-1.5 rounded-full bg-paper/80 border border-line/60 shadow-2xs backdrop-blur-xs font-mono text-[10px] text-muted animate-float-reverse pointer-events-none">
        <Shield className="w-3 h-3 text-accent" />
        <span>Role-Based Team Isolation</span>
      </div>

      {/* ========================================================================= */}
      {/* TOP MINIMAL BAR                                                           */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center rounded-sm shadow-2xs transition-transform hover:scale-105">
            <Terminal className="w-4 h-4 text-paper" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-ink">
            EngineerSpace
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Workspace Online</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CENTERED MODERN CARD                                                      */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[440px] my-auto py-6 animate-fade-in">
        <div className="bg-paper border border-line p-6 sm:p-10 rounded-sm shadow-card hover:shadow-card-hover transition-all duration-300 space-y-6 relative overflow-hidden">
          {/* Subtle Top Border Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

          {/* Card Brand & Heading */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-ink text-paper mx-auto flex items-center justify-center rounded-sm shadow-sm transition-transform duration-200 hover:scale-110 group cursor-default">
              <Terminal className="w-6 h-6 text-paper group-hover:text-emerald-300 transition-colors" />
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight">
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
            <div className="p-3 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-sm animate-fade-in flex items-center space-x-2">
              <span className="font-mono text-xs font-bold shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    Full Name (Team Lead) *
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
                      placeholder="e.g. Rahul Kumar"
                      className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs font-sans outline-none transition-colors text-ink disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    Team Name *
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
                      placeholder="e.g. STACK, PHOENIX, NOVA"
                      className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs font-sans outline-none transition-colors text-ink disabled:opacity-60"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-muted mt-1">
                    Your team identity will be <span className="font-bold text-ink">{teamName.trim() || '[Team Name]'}</span>
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                {isRegister ? 'Email / Gmail *' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onMouseEnter={api.warmup}
                  onFocus={api.warmup}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                  autoFocus={!isRegister}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink">
                  Password *
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onMouseEnter={api.warmup}
                  onFocus={api.warmup}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create secure password (min 6 chars)' : 'Enter your password'}
                  className="w-full pl-9 pr-9 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-ink p-0.5 disabled:opacity-50 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={api.warmup}
                className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light active:scale-[0.99] text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm hover-lift disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>{statusMessage || (isRegister ? 'Creating Account...' : 'Signing in...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Team & Lead Account' : 'Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-accent group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer toggle */}
          <div className="pt-4 border-t border-line flex items-center justify-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-accent hover:underline font-medium cursor-pointer transition-colors"
            >
              {isRegister ? 'Already registered? Sign in' : 'Register New Team & Lead Account'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl py-3 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2 mt-auto">
        <span className="text-ink font-medium tracking-tight">EngineerSpace · Built by Mohammed Arshad</span>
        <span className="text-[10px] text-muted">Engineering Platform · Secure Authentication</span>
      </div>
    </div>
  );
};
