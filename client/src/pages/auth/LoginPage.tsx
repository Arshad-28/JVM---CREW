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
    <div className="min-h-screen bg-paper flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent-subtle selection:text-accent relative overflow-hidden bg-grid-pattern">
      {/* Top minimal bar */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-ink text-paper flex items-center justify-center rounded-sm">
            <Terminal className="w-4 h-4 text-paper" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-ink">
            EngineerSpace
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">Engineering Team Platform</span>
      </div>

      {/* Centered Modern Card */}
      <div className="w-full max-w-[440px] my-auto animate-fade-in">
        <div className="bg-paper border border-line p-5 sm:p-10 rounded-sm shadow-sm space-y-6">
          {/* Card Brand & Heading */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-ink text-paper mx-auto flex items-center justify-center rounded-sm shadow-sm transition-transform hover:scale-105">
              <Terminal className="w-6 h-6 text-paper" />
            </div>
            <h1 className="font-display text-xl font-bold text-ink tracking-tight">
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
              <span className="font-mono text-xs font-bold">!</span>
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
                      className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-sans outline-none transition-colors text-ink disabled:opacity-60"
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
                      className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-sans outline-none transition-colors text-ink disabled:opacity-60"
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
                  autoComplete={isRegister ? 'email' : 'username'}
                  onFocus={api.warmup}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.length === 1) api.warmup();
                  }}
                  placeholder="name@gmail.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
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
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  onFocus={api.warmup}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value.length === 1) api.warmup();
                  }}
                  placeholder={isRegister ? 'Create secure password (min 6 chars)' : 'Enter your password'}
                  className="w-full pl-9 pr-9 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted hover:text-ink p-0.5 disabled:opacity-50"
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
                className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                    <span>{statusMessage || (isRegister ? 'Creating Account...' : 'Signing in...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Team & Lead Account' : 'Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              {loading && statusMessage && (statusMessage.includes('Waking') || statusMessage.includes('database') || statusMessage.includes('Connecting')) && (
                <p className="text-[11px] font-mono text-muted text-center pt-2 animate-pulse">
                  ⚡ Pre-warming secure cluster... Your session will authenticate automatically.
                </p>
              )}
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
              className="text-accent hover:underline font-medium"
            >
              {isRegister ? 'Already registered? Sign in' : 'Register New Team & Lead Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl py-3 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2 mt-auto">
        <span className="text-ink font-medium tracking-tight">EngineerSpace · Built by Mohammed Arshad</span>
        <span className="text-[10px] text-muted">Engineering Platform · Secure Authentication</span>
      </div>
    </div>
  );
};
