import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TeamIdentityRevealProps {
  isOpen: boolean;
  teamName: string;
  teamInitial: string;
  origin?: { x: number; y: number } | null;
  onClose: () => void;
}

export const TeamIdentityReveal: React.FC<TeamIdentityRevealProps> = ({
  isOpen,
  teamName,
  teamInitial,
  origin,
  onClose,
}) => {
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Handle Opening Lifecycle with Exact Staggered Milestones
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setStep(0);

      // Trigger physical radial clip-path expansion from origin on next frame
      const frameId = requestAnimationFrame(() => {
        setIsExpanded(true);
      });

      // Staggered Reveal Timeline
      const tHeader = setTimeout(() => setStep(1), 100);   // Header & Top Nav (0-200ms)
      const tLogo = setTimeout(() => setStep(2), 240);     // Official Algorithms365 Logo (150-350ms)
      const tDivider = setTimeout(() => setStep(3), 360);  // Subtle hairline divider (300-450ms)
      const tBadge = setTimeout(() => setStep(4), 480);    // [ J ] ACTIVE ENGINEERING UNIT (450-650ms)
      const tTeam = setTimeout(() => setStep(5), 620);     // Hero Team Name (600-850ms)
      const tOrg = setTimeout(() => setStep(6), 760);      // BY ALGORITHMS365 (750-950ms)
      const tDesc = setTimeout(() => setStep(7), 880);     // Description (850-1050ms)
      const tPhoto = setTimeout(() => setStep(8), 980);    // Subtle Integrated Group Photo (950-1250ms)
      const tBtn = setTimeout(() => setStep(9), 1100);     // Return to Workspace Button (1050-1350ms)

      return () => {
        cancelAnimationFrame(frameId);
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
    } else {
      setIsExpanded(false);
      setIsClosing(false);
      setStep(0);
      setIsRendered(false);
    }
  }, [isOpen]);

  // Handle Reverse Contraction ("Return to Workspace")
  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    if (prefersReducedMotion) {
      onClose();
      return;
    }

    // Surface contracts smoothly back toward the clicked team-logo coordinate
    setIsExpanded(false);

    closeTimerRef.current = setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
    }, 400);
  };

  // Handle ESC key to cleanly trigger reverse animation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen, isClosing]);

  if (!isRendered && !isOpen) return null;

  const displayTeam = teamName && teamName.trim().length > 0 ? teamName.trim() : 'JVM CREW';
  const displayInitial =
    teamInitial && teamInitial.trim().length > 0
      ? teamInitial.trim().toUpperCase()
      : displayTeam.charAt(0).toUpperCase();

  // Dynamic origin coordinates for physical radial expansion / collapse
  const origX = origin?.x ?? 48;
  const origY = origin?.y ?? 28;

  const clipPathStyle = prefersReducedMotion
    ? {}
    : {
        clipPath:
          isExpanded && !isClosing
            ? `circle(160vmax at ${origX}px ${origY}px)`
            : `circle(0px at ${origX}px ${origY}px)`,
        transition: isClosing
          ? 'clip-path 380ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'clip-path 650ms cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'clip-path',
      };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-[#FBFBFA] text-slate-900 select-none overflow-y-auto overflow-x-hidden font-sans ${
        prefersReducedMotion
          ? isClosing
            ? 'opacity-0 transition-opacity duration-200'
            : 'opacity-100 transition-opacity duration-300'
          : ''
      }`}
      style={clipPathStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Algorithms365 Organization and Team Identity Reveal"
    >
      {/* ========================================================================= */}
      {/* 1. INTEGRATED TEAM PHOTOGRAPH (Subtle Background Foundation across teams)  */}
      {/* ========================================================================= */}
      <div
        className={`absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 w-[92vw] max-w-[1400px] h-[58vh] max-h-[560px] min-h-[320px] pointer-events-none z-0 transition-all duration-1000 ease-out select-none flex items-end justify-center ${
          step >= 8 && !isClosing
            ? 'opacity-[0.22] sm:opacity-[0.24] md:opacity-[0.25] translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-[1.015]'
        }`}
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 16%, rgba(0,0,0,0.7) 38%, black 65%, transparent 98%), radial-gradient(ellipse 92% 82% at 50% 68%, black 45%, transparent 96%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.18) 16%, rgba(0,0,0,0.7) 38%, black 65%, transparent 98%), radial-gradient(ellipse 92% 82% at 50% 68%, black 45%, transparent 96%)',
        }}
        aria-hidden="true"
      >
        <img
          src="/brand/jvmcrew-group.jpg"
          alt=""
          className="w-full h-full object-cover object-center saturate-[0.92] contrast-[1.04] brightness-[1.0]"
          loading="lazy"
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HEADER (Extremely minimal, quiet, balanced padding)                */}
      {/* ========================================================================= */}
      <header
        className={`relative z-20 px-6 sm:px-12 md:px-16 pt-6 sm:pt-8 md:pt-10 flex items-center justify-between transition-all duration-500 ease-out ${
          step >= 1 && !isClosing
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2'
        }`}
      >
        {/* Left: Understated status label */}
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B4EA2] inline-block" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase">
            ORGANIZATION IDENTITY
          </span>
        </div>

        {/* Right: Minimal exit control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={handleClose}
          className="group flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white/90 hover:bg-white hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all duration-150 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/20"
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

      {/* ========================================================================= */}
      {/* 3. CENTER IDENTITY CONTENT (Elevated, Balanced Vertical Rhythm)           */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-8 text-center pt-8 sm:pt-12 md:pt-14 pb-8 sm:pb-12 max-w-3xl mx-auto w-full">
        
        {/* Official Algorithms365 Logo (Authentic Asset, 100% Transparent, High-Res) */}
        <div
          className={`transition-all duration-600 ease-out flex flex-col items-center ${
            step >= 2 && !isClosing
              ? 'opacity-100 blur-0 scale-100 translate-y-0'
              : 'opacity-0 blur-xs scale-95 translate-y-3'
          }`}
        >
          <div className="relative w-[210px] sm:w-[260px] md:w-[290px] flex items-center justify-center select-none">
            <img
              src="/brand/algorithms365-official-logo.png"
              alt="Algorithms 365"
              className="w-full h-auto object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Single Subtle Hairline Divider (180-250px) */}
        <div
          className={`w-[180px] sm:w-[220px] md:w-[250px] my-6 sm:my-8 transition-all duration-500 ease-out ${
            step >= 3 && !isClosing
              ? 'opacity-100 scale-x-100'
              : 'opacity-0 scale-x-0'
          }`}
        >
          <div className="h-px bg-slate-200/80 w-full" />
        </div>

        {/* Team Identity Area */}
        <div className="flex flex-col items-center w-full">
          
          {/* Active Engineering Unit Badge */}
          <div
            className={`transition-all duration-500 ease-out ${
              step >= 4 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-100/95 border border-slate-200/80 text-slate-700 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-2xs backdrop-blur-xs">
              <span className="w-4 h-4 rounded-xs bg-[#0B4EA2] text-white flex items-center justify-center text-[10px] font-black">
                {displayInitial}
              </span>
              <span>ACTIVE ENGINEERING UNIT</span>
            </div>
          </div>

          {/* Team Name (Hero Element, 18-28px below badge) */}
          <div
            className={`mt-4 sm:mt-5 transition-all duration-600 ease-out ${
              step >= 5 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-slate-900 tracking-tight uppercase leading-none drop-shadow-xs">
              {displayTeam}
            </h1>
          </div>

          {/* BY ALGORITHMS365 (18-25px below team name) */}
          <div
            className={`mt-4 sm:mt-5 transition-all duration-500 ease-out ${
              step >= 6 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#0B4EA2] uppercase">
              BY ALGORITHMS365
            </p>
          </div>

          {/* Short Organization / Team Description (25-35px below attribution) */}
          <div
            className={`mt-5 sm:mt-7 transition-all duration-500 ease-out ${
              step >= 7 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-xs sm:text-sm text-slate-500 font-sans max-w-md mx-auto leading-relaxed">
              Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
            </p>
          </div>

          {/* Primary Action: ← RETURN TO WORKSPACE (45-60px below description) */}
          <div
            className={`mt-8 sm:mt-11 transition-all duration-500 ease-out ${
              step >= 9 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <button
              type="button"
              onClick={handleClose}
              className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[340px] h-[48px] sm:h-[52px] rounded-full bg-[#0B4EA2] hover:bg-[#093D80] active:scale-95 text-white font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0B4EA2]/30"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO WORKSPACE</span>
            </button>
          </div>
        </div>
      </main>

      {/* Clean Bottom Spacing */}
      <div className="pb-6 sm:pb-8 pointer-events-none" />
    </div>
  );
};
