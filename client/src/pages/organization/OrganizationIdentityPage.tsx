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

    const t1 = setTimeout(() => setStep(1), 40);   // Header / Status
    const t2 = setTimeout(() => setStep(2), 110);  // Logo
    const t3 = setTimeout(() => setStep(3), 180);  // Divider & Badge
    const t4 = setTimeout(() => setStep(4), 250);  // Team Name & Subtitle
    const t5 = setTimeout(() => setStep(5), 320);  // Description
    const t6 = setTimeout(() => setStep(6), 390);  // Showcase Card
    const t7 = setTimeout(() => setStep(7), 460);  // Primary CTA Button

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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-center">
        <div className="max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h2 className="text-sm font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 font-mono">
            Please log in to access your organization workspace.
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState({}, '', '/');
              window.location.reload();
            }}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg font-mono text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] text-slate-900 flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      
      {/* Ambient Top Glow Effect */}
      <div
        className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-br from-blue-400/10 via-indigo-300/10 to-transparent rounded-full blur-3xl pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Subtle Micro-Grid Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* 1. TOP UTILITY HEADER */}
      <header
        className={`relative z-20 px-4 sm:px-8 md:px-12 pt-3.5 sm:pt-5 pb-1 flex items-center justify-between shrink-0 transition-all duration-300 ease-out ${
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {/* Left: Organization Status Pill */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-slate-600">
            ORGANIZATION IDENTITY
          </span>
        </div>

        {/* Right: Minimal Interactive Exit Control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={onReturnToWorkspace}
          className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200/90 bg-white/90 hover:bg-white text-slate-700 hover:text-[#0B4EA2] hover:border-[#0B4EA2]/30 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/20 min-h-[36px]"
          title="Return to workspace (Esc)"
          aria-label="Return to Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0B4EA2] group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-mono text-xs font-semibold tracking-wider">
            WORKSPACE
          </span>
          <kbd className="font-mono text-[9px] font-bold text-slate-400 group-hover:text-slate-600 bg-slate-100 group-hover:bg-slate-200/70 px-1.5 py-0.5 rounded border border-slate-200/60 transition-colors">
            ESC
          </kbd>
        </button>
      </header>

      {/* 2. UNIFIED HERO IDENTITY STAGE (VERTICALLY BALANCED & MODERN) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-3 sm:py-5 max-w-3xl mx-auto w-full my-auto">
        
        {/* Official Algorithms365 Logo with Hover Lift */}
        <div
          className={`transition-all duration-400 ease-out ${
            step >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-98'
          }`}
        >
          <div className="w-[150px] sm:w-[190px] md:w-[220px] mx-auto filter drop-shadow-2xs transition-transform duration-300 hover:scale-[1.02] cursor-default">
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

        {/* Elegant Gradient Hairline Divider */}
        <div
          className={`w-24 sm:w-32 h-[1.5px] bg-gradient-to-r from-transparent via-[#0B4EA2]/40 to-transparent my-3 sm:my-3.5 transition-all duration-300 ease-out ${
            step >= 3 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />

        {/* Active Engineering Unit Pill Badge */}
        <div
          className={`transition-all duration-300 ease-out ${
            step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs text-slate-700 font-mono text-[9px] sm:text-[10px] font-bold tracking-wider uppercase transition-all duration-200 hover:border-slate-300 hover:shadow-xs">
            <span className="w-4 h-4 rounded bg-gradient-to-tr from-[#0B4EA2] to-[#2563eb] text-white flex items-center justify-center text-[9px] font-black shadow-2xs">
              {displayInitial}
            </span>
            <span>ACTIVE ENGINEERING UNIT</span>
          </div>
        </div>

        {/* Dynamic Hero Team Name */}
        <div
          className={`mt-2.5 sm:mt-3 max-w-full transition-all duration-400 ease-out ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <h1 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-slate-900 tracking-tight uppercase leading-none break-words px-2 text-center drop-shadow-2xs">
            {displayTeam}
          </h1>
        </div>

        {/* Subtitle: BY ALGORITHMS365 */}
        <div
          className={`mt-1.5 sm:mt-2 transition-all duration-300 ease-out ${
            step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <p className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-[#0B4EA2] uppercase flex items-center justify-center space-x-1.5">
            <span className="w-1 h-1 rounded-full bg-[#0B4EA2]/50" />
            <span>BY ALGORITHMS365</span>
            <span className="w-1 h-1 rounded-full bg-[#0B4EA2]/50" />
          </p>
        </div>

        {/* Short Organization & Team Description */}
        <div
          className={`mt-2 sm:mt-2.5 transition-all duration-300 ease-out px-2 ${
            step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <p className="text-[11px] sm:text-xs text-slate-500 font-sans max-w-md mx-auto leading-relaxed text-center">
            Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
          </p>
        </div>

        {/* Integrated Modern Team Showcase Card */}
        <div
          className={`w-full max-w-[360px] sm:max-w-[480px] md:max-w-[520px] mt-3.5 sm:mt-4.5 transition-all duration-500 ease-out ${
            step >= 6 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-98'
          }`}
        >
          {teamPhotoUrl ? (
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-white p-1.5 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="relative w-full h-32 sm:h-40 md:h-44 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={teamPhotoUrl}
                  alt={`${displayTeam} Team`}
                  className="w-full h-full object-cover object-[center_35%] saturate-[0.96] contrast-[1.03] group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3 flex items-center space-x-1.5 bg-slate-900/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white font-mono text-[10px] font-semibold shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{displayTeam} CREW</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200/90 bg-white p-1.5 shadow-sm">
              <div className="relative w-full h-24 sm:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 border border-slate-100 flex items-center justify-center p-4">
                <div className="relative z-10 flex items-center space-x-2 text-slate-800 font-mono text-xs font-bold tracking-wider uppercase bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/80 shadow-2xs">
                  <Building2 className="w-4 h-4 text-[#0B4EA2]" />
                  <span>{displayTeam} UNIT · ACTIVE WORKSPACE</span>
                </div>
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
            className="group inline-flex items-center justify-center space-x-2.5 px-8 sm:px-10 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#0B4EA2] via-[#0D5BC6] to-[#0B4EA2] bg-[length:200%_auto] hover:bg-right text-white font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/40 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1.5 transition-transform duration-200" />
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
