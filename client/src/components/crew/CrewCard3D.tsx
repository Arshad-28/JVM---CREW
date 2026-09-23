import React, { useState, useRef } from 'react';
import { CrewMemberProfile } from '../../services/crewService';
import {
  RotateCw,
  Edit3,
  Terminal,
  Crown,
  Zap,
  Compass,
  Cpu,
  Layers,
  Shield,
  CheckCircle2,
  Linkedin,
  Github,
} from 'lucide-react';
import { cleanTeamDisplayName, sanitizeSocialUrl } from '../../utils/greetingEngine';

interface CrewCard3DProps {
  member: CrewMemberProfile;
  isFocused?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  currentUser?: any;
}

export const CrewCard3D: React.FC<CrewCard3DProps> = ({
  member,
  isFocused = false,
  onSelect,
  onEdit,
  currentUser,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glossX: 50, glossY: 50 });
  const cardRef = useRef<HTMLDivElement>(null);

  const isLeadUser = Boolean(currentUser?.isCurrentLead) || currentUser?.role === 'LEAD' || currentUser?.role === 'ADMIN';
  const isSelf = currentUser && (
    (currentUser.id !== undefined && member.userId !== undefined && currentUser.id === member.userId) ||
    (currentUser.id !== undefined && member.id !== undefined && currentUser.id === member.id) ||
    (currentUser.email && member.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
  );
  const canEdit = isLeadUser || isSelf;

  const getInitials = (name: string) => {
    if (!name) return 'JM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    const glossX = (x / rect.width) * 100;
    const glossY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glossX, glossY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, glossX: 50, glossY: 50 });
  };

  const handleCardClick = () => {
    if (!isFocused && onSelect) {
      onSelect();
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const serialNo = member.serialNumber || `CREW-00${member.id}`;
  const symbolUpper = (member.symbol || 'M').toUpperCase();
  const identityUpper = (member.identityTitle || 'THE MEMBER').toUpperCase();

  // Determine if Current Lead Card vs Normal Member Card dynamically from PostgreSQL
  const isCaptainCard = member.role === 'LEAD' || Boolean(member.isCurrentLead);

  // Per-Member Accent System (Used sparingly)
  const getMemberAccents = () => {
    if (isCaptainCard) {
      return {
        badgeBorder: 'border-amber-500/80',
        badgeBg: 'bg-amber-500/15 text-amber-400',
        accentText: 'text-amber-400',
        accentGlow: 'shadow-amber-500/20',
        tagBg: 'bg-amber-500/10 text-amber-300 border-amber-500/40',
        insignia: Crown,
        classLabel: 'LEADERSHIP / SDE INTERN',
      };
    }
    if (symbolUpper === 'A' || identityUpper.includes('ACE')) {
      return {
        badgeBorder: 'border-emerald-600/70',
        badgeBg: 'bg-emerald-600/10 text-emerald-400',
        accentText: 'text-emerald-400',
        accentGlow: 'shadow-emerald-500/20',
        tagBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        insignia: Zap,
        classLabel: member.characterClass || 'PRECISION / PROBLEM SOLVING',
      };
    }
    if (symbolUpper === 'C' || identityUpper.includes('BUILDER')) {
      return {
        badgeBorder: 'border-blue-600/70',
        badgeBg: 'bg-blue-600/10 text-blue-400',
        accentText: 'text-blue-400',
        accentGlow: 'shadow-blue-500/20',
        tagBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
        insignia: Cpu,
        classLabel: member.characterClass || 'ENGINEERING / IMPLEMENTATION',
      };
    }
    if (symbolUpper === 'P' || symbolUpper === 'S' || identityUpper.includes('STRATEGIST')) {
      return {
        badgeBorder: 'border-violet-600/70',
        badgeBg: 'bg-violet-600/10 text-violet-400',
        accentText: 'text-violet-400',
        accentGlow: 'shadow-violet-500/20',
        tagBg: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
        insignia: Layers,
        classLabel: member.characterClass || 'STRATEGY / LOGIC',
      };
    }
    // Explorer
    return {
      badgeBorder: 'border-teal-600/70',
      badgeBg: 'bg-teal-600/10 text-teal-400',
      accentText: 'text-teal-400',
      accentGlow: 'shadow-teal-500/20',
      tagBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      insignia: Compass,
      classLabel: member.characterClass || 'DISCOVERY / LEARNING',
    };
  };

  const accents = getMemberAccents();
  const MemberInsigniaIcon = accents.insignia;

  return (
    <div
      className={`relative select-none transition-all duration-300 ${
        isFocused ? 'w-full max-w-[360px] mx-auto my-2' : 'w-full max-w-[360px] mx-auto cursor-pointer hover:scale-[1.02]'
      }`}
      style={{ perspective: '1200px' }}
    >
      <div
        ref={cardRef}
        tabIndex={0}
        aria-label={`${member.name} ${member.identityTitle} Character Card`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="relative w-full h-[510px] rounded-xl transition-transform duration-600 shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-slate-400"
        style={{
          transform: isFlipped
            ? 'rotateY(180deg)'
            : `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Holographic Reflection Sheen Overlay (Moves ONLY on cursor hover!) */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none z-30 transition-opacity duration-300 ${
            isHovered ? 'opacity-30' : 'opacity-0'
          }`}
          style={{
            background: `radial-gradient(circle at ${tilt.glossX}% ${tilt.glossY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* ========================================================================= */}
        {/* FRONT SIDE: PLATINUM DIGITAL IDENTITY CARD                                */}
        {/* ========================================================================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl border p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FBFBFA] via-[#F5F4F0] to-[#ECEBE5] shadow-2xl backface-hidden text-slate-900 ${
            isCaptainCard ? 'border-amber-400/90' : 'border-slate-300'
          }`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Platinum Inner Hairline Border */}
          <div className={`absolute inset-1.5 rounded-lg border pointer-events-none ${
            isCaptainCard ? 'border-amber-400/40' : 'border-slate-300/60'
          }`} />

          {/* Corner Tech Brackets */}
          <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-400 rounded-tl-xs opacity-75" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-400 rounded-tr-xs opacity-75" />
          <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-400 rounded-bl-xs opacity-75" />
          <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-400 rounded-br-xs opacity-75" />

          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-300/80 pb-2 z-10">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-slate-800" />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-black tracking-widest text-slate-900 uppercase">
                  {cleanTeamDisplayName(member.teamName).toUpperCase() || 'CREW'}
                </span>
                <span className="font-mono text-[9px] font-bold text-slate-600 tracking-wider uppercase">
                  {accents.classLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-200/80 border border-slate-300 rounded-xs text-slate-800 shadow-2xs">
                {serialNo}
              </span>
              <div
                className={`w-7 h-7 rounded-sm border flex items-center justify-center font-mono font-extrabold text-sm shadow-2xs ${accents.badgeBg} ${accents.badgeBorder}`}
              >
                {symbolUpper}
              </div>
            </div>
          </div>

          {/* Centerpiece Portrait Frame */}
          <div className="my-1 flex flex-col items-center justify-center space-y-2 z-10">
            <div className="relative">
              <div className={`w-28 h-28 rounded-full border-2 p-1.5 bg-[#FFFFFF] shadow-lg flex items-center justify-center relative ${
                isCaptainCard ? 'border-amber-400' : accents.badgeBorder
              }`}>
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover shadow-inner"
                  />
                ) : (
                  <div className={`w-full h-full rounded-full flex flex-col items-center justify-center font-mono font-black text-2xl tracking-wider shadow-inner ${accents.badgeBg}`}>
                    <span>{getInitials(member.name)}</span>
                  </div>
                )}

                <div className={`absolute -bottom-1 right-0 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                  isCaptainCard ? 'bg-amber-500 text-amber-950' : 'bg-slate-800 text-white'
                }`}>
                  <MemberInsigniaIcon className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-0.5">
              <h3 className="font-display text-base font-black text-slate-900 tracking-tight uppercase">
                {member.name}
              </h3>
              <span className={`inline-block font-mono text-[10px] font-black px-2.5 py-0.5 rounded-xs border uppercase tracking-wider shadow-2xs ${accents.tagBg}`}>
                {isCaptainCard ? '👑 CURRENT LEAD' : 'MEMBER'}
              </span>
            </div>
          </div>

          {/* Embedded Information Plate */}
          <div className="border border-slate-300/80 py-2.5 z-10 font-mono text-[10px] space-y-1 bg-gradient-to-b from-[#FFFFFF] to-[#F5F4EF] px-3 rounded-sm shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase text-[9px]">TEAM ROLE</span>
              <span className="font-black text-slate-900">
                {isCaptainCard ? 'CURRENT LEAD' : 'MEMBER'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/70 pt-1">
              <span className="text-slate-500 font-bold uppercase text-[9px]">ORGANIZATION</span>
              <span className="font-bold text-slate-800">
                {member.internship || 'Algorithms365'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/70 pt-1">
              <span className="text-slate-500 font-bold uppercase text-[9px]">POSITION</span>
              <span className="font-extrabold text-slate-900">
                {member.internshipRole || 'SDE Intern'}
              </span>
            </div>

            {/* Social Links on Front Card */}
            {(member.linkedinUrl || member.linkedin || member.githubUrl || member.github) && (
              <div className="flex items-center justify-end space-x-1.5 border-t border-slate-200/70 pt-1.5">
                {(member.linkedinUrl || member.linkedin) && (
                  <a
                    href={sanitizeSocialUrl(member.linkedinUrl || member.linkedin) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white border border-[#0077B5]/30 rounded-xs transition-colors shadow-2xs"
                    title="Open LinkedIn Profile"
                  >
                    <Linkedin className="w-2.5 h-2.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {(member.githubUrl || member.github) && (
                  <a
                    href={sanitizeSocialUrl(member.githubUrl || member.github) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-slate-900/10 text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-900/30 rounded-xs transition-colors shadow-2xs"
                    title="Open GitHub Profile"
                  >
                    <Github className="w-2.5 h-2.5" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="pt-2 z-10 flex items-center justify-between font-mono text-[10px] border-t border-slate-300/80">
            <span className="text-slate-700 font-bold">{serialNo}</span>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className={`px-2.5 py-1 font-mono font-bold rounded-xs transition-colors flex items-center space-x-1 shadow-2xs ${
                  isCaptainCard
                    ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 border border-amber-600/40'
                    : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>VIEW DOSSIER →</span>
              </button>

              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 bg-[#FFFFFF] border border-slate-300 hover:border-slate-500 rounded-xs text-slate-800 transition-colors shadow-2xs"
                  title={isLeadUser ? 'Edit Member Profile' : 'Edit My Profile'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BACK SIDE OF CARD: REFINED SINGLE-SURFACE PLATINUM DOSSIER (NO BOXES)     */}
        {/* ========================================================================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-xl border p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#FBFBFA] via-[#F5F4F0] to-[#ECEBE5] shadow-2xl rotate-y-180 backface-hidden text-slate-900 ${
            isCaptainCard ? 'border-amber-400/90' : 'border-slate-300'
          }`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Hairline Inner Border */}
          <div className={`absolute inset-1.5 rounded-lg border pointer-events-none ${
            isCaptainCard ? 'border-amber-400/40' : 'border-slate-300/60'
          }`} />

          {/* Corner Brackets */}
          <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-slate-400 rounded-tl-xs opacity-75" />
          <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-slate-400 rounded-tr-xs opacity-75" />
          <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-slate-400 rounded-bl-xs opacity-75" />
          <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-slate-400 rounded-br-xs opacity-75" />

          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-300/80 pb-2 z-10">
            <div className="flex items-center space-x-2">
              <Shield className={`w-4 h-4 ${isCaptainCard ? 'text-amber-700' : 'text-slate-800'}`} />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-900">
                  {cleanTeamDisplayName(member.teamName).toUpperCase() || 'CREW'}
                </span>
                <span className="font-mono text-[9px] text-slate-600 font-bold">
                  MEMBER DOSSIER
                </span>
              </div>
            </div>

            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-200/80 border border-slate-300 rounded-xs text-slate-800 shadow-2xs">
              {serialNo}
            </span>
          </div>

          {/* Single Surface Integrated Dossier Content (NO Separate Box Containers!) */}
          <div className="my-1.5 space-y-2.5 font-mono text-xs z-10 overflow-y-auto max-h-[350px] pr-1">
            {/* Upper Identity Header */}
            <div className="flex items-center space-x-3 pb-2 border-b border-slate-300/80">
              <div className={`w-11 h-11 rounded-sm border flex items-center justify-center font-mono font-extrabold text-sm shrink-0 shadow-2xs ${accents.badgeBg} ${accents.badgeBorder}`}>
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover rounded-sm" />
                ) : (
                  getInitials(member.name)
                )}
              </div>
              <div className="truncate">
                <h4 className="font-display text-xs font-black text-slate-900 truncate uppercase">{member.name}</h4>
                <span className={`text-[9px] font-bold block ${accents.accentText}`}>
                  {isCaptainCard ? 'CURRENT LEAD' : 'MEMBER'} · SDE Intern
                </span>
              </div>
            </div>

            {/* IDENTITY SECTION */}
            <div className="space-y-0.5">
              <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">IDENTITY</span>
              <div className="flex justify-between items-baseline text-[10px] pl-1">
                <span className="text-slate-600">Registered Email</span>
                <span className="font-bold text-slate-900 font-mono truncate max-w-[180px]">{member.email || 'Not added yet'}</span>
              </div>
            </div>

            {/* ACADEMIC SECTION */}
            <div className="pt-1 border-t border-slate-300/60 space-y-0.5">
              <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">ACADEMIC</span>
              <div className="flex justify-between items-baseline text-[10px] pl-1">
                <span className="text-slate-600">College / Institute</span>
                <span className="font-semibold text-slate-900 font-sans text-right max-w-[180px]">
                  {member.college ? member.college : <span className="italic opacity-60">Not added yet</span>}
                </span>
              </div>
            </div>

            {/* PROFESSIONAL SECTION */}
            <div className="pt-1 border-t border-slate-300/60 space-y-0.5">
              <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">PROFESSIONAL</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] pl-1">
                <div>
                  <span className="text-slate-500 text-[8px] block uppercase">Organization</span>
                  <span className="font-bold text-slate-900 truncate block">{member.internship || 'Algorithms365'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[8px] block uppercase">Position</span>
                  <span className="font-extrabold text-slate-900 truncate block">{member.internshipRole || 'SDE Intern'}</span>
                </div>
              </div>
            </div>

            {/* CREW SECTION */}
            <div className="pt-1 border-t border-slate-300/60 space-y-0.5">
              <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">CREW</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] pl-1">
                <div>
                  <span className="text-slate-500 text-[8px] block uppercase">Cohort</span>
                  <span className="font-bold text-slate-900 font-mono">{cleanTeamDisplayName(member.teamName) || 'Internship'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[8px] block uppercase">Team Role</span>
                  <span className="font-extrabold text-slate-900 font-mono">{member.role === 'LEAD' ? 'Team Lead' : 'Member'}</span>
                </div>
              </div>
            </div>

            {/* ENGINEERING PROFILE */}
            {member.bio && (
              <div className="pt-1 border-t border-slate-300/60 space-y-0.5">
                <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">ENGINEERING DOSSIER</span>
                <p className="font-sans text-[10px] text-slate-800 leading-relaxed italic pl-1">
                  "{member.bio}"
                </p>
              </div>
            )}

            {/* SOCIAL PROFILES SECTION */}
            {(member.linkedinUrl || member.linkedin || member.githubUrl || member.github) && (
              <div className="pt-1 border-t border-slate-300/60 space-y-1">
                <span className="text-slate-500 font-bold text-[9px] block uppercase tracking-wider">SOCIAL PROFILES</span>
                <div className="flex items-center space-x-2 pl-1">
                  {(member.linkedinUrl || member.linkedin) && (
                    <a
                      href={sanitizeSocialUrl(member.linkedinUrl || member.linkedin) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5] hover:text-white border border-[#0077B5]/30 rounded-xs transition-colors"
                      title="Open LinkedIn Profile"
                    >
                      <Linkedin className="w-2.5 h-2.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {(member.githubUrl || member.github) && (
                    <a
                      href={sanitizeSocialUrl(member.githubUrl || member.github) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-slate-900/10 text-slate-900 hover:bg-slate-900 hover:text-white border border-slate-900/30 rounded-xs transition-colors"
                      title="Open GitHub Profile"
                    >
                      <Github className="w-2.5 h-2.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Authentication Mark */}
            <div className="pt-2 border-t border-slate-300/80 flex items-center justify-between text-[9px] text-slate-700 font-mono">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="font-bold">CREW VERIFIED</span>
              </div>
              <span className="font-bold">{serialNo}</span>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-slate-300/80 pt-2 z-10 flex items-center justify-between font-mono text-[10px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 font-bold rounded-xs transition-colors flex items-center space-x-1 shadow-2xs ${
                isCaptainCard
                  ? 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <RotateCw className="w-3 h-3" />
              <span>FLIP TO FRONT</span>
            </button>

            {canEdit && onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-2 py-1 bg-[#FFFFFF] border border-slate-300 hover:border-slate-500 text-slate-800 rounded-xs font-bold transition-colors flex items-center space-x-1 shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isLeadUser ? 'Edit Member' : 'Edit My Profile'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
