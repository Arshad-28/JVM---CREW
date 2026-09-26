import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OrganizationIdentityPageProps {
  onReturnToWorkspace: () => void;
}

export const OrganizationIdentityPage: React.FC<OrganizationIdentityPageProps> = ({
  onReturnToWorkspace,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Staggered reveal animation sequence
  useEffect(() => {
    if (prefersReducedMotion) {
      setStep(10);
      return;
    }

    const t1 = setTimeout(() => setStep(1), 50);   // Header / ESC
    const t2 = setTimeout(() => setStep(2), 120);  // Logo
    const t3 = setTimeout(() => setStep(3), 190);  // Divider
    const t4 = setTimeout(() => setStep(4), 260);  // Team Badge
    const t5 = setTimeout(() => setStep(5), 330);  // Team Name
    const t6 = setTimeout(() => setStep(6), 400);  // Org Subtitle
    const t7 = setTimeout(() => setStep(7), 470);  // Description
    const t8 = setTimeout(() => setStep(8), 540);  // Photo / Background
    const t9 = setTimeout(() => setStep(9), 610);  // CTA Button

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      clearTimeout(t8);
      clearTimeout(t9);
    };
  }, [prefersReducedMotion]);

  // Global ESC key listener to navigate directly to workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onReturnToWorkspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturnToWorkspace]);

  // Derive dynamic team information strictly from authenticated user state
  const rawTeamName = user?.teamName || user?.team?.name || '';
  const displayTeam = rawTeamName.trim() || 'ENGINEERING TEAM';
  const displayInitial = displayTeam.charAt(0).toUpperCase();

  // Determine if legitimate team photograph is available for this team
  const isJvmCrewTeam = /jvm\s*crew/i.test(displayTeam);
  const teamPhotoUrl = isJvmCrewTeam ? '/brand/jvmcrew-group.jpg' : null;

  if (!user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-4 font-sans text-center">
        <div className="max-w-md p-6 bg-paper border border-line rounded-lg shadow-sm space-y-4">
          <AlertCircle className="w-8 h-8 text-attention mx-auto" />
          <h2 className="text-sm font-bold text-ink">Authentication Required</h2>
          <p className="text-xs text-muted font-mono">
            Please log in to access your organization workspace.
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, '', '/');
              window.location.reload();
            }}
            className="px-4 py-2 bg-ink text-paper rounded-sm font-mono text-xs font-semibold hover:bg-ink-light transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      
      {/* 1. SUBTLE BACKGROUND IMAGE / GEOMETRIC PATTERN */}
      {teamPhotoUrl ? (
        <div
          className={`absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 w-[94vw] max-w-[1300px] h-[50vh] max-h-[500px] min-h-[260px] pointer-events-none z-0 transition-all duration-700 ease-out select-none flex items-end justify-center ${
            step >= 8 ? 'opacity-[0.18] sm:opacity-[0.22] translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[1.015]'
          }`}
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 18%, rgba(0,0,0,0.85) 45%, black 75%, transparent 100%), radial-gradient(ellipse 90% 85% at 50% 65%, black 50%, transparent 95%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 18%, rgba(0,0,0,0.85) 45%, black 75%, transparent 100%), radial-gradient(ellipse 90% 85% at 50% 65%, black 50%, transparent 95%)',
          }}
          aria-hidden="true"
        >
          <img
            src={teamPhotoUrl}
            alt=""
            className="w-full h-full object-cover object-center saturate-[0.85] contrast-[1.02] brightness-[0.98]"
            loading="eager"
          />
        </div>
      ) : (
        <div
          className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-700 ${
            step >= 8 ? 'opacity-40' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(11, 78, 162, 0.05) 0%, transparent 70%), linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 32px 32px, 32px 32px',
          }}
          aria-hidden="true"
        />
      )}

      {/* 2. TOP NAVIGATION HEADER */}
      <header
        className={`relative z-20 px-4 sm:px-10 md:px-16 pt-5 sm:pt-7 flex items-center justify-between transition-all duration-400 ease-out ${
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {/* Left: Organization Status Pill */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#0B4EA2] inline-block animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
            ORGANIZATION IDENTITY
          </span>
        </div>

        {/* Right: Minimal Exit Control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={onReturnToWorkspace}
          className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/20 active:scale-95"
          title="Return to workspace (Esc)"
          aria-label="Return to Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0B4EA2] group-hover:-translate-x-0.5 transition-transform duration-150" />
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 group-hover:text-slate-900">
            WORKSPACE
          </span>
          <span className="font-mono text-[9px] font-bold text-slate-400 group-hover:text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-xs border border-slate-200/60">
            ESC
          </span>
        </button>
      </header>

      {/* 3. CENTER IDENTITY HERO */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 text-center pt-4 sm:pt-8 pb-8 max-w-4xl mx-auto w-full">
        
        {/* Official Algorithms365 Logo */}
        <div
          className={`transition-all duration-500 ease-out ${
            step >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-98'
          }`}
        >
          <div className="w-[180px] sm:w-[250px] md:w-[290px] mx-auto filter drop-shadow-2xs">
            {!logoError ? (
              <img
                src="/brand/algorithms365-official-logo.png"
                onError={() => setLogoError(true)}
                alt="Algorithms365"
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
            ) : (
              <div className="font-display font-black text-xl sm:text-2xl text-[#0B4EA2] tracking-wider uppercase">
                ALGORITHMS365
              </div>
            )}
          </div>
        </div>

        {/* Subtle Hairline Divider */}
        <div
          className={`w-[140px] sm:w-[200px] my-4 sm:my-5 transition-all duration-400 ease-out ${
            step >= 3 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        >
          <div className="h-px bg-slate-200/80 w-full" />
        </div>

        {/* Team Identity Area */}
        <div className="flex flex-col items-center w-full">
          
          {/* Active Engineering Unit Badge */}
          <div
            className={`transition-all duration-400 ease-out ${
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="inline-flex items-center space-x-2 px-3 sm:px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-2xs">
              <span className="w-4 h-4 rounded-xs bg-[#0B4EA2] text-white flex items-center justify-center text-[10px] font-black">
                {displayInitial}
              </span>
              <span>ACTIVE ENGINEERING UNIT</span>
            </div>
          </div>

          {/* Dynamic Team Name Heading */}
          <div
            className={`mt-3 sm:mt-4 max-w-full transition-all duration-500 ease-out ${
              step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 tracking-tight uppercase leading-none break-words px-2">
              {displayTeam}
            </h1>
          </div>

          {/* Subtitle: BY ALGORITHMS365 */}
          <div
            className={`mt-2.5 sm:mt-3 transition-all duration-400 ease-out ${
              step >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#0B4EA2] uppercase">
              BY ALGORITHMS365
            </p>
          </div>

          {/* Description */}
          <div
            className={`mt-3.5 sm:mt-4 transition-all duration-400 ease-out px-2 ${
              step >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
              Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
            </p>
          </div>

          {/* Primary Action Button: Return to Workspace */}
          <div
            className={`mt-6 sm:mt-8 transition-all duration-400 ease-out ${
              step >= 9 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <button
              type="button"
              onClick={onReturnToWorkspace}
              className="inline-flex items-center justify-center space-x-2.5 px-7 sm:px-9 py-2.5 sm:py-3 rounded-full bg-[#0B4EA2] hover:bg-[#083D82] active:scale-95 text-white font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/30 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Return to Workspace</span>
            </button>
          </div>
        </div>
      </main>

      {/* 4. CLEAN BOTTOM SPACING */}
      <footer className="relative z-10 py-3 sm:py-4 text-center font-mono text-[10px] sm:text-[11px] text-slate-400 pointer-events-none">
        <span>Algorithms365 · EngineerSpace Platform</span>
      </footer>
    </div>
  );
};
