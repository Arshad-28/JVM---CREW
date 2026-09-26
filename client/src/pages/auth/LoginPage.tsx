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
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToReset?: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToReset }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Forgot password specific states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotResetLink, setForgotResetLink] = useState<string | null>(null);
  const [forgotEmailSent, setForgotEmailSent] = useState<boolean>(false);

  useEffect(() => {
    api.warmup();
  }, []);

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (mode === 'register') {
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
    setStatusMessage(mode === 'register' ? 'Creating Account...' : 'Signing in...');

    const handleStatusUpdate = (msg: string) => {
      setStatusMessage(msg);
    };

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (mode === 'register') {
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setError(null);
    setLoading(true);
    setStatusMessage('Processing request...');

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      const res = await api.forgotPassword(cleanEmail);
      setForgotSuccess(res.message || 'If an account exists for this email, a password reset link will be provided.');
      setForgotEmailSent(Boolean(res.emailSent));
      if (res.resetLink) {
        setForgotResetLink(res.resetLink);
      } else {
        setForgotResetLink(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleResetLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    try {
      const url = new URL(link, window.location.origin);
      const token = url.searchParams.get('token');
      if (token && onNavigateToReset) {
        e.preventDefault();
        onNavigateToReset(token);
        return;
      }
    } catch (err) {
      // Fallback to normal navigation
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
              {mode === 'forgot' ? (
                <KeyRound className="w-6 h-6 text-paper" />
              ) : (
                <Terminal className="w-6 h-6 text-paper" />
              )}
            </div>
            <h1 className="font-display text-xl font-bold text-ink tracking-tight">
              {mode === 'register' && 'Register Team & Lead Account'}
              {mode === 'login' && 'Sign In to Workspace'}
              {mode === 'forgot' && 'Forgot Password'}
            </h1>
            <p className="text-xs text-muted">
              {mode === 'register' && 'Create a new team and register as Team Lead'}
              {mode === 'login' && 'Enter your credentials to access your workspace'}
              {mode === 'forgot' && 'Enter your registered email to reset your password'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-sm animate-fade-in flex items-center space-x-2">
              <span className="font-mono text-xs font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === 'forgot' ? (
            <div className="space-y-4">
              {forgotSuccess ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3.5 bg-success-soft border border-success/30 rounded-sm space-y-2">
                    <div className="flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs text-ink font-medium leading-relaxed">
                          {forgotSuccess}
                        </p>
                        {forgotEmailSent && (
                          <p className="text-[11px] text-muted">
                            Please check your inbox (and spam folder) for the password reset link.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dev / Local Fallback Link if SMTP is unconfigured */}
                  {forgotResetLink && (
                    <div className="p-3 bg-surface-soft border border-line rounded-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted uppercase tracking-wider font-semibold">
                          Direct Reset Link
                        </span>
                        <span className="text-[10px] bg-accent-subtle text-accent px-1.5 py-0.5 rounded font-mono">
                          Ready
                        </span>
                      </div>
                      <a
                        href={forgotResetLink}
                        onClick={(e) => handleResetLinkClick(e, forgotResetLink)}
                        className="text-accent hover:underline flex items-center space-x-1.5 font-medium break-all"
                      >
                        <span>Click here to reset your password</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotSuccess(null);
                        setForgotResetLink(null);
                        setForgotEmail('');
                      }}
                      className="w-full py-2 px-3 bg-paper border border-line hover:border-ink text-ink text-xs font-semibold rounded-sm transition-all text-center font-mono"
                    >
                      Send Another Link
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setForgotSuccess(null);
                        setForgotResetLink(null);
                      }}
                      className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 font-mono"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1.5">
                      Registered Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={forgotEmail}
                        onFocus={api.warmup}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (e.target.value.length === 1) api.warmup();
                        }}
                        placeholder="e.g. yourname@gmail.com"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        autoFocus
                        className="w-full pl-9 pr-3 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !forgotEmail.trim()}
                      className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                          <span>Sending Link...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-center text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="text-accent hover:underline font-medium flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* LOGIN / REGISTER FORM */
            <form onSubmit={handleLoginOrRegister} className="space-y-4">
              {mode === 'register' && (
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
                  {mode === 'register' ? 'Email / Gmail *' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    autoComplete={mode === 'register' ? 'email' : 'username'}
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
                    autoFocus={mode === 'login'}
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
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    onFocus={api.warmup}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.length === 1) api.warmup();
                    }}
                    placeholder={mode === 'register' ? 'Create secure password (min 6 chars)' : 'Enter your password'}
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

              {/* Forgot Password link under password input in Login mode */}
              {mode === 'login' && (
                <div className="flex items-center justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setForgotEmail(email); // Pre-fill with entered email if any
                      setForgotSuccess(null);
                      setForgotResetLink(null);
                    }}
                    className="text-xs text-accent hover:underline font-mono transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-60 font-mono cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                      <span>{statusMessage || (mode === 'register' ? 'Creating Account...' : 'Signing in...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Create Team & Lead Account' : 'Continue'}</span>
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

              {/* Footer toggle */}
              <div className="pt-4 border-t border-line flex items-center justify-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'register' ? 'login' : 'register');
                    setError(null);
                  }}
                  className="text-accent hover:underline font-medium"
                >
                  {mode === 'register' ? 'Already registered? Sign in' : 'Register New Team & Lead Account'}
                </button>
              </div>
            </form>
          )}

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
