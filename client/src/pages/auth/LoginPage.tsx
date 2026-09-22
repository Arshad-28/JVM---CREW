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
  Cpu,
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
    setStatusMessage(isRegister ? 'Creating Workspace...' : 'Authenticating...');

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
    <div className="min-h-screen bg-[#070D0A] text-white flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. UNIQUE DARK AMBIENT GLOW & CYBER GRID                                 */}
      {/* ========================================================================= */}
      
      {/* Top Luminous Neon Orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Floating Emerald Glow Top-Left */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none animate-float-slow" />

      {/* Floating Cyan/Teal Glow Bottom-Right */}
      <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[110px] pointer-events-none animate-float-reverse" />

      {/* High-Tech Animated Dark Grid */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none animate-drift-grid"
        style={{
          backgroundImage: `
            linear-gradient(to right, #10B981 1px, transparent 1px),
            linear-gradient(to bottom, #10B981 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Radial Dark Vignette Falloff */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#070D0A]/60 to-[#070D0A] pointer-events-none" />

      {/* Floating Interactive Live Tech Chips */}
      <div className="hidden lg:flex absolute top-32 left-[10%] items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1812]/90 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md font-mono text-[10px] text-emerald-300 animate-float-slow pointer-events-none">
        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>PostgreSQL Telemetry · 100% Real-Time</span>
      </div>

      <div className="hidden lg:flex absolute bottom-32 right-[10%] items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1812]/90 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md font-mono text-[10px] text-emerald-300 animate-float-reverse pointer-events-none">
        <Shield className="w-3.5 h-3.5 text-teal-400" />
        <span>Enterprise JWT & Role Isolation</span>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP DARK CYBER HEADER                                                  */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-transform hover:scale-105">
            <Terminal className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-white block">
              EngineerSpace
            </span>
            <span className="text-[10px] font-mono text-emerald-400/70 tracking-wider block -mt-0.5">
              ENTERPRISE PLATFORM
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Workspace Active</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CENTERED DARK GLASSMORPHIC CARD                                        */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[440px] my-auto py-6 animate-fade-in">
        <div className="bg-[#0C1510]/85 border border-emerald-500/25 rounded-2xl p-7 sm:p-10 shadow-[0_0_50px_-10px_rgba(16,185,129,0.18)] backdrop-blur-xl space-y-6 relative overflow-hidden transition-all duration-300 hover:border-emerald-500/40">
          
          {/* Luminous Neon Gradient Top Accent Beam */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10B981]" />

          {/* Card Emblem & Header */}
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-900/80 to-[#07130C] border border-emerald-500/40 text-emerald-300 mx-auto flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform duration-200 hover:scale-110 group cursor-default">
              <Cpu className="w-7 h-7 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              {isRegister ? 'Register Workspace & Lead' : 'Sign In to Workspace'}
            </h1>
            <p className="text-xs text-emerald-100/60 font-sans">
              {isRegister
                ? 'Create your engineering team cohort and lead administrator account'
                : 'Enter your credentials to access your engineering cockpit'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-xl animate-fade-in flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-rose-400 shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-emerald-100/90">
                    Full Name (Team Lead) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-emerald-400/60 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={name}
                      onFocus={api.warmup}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mohammed Arshad"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#121E17] border border-emerald-900/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-white placeholder:text-emerald-100/30 outline-none transition-all min-h-[42px] disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-emerald-100/90">
                    Team Name <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Users className="w-4 h-4 text-emerald-400/60 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={teamName}
                      onFocus={api.warmup}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. JVM CREW, PHOENIX, TITANS"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#121E17] border border-emerald-900/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs text-white placeholder:text-emerald-100/30 outline-none transition-all min-h-[42px] disabled:opacity-60"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-emerald-400/70">
                    Team identity: <span className="font-bold text-white">{teamName.trim() || '[Team Name]'}</span>
                  </p>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-emerald-100/90">
                {isRegister ? 'Email / Corporate Email *' : 'Email Address'}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3.5 pointer-events-none" />
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#121E17] border border-emerald-900/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-mono text-white placeholder:text-emerald-100/30 outline-none transition-all min-h-[42px] disabled:opacity-60"
                  autoFocus={!isRegister}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-emerald-100/90">
                Password <span className="text-emerald-400">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-emerald-400/60 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onMouseEnter={api.warmup}
                  onFocus={api.warmup}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create secure password (min 6 chars)' : '••••••••••••'}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121E17] border border-emerald-900/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs font-mono text-white placeholder:text-emerald-100/30 outline-none transition-all min-h-[42px] disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-emerald-400/60 hover:text-emerald-300 p-1 disabled:opacity-50 transition-colors cursor-pointer"
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
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{statusMessage || (isRegister ? 'Creating Workspace...' : 'Authenticating...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Create Workspace & Account' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer toggle */}
          <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-emerald-400 hover:text-emerald-300 hover:underline font-medium cursor-pointer transition-colors"
            >
              {isRegister ? '← Already have an account? Sign In' : 'Register New Team Workspace →'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DARK FOOTER                                                            */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl py-3 border-t border-emerald-500/15 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/50 gap-2 mt-auto">
        <span className="font-medium text-emerald-200/80 tracking-tight">
          EngineerSpace · Built by Mohammed Arshad
        </span>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400/60">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL Persistence · 256-bit Encrypted</span>
        </div>
      </div>
    </div>
  );
};
