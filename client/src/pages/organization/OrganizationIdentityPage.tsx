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

  // Detect user preference for reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Handle Opening Lifecycle with Staggered Milestones
  useEffect(() => {
    if (prefersReducedMotion) {
      setStep(10);
      return;
    }

    setStep(0);
    const tHeader = setTimeout(() => setStep(1), 60);
    const tLogo = setTimeout(() => setStep(2), 140);
    const tDivider = setTimeout(() => setStep(3), 220);
    const tBadge = setTimeout(() => setStep(4), 300);
    const tTeam = setTimeout(() => setStep(5), 380);
    const tOrg = setTimeout(() => setStep(6), 460);
    const tDesc = setTimeout(() => setStep(7), 540);
    const tPhoto = setTimeout(() => setStep(8), 620);
    const tBtn = setTimeout(() => setStep(9), 700);

    return () => {
      clearTimeout(tHeader);
      clearTimeout(tLogo);
      clearTimeout(tDivider);
      clearTimeout(tBadge);
      clearTimeout(tTeam);
      clearTimeout(tOrg);
      clearTimeout(tDesc);
      clearTimeout(tPhoto);
      clearTimeout(tBtn);
    };
  }, [prefersReducedMotion]);

  // Handle ESC key to return to workspace
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

  const displayTeam = user?.teamName && user.teamName.trim().length > 0 ? user.teamName.trim() : (user?.team?.name || 'EngineerSpace');
  const displayInitial = displayTeam.charAt(0).toUpperCase();

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
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-paper text-ink select-none overflow-y-auto overflow-x-hidden font-sans opacity-100 transition-opacity duration-250"
      role="region"
      aria-label="Algorithms365 Organization and Team Identity"
    >
      {/* 1. INTEGRATED TEAM PHOTOGRAPH (Subtle, balanced contrast, warm tone integration) */}
      {teamPhotoUrl && (
        <div
          className={`absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 w-[92vw] max-w-[1300px] h-[55vh] max-h-[520px] min-h-[300px] pointer-events-none z-0 transition-all duration-700 ease-out select-none flex items-end justify-center ${
            step >= 8
              ? 'opacity-[0.20] sm:opacity-[0.22] translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-[1.015]'
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
            className="w-full h-full object-cover object-center saturate-[0.88] contrast-[1.02] brightness-[0.98]"
            loading="lazy"
          />
        </div>
      )}

      {/* 2. TOP HEADER */}
      <header
        className={`relative z-20 px-6 sm:px-12 md:px-16 pt-6 sm:pt-8 flex items-center justify-between transition-all duration-400 ease-out ${
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

        {/* Right: Minimal exit control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={onReturnToWorkspace}
          className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/20"
          title="Return to workspace (Esc)"
          aria-label="Back to Workspace"
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

      {/* 3. CENTER IDENTITY CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-8 text-center pt-6 sm:pt-10 md:pt-12 pb-6 max-w-3xl mx-auto w-full">
        {/* Official Algorithms365 Logo */}
        <div
          className={`transition-all duration-500 ease-out ${
            step >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-98'
          }`}
        >
          <div className="w-[200px] sm:w-[260px] md:w-[300px] mx-auto filter drop-shadow-2xs">
            <img
              src="/brand/algorithms365-official-logo.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/brand/algorithms365-transparent.png';
              }}
              alt="Algorithms 365"
              className="w-full h-auto object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Single Subtle Hairline Divider */}
        <div
          className={`w-[180px] sm:w-[220px] my-5 sm:my-6 transition-all duration-400 ease-out ${
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
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-2xs">
              <span className="w-4 h-4 rounded-xs bg-[#0B4EA2] text-white flex items-center justify-center text-[10px] font-black">
                {displayInitial}
              </span>
              <span>ACTIVE ENGINEERING UNIT</span>
            </div>
          </div>

          {/* Team Name Hero */}
          <div
            className={`mt-3 sm:mt-4 transition-all duration-500 ease-out ${
              step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-slate-900 tracking-tight uppercase leading-none">
              {displayTeam}
            </h1>
          </div>

          {/* BY ALGORITHMS365 */}
          <div
            className={`mt-2.5 sm:mt-3 transition-all duration-400 ease-out ${
              step >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="font-mono text-xs sm:text-sm font-bold tracking-widest text-[#0B4EA2] uppercase">
              BY ALGORITHMS365
            </p>
          </div>

          {/* Short Organization Description */}
          <div
            className={`mt-4 sm:mt-5 transition-all duration-400 ease-out ${
              step >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
              Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
            </p>
          </div>

          {/* Primary Action: Return to Workspace */}
          <div
            className={`mt-6 sm:mt-8 transition-all duration-400 ease-out ${
              step >= 9 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`}
          >
            <button
              type="button"
              onClick={onReturnToWorkspace}
              className="inline-flex items-center justify-center space-x-2.5 px-8 py-3 rounded-full bg-[#0B4EA2] hover:bg-[#083D82] active:scale-95 text-white font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/30"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Return to Workspace</span>
            </button>
          </div>
        </div>
      </main>

      {/* Clean Bottom Spacing */}
      <div className="pb-6 sm:pb-8 pointer-events-none" />
    </div>
  );
};
