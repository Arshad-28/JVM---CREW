/**
 * Greeting Engine for JVM CREW My Day Workspace
 * Provides deterministic, date-anchored, time-aware personalized greetings
 * with dynamic real-data context derivation.
 */

export function getFirstName(fullName?: string): string {
  if (!fullName) return 'Engineer';
  return fullName.trim().split(' ')[0];
}

export function getTimeGreeting(fullName?: string): string {
  const name = getFirstName(fullName);
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 12) {
    return `GOOD MORNING, ${name.toUpperCase()}.`;
  } else if (hour >= 12 && hour < 17) {
    return `GOOD AFTERNOON, ${name.toUpperCase()}.`;
  } else {
    return `GOOD EVENING, ${name.toUpperCase()}.`;
  }
}

const LEAD_SUBTITLES = [
  'Ready to move the crew forward today?',
  "Let's keep the team aligned and unblocked.",
  'The crew is ready for another productive day.',
  'Time to lead from the front.',
  "Let's make today a strong one for the team.",
  'Clear direction creates strong momentum.',
  'Lead with clarity. Guide the crew to success.',
];

const MEMBER_SUBTITLES = [
  'Ready to make today count?',
  "Let's make some solid progress today.",
  'One focused day at a time.',
  "Let's get today's work moving.",
  "Let's turn today's plan into progress.",
  'Focused effort leads to great results.',
  'Stay curious, stay consistent, keep building.',
];

/**
 * Deterministic daily subtitle based on hash(userId + date)
 * Ensures the greeting is stable for the whole day and changes tomorrow.
 */
export function getDailySubtitle(userId: number, role: string, dateString: string): string {
  const isLead = role === 'LEAD' || role === 'ADMIN';
  const list = isLead ? LEAD_SUBTITLES : MEMBER_SUBTITLES;

  let hash = 0;
  const key = `${userId}_${dateString}_${role}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % list.length;
  return list[index];
}

export function getFormattedTodayDate(): { dayName: string; formattedDate: string; fullTitle: string } {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const fullTitle = `${dayName} · ${formattedDate}`;
  return { dayName, formattedDate, fullTitle };
}

export interface ContextParams {
  role: string;
  openBlockers?: number;
  overdueTasks?: number;
  tasksDueToday?: number;
  pendingHomework?: number;
  openTasks?: number;
  standupDone?: boolean;
  needsAttentionCount?: number;
  totalMembers?: number;
  updatesReceived?: number;
}

export function getPersonalDailyContext(params: ContextParams): string {
  const isLead = params.role === 'LEAD' || params.role === 'ADMIN';

  if (isLead) {
    if (params.openBlockers && params.openBlockers > 0) {
      return `Team Alert: ${params.openBlockers} active blocker${params.openBlockers > 1 ? 's' : ''} require Lead intervention.`;
    }
    if (params.needsAttentionCount && params.needsAttentionCount > 0) {
      return `${params.needsAttentionCount} team item${params.needsAttentionCount > 1 ? 's' : ''} require your review today.`;
    }
    if (params.totalMembers != null && params.updatesReceived != null) {
      if (params.totalMembers === 0) {
        return 'No crew members currently assigned to your team.';
      }
      const pending = Math.max(0, params.totalMembers - params.updatesReceived);
      if (pending === 0) {
        return `All ${params.totalMembers} crew members have submitted their daily updates.`;
      }
      return `${params.updatesReceived} of ${params.totalMembers} crew members have checked in today (${pending} pending).`;
    }
    return 'The crew workspace is currently operational and up to date.';
  }

  // Member Context
  if (params.openBlockers && params.openBlockers > 0) {
    return `You have ${params.openBlockers} active blocker${params.openBlockers > 1 ? 's' : ''} flagged for Lead assistance.`;
  }
  if (params.overdueTasks && params.overdueTasks > 0) {
    return `You have ${params.overdueTasks} overdue task${params.overdueTasks > 1 ? 's' : ''} requiring immediate attention.`;
  }
  if (params.tasksDueToday && params.tasksDueToday > 0) {
    return `You have ${params.tasksDueToday} task${params.tasksDueToday > 1 ? 's' : ''} due today on your board.`;
  }
  if (params.pendingHomework && params.pendingHomework > 0) {
    return `You have ${params.pendingHomework} homework assignment${params.pendingHomework > 1 ? 's' : ''} pending submission.`;
  }
  if (params.openTasks && params.openTasks > 0) {
    return `${params.openTasks} active task${params.openTasks > 1 ? 's' : ''} are currently in progress on your board.`;
  }
  if (params.standupDone) {
    return 'Everything scheduled for today is on track. Great momentum!';
  }
  return 'Your workspace is clear. Start your day by submitting your Daily Standup.';
}

export function cleanTeamDisplayName(raw?: string | null): string {
  if (!raw || !raw.trim()) return '';
  const trimmed = raw.trim();
  const stripped = trimmed.replace(/^(JVM\s*CREW\s+)/i, '').trim();
  return stripped.length > 0 ? stripped : trimmed;
}

export function getTeamInitial(rawTeamName?: string | null): string {
  const clean = cleanTeamDisplayName(rawTeamName);
  return clean ? clean.charAt(0).toUpperCase() : 'T';
}

export function getUserInitial(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'U';
  return fullName.trim().charAt(0).toUpperCase();
}

export function normalizeSocialUrl(url?: string | null): string | null {
  if (!url || !url.trim()) return null;
  let trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:')
  ) {
    return null;
  }
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }
  if (trimmed.toLowerCase().startsWith('http://')) {
    trimmed = `https://${trimmed.substring(7)}`;
  }
  return trimmed;
}

export function sanitizeSocialUrl(url?: string | null): string | null {
  return normalizeSocialUrl(url);
}