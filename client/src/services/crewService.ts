import { TeamMemberSummary } from '../types';

export interface CrewMemberProfile {
  id: number;
  userId: number;
  serialNumber: string;
  name: string;
  role: 'LEAD' | 'MEMBER';
  roleTitle: string;
  identityTitle: string;
  characterClass: string;
  symbol: string;
  email: string;
  college?: string;
  internship?: string;
  internshipRole?: string;
  teamName?: string;
  photoUrl?: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  accentColor?: string;
  phoneNumber?: string;
  github?: string;
  linkedin?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isCurrentLead?: boolean;
}

export function mapTeamMemberToCrewProfile(member: TeamMemberSummary): CrewMemberProfile {
  const isLead = Boolean(member.role === 'LEAD' || member.isCurrentLead);
  const initialSymbol = member.name ? member.name.charAt(0).toUpperCase() : 'M';

  return {
    id: member.userId,
    userId: member.userId,
    serialNumber: member.serialNumber || (isLead ? 'LEAD' : 'MEMBER'),
    name: member.name,
    role: isLead ? 'LEAD' : 'MEMBER',
    isCurrentLead: isLead,
    roleTitle: member.position || 'SDE Intern',
    identityTitle: isLead ? 'CURRENT LEAD' : 'MEMBER',
    characterClass: isLead ? 'LEADERSHIP / SDE INTERN' : 'ENGINEERING / SDE INTERN',
    symbol: initialSymbol,
    email: member.email,
    phoneNumber: member.phoneNumber,
    college: member.college || undefined,
    internship: member.organization || undefined,
    internshipRole: member.position || 'SDE Intern',
    photoUrl: member.photoUrl || member.avatarUrl || undefined,
    bio: member.bio || undefined,
    skills: isLead
      ? ['Java', 'Spring Boot', 'System Architecture', 'React']
      : ['Java', 'Core Java', 'Data Structures', 'Problem Solving'],
    github: member.githubUrl || undefined,
    linkedin: member.linkedinUrl || undefined,
    githubUrl: member.githubUrl || undefined,
    linkedinUrl: member.linkedinUrl || undefined,
  };
}

export function getCrewMembers(): CrewMemberProfile[] {
  return [];
}

export function updateCrewMember(_id: number, _updates: Partial<CrewMemberProfile>): CrewMemberProfile[] {
  // Persistence is strictly driven by the PostgreSQL database via API calls
  return [];
}
