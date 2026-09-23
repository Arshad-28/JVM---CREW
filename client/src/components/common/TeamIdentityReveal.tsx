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

  // Handle Opening Lifecycle with Staggered Milestones
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setStep(0);

      const frameId = requestAnimationFrame(() => {
        setIsExpanded(true);
      });

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
    setIsExpanded(false);

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
    }, prefersReducedMotion ? 0 : 220);
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

  const displayTeam = teamName && teamName.trim().length > 0 ? teamName.trim() : 'EngineerSpace';
  const displayInitial =
    teamInitial && teamInitial.trim().length > 0
      ? teamInitial.trim().toUpperCase()
      : displayTeam.charAt(0).toUpperCase();

  // Dynamic origin coordinates for physical radial expansion / collapse
  const origX = origin?.x ?? (typeof window !== 'undefined' ? Math.round(window.innerWidth / 2) : 48);
  const origY = origin?.y ?? 32;

  const clipPathStyle = prefersReducedMotion
    ? {}
    : {
        clipPath:
          isExpanded && !isClosing
            ? `circle(160vmax at ${origX}px ${origY}px)`
            : `circle(0px at ${origX}px ${origY}px)`,
        transition: isClosing
          ? 'clip-path 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out'
          : 'clip-path 450ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease-out',
        willChange: 'clip-path, opacity',
      };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between bg-paper text-ink select-none overflow-y-auto overflow-x-hidden font-sans ${
        isClosing ? 'opacity-0 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-250'
      }`}
      style={clipPathStyle}
      role="dialog"
      aria-modal="true"
      aria-label="Algorithms365 Organization and Team Identity Reveal"
    >
      {/* 1. INTEGRATED TEAM PHOTOGRAPH (Subtle, balanced contrast, warm tone integration) */}
      <div
        className={`absolute bottom-0 sm:bottom-2 left-1/2 -translate-x-1/2 w-[92vw] max-w-[1300px] h-[55vh] max-h-[520px] min-h-[300px] pointer-events-none z-0 transition-all duration-700 ease-out select-none flex items-end justify-center ${
          step >= 8 && !isClosing
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
          src="/brand/jvmcrew-group.jpg"
          alt=""
          className="w-full h-full object-cover object-center saturate-[0.88] contrast-[1.02] brightness-[0.98]"
          loading="lazy"
        />
      </div>

      {/* 2. TOP HEADER */}
      <header
        className={`relative z-20 px-6 sm:px-12 md:px-16 pt-6 sm:pt-8 flex items-center justify-between transition-all duration-400 ease-out ${
          step >= 1 && !isClosing
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-2'
        }`}
      >
        {/* Left: Organization Status Pill */}
        <div className="flex items-center space-x-2 text-muted">
          <span className="w-2 h-2 rounded-full bg-primary inline-block animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-muted">
            ORGANIZATION IDENTITY
          </span>
        </div>

        {/* Right: Minimal exit control (← WORKSPACE  ESC) */}
        <button
          type="button"
          onClick={handleClose}
          className="group flex items-center space-x-2 px-3.5 py-1.5 rounded-sm border border-line bg-paper-light hover:bg-paper text-ink transition-all duration-150 shadow-2xs cursor-pointer focus-ring"
          title="Return to workspace (Esc)"
          aria-label="Back to Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary group-hover:-translate-x-0.5 transition-transform duration-150" />
          <span className="font-mono text-xs font-bold tracking-wider text-ink">
            WORKSPACE
          </span>
          <span className="font-mono text-[9px] font-bold text-muted bg-paper-dark px-1.5 py-0.5 rounded-xs border border-line">
            ESC
          </span>
        </button>
      </header>

      {/* 3. CENTER IDENTITY CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 text-center py-8 max-w-3xl mx-auto w-full">
        {/* Official Algorithms365 Logo */}
        <div
          className={`transition-all duration-500 ease-out ${
            step >= 2 && !isClosing
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-98'
          }`}
        >
          <div className="w-[180px] sm:w-[240px] md:w-[280px] mx-auto filter drop-shadow-2xs">
            <img
              src="/brand/algorithms365-logo.png"
              alt="Algorithms 365"
              className="w-full h-auto object-contain select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Single Subtle Hairline Divider */}
        <div
          className={`w-[180px] sm:w-[220px] my-5 sm:my-6 transition-all duration-400 ease-out ${
            step >= 3 && !isClosing
              ? 'opacity-100 scale-x-100'
              : 'opacity-0 scale-x-0'
          }`}
        >
          <div className="h-px bg-line w-full" />
        </div>

        {/* Team Identity Area */}
        <div className="flex flex-col items-center w-full">
          {/* Active Engineering Unit Badge */}
          <div
            className={`transition-all duration-400 ease-out ${
              step >= 4 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-sm bg-paper-light border border-line text-ink font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase shadow-2xs">
              <span className="w-4 h-4 rounded-xs bg-primary text-white flex items-center justify-center text-[10px] font-black">
                {displayInitial}
              </span>
              <span>ACTIVE ENGINEERING UNIT</span>
            </div>
          </div>

          {/* Team Name Hero */}
          <div
            className={`mt-3 sm:mt-4 transition-all duration-500 ease-out ${
              step >= 5 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-ink tracking-tight uppercase leading-none">
              {displayTeam}
            </h1>
          </div>

          {/* BY ALGORITHMS365 */}
          <div
            className={`mt-2.5 sm:mt-3 transition-all duration-400 ease-out ${
              step >= 6 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="font-mono text-xs sm:text-sm font-bold tracking-widest text-primary uppercase">
              BY ALGORITHMS365
            </p>
          </div>

          {/* Short Organization Description */}
          <div
            className={`mt-4 sm:mt-5 transition-all duration-400 ease-out ${
              step >= 7 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <p className="text-xs sm:text-sm text-muted font-sans max-w-md mx-auto leading-relaxed">
              Enterprise Engineering Suite · High-Performance Concurrency & Architecture Systems.
            </p>
          </div>

          {/* Primary Action: ← RETURN TO WORKSPACE (Clean, high-contrast, premium engineering button) */}
          <div
            className={`mt-7 sm:mt-9 transition-all duration-400 ease-out ${
              step >= 9 && !isClosing
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-3'
            }`}
          >
            <button
              type="button"
              onClick={handleClose}
              className="w-full max-w-[280px] sm:max-w-[320px] py-3 px-6 rounded-sm bg-ink hover:bg-ink-light active:scale-[0.98] text-paper font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-150 shadow-sm hover:shadow-card-hover hover-lift flex items-center justify-center space-x-2.5 cursor-pointer focus-ring"
            >
              <ArrowLeft className="w-4 h-4 text-paper/80 group-hover:-translate-x-0.5 transition-transform" />
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
