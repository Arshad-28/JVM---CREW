import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Building2 } from 'lucide-react';
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

    const t1 = setTimeout(() => setStep(1), 40);   // Header / ESC
    const t2 = setTimeout(() => setStep(2), 100);  // Logo
    const t3 = setTimeout(() => setStep(3), 160);  // Divider & Badge
    const t4 = setTimeout(() => setStep(4), 220);  // Team Name & Subtitle
    const t5 = setTimeout(() => setStep(5), 280);  // Description
    const t6 = setTimeout(() => setStep(6), 340);  // Team Image Card
    const t7 = setTimeout(() => setStep(7), 400);  // Return to Workspace Button

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
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
            className="px-4 py-2 bg-ink text-paper rounded-sm font-mono text-xs font-semibold hover:bg-ink-light transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfb] text-slate-900 flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      
      {/* 1. TOP UTILITY HEADER */}
      <header
        className={`relative z-20 px-4 sm:px-8 md:px-12 pt-3.5 sm:pt-5 pb-1 flex items-center justify-between shrink-0 transition-all duration-300 ease-out ${
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {/* Left: Organization Status Pill */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[#0B4EA2] inline-block animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-slate-500">
            ORGANIZATION IDENTITY
          </span>
        </div>

        {/* Right: Minimal Exit Control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={onReturnToWorkspace}
          className="group flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/20 active:scale-95 min-h-[36px]"
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

      {/* 2. UNIFIED HERO IDENTITY COMPOSITION (VERTICALLY BALANCED) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-2 sm:py-4 max-w-3xl mx-auto w-full">
        
        {/* Algorithms365 Official Logo */}
        <div
          className={`transition-all duration-400 ease-out ${
            step >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-98'
          }`}
        >
          <div className="w-[140px] sm:w-[180px] md:w-[210px] mx-auto filter drop-shadow-2xs">
            {!logoError ? (
              <img
                src="/brand/algorithms365-official-logo.png"
                onError={() => setLogoError(true)}
                alt="Algorithms365"
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
            ) : (
              <div className="font-display font-black text-lg sm:text-xl text-[#0B4EA2] tracking-wider uppercase">
                ALGORITHMS365
              </div>
            )}
          </div>
        </div>

        {/* Subtle Hairline Divider */}
        <div
          className={`w-20 sm:w-28 my-2.5 sm:my-3 transition-all duration-300 ease-out ${
            step >= 3 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        >
          <div className="h-px bg-slate-200/80 w-full" />
        </div>

        {/* Active Engineering Unit Badge */}
        <div
          className={`transition-all duration-300 ease-out ${
            step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase shadow-2xs">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#0B4EA2] text-white flex items-center justify-center text-[9px] font-black">
              {displayInitial}
            </span>
            <span>ACTIVE ENGINEERING UNIT</span>
          </div>
        </div>

        {/* Dynamic Team Name Hero */}
        <div
          className={`mt-2 sm:mt-2.5 max-w-full transition-all duration-400 ease-out ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-slate-900 tracking-tight uppercase leading-none break-words px-2 text-center">
            {displayTeam}
          </h1>
        </div>

        {/* Subtitle: BY ALGORITHMS365 */}
        <div
          className={`mt-1 sm:mt-1.5 transition-all duration-300 ease-out ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <p className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-[#0B4EA2] uppercase">
            BY ALGORITHMS365
          </p>
        </div>

        {/* Short Organization & Team Description */}
        <div
          className={`mt-1.5 sm:mt-2 transition-all duration-300 ease-out px-2 ${
            step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <p className="text-[11px] sm:text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed text-center">
            Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
          </p>
        </div>

        {/* Integrated Team Image / Architecture Visual Card */}
        <div
          className={`w-full max-w-[340px] sm:max-w-[440px] md:max-w-[480px] mt-3 sm:mt-4 transition-all duration-500 ease-out ${
            step >= 6 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-98'
          }`}
        >
          {teamPhotoUrl ? (
            <div className="w-full h-28 sm:h-36 md:h-40 rounded-xl overflow-hidden border border-slate-200/80 shadow-xs bg-slate-100 relative group">
              <img
                src={teamPhotoUrl}
                alt={`${displayTeam} Team`}
                className="w-full h-full object-cover object-[center_35%] saturate-[0.92] contrast-[1.02]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-24 sm:h-32 rounded-xl overflow-hidden border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative shadow-2xs">
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 50%, rgba(11, 78, 162, 0.08) 0%, transparent 65%), linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
                  backgroundSize: '100% 100%, 20px 20px, 20px 20px',
                }}
              />
              <div className="relative z-10 flex items-center space-x-2.5 text-slate-700 font-mono text-xs">
                <Building2 className="w-4 h-4 text-[#0B4EA2]" />
                <span className="font-bold tracking-wider uppercase">{displayTeam} UNIT</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: Return to Workspace */}
        <div
          className={`mt-4 sm:mt-5 transition-all duration-400 ease-out ${
            step >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <button
            type="button"
            onClick={onReturnToWorkspace}
            className="inline-flex items-center justify-center space-x-2.5 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-[#0B4EA2] hover:bg-[#083D82] active:scale-95 text-white font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/30 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </main>

      {/* 3. CLEAN BOTTOM FOOTER */}
      <footer className="relative z-10 py-2.5 sm:py-3 text-center font-mono text-[10px] text-slate-400 shrink-0 pointer-events-none">
        <span>Algorithms365 · EngineerSpace Platform</span>
      </footer>
    </div>
  );
};
