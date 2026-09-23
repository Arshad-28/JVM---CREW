import {
  AuthUser,
  Blocker,
  CheckInTemplate,
  DsaTopicStats,
  FollowUp,
  LeadDailyBrief,
  LeadDashboard,
  LeadMessage,
  LearningTopic,
  MemberDashboard,
  Problem,
  Standup,
  SubjectProgress,
  Task,
  TaskComment,
  TaskHistoryItem,
  Homework,
  HomeworkSubmission,
  MemberDetailProgress,
  Role,
  SessionDetail,
  SessionSummary,
  PracticeQuestion,
  PracticeEvaluation,
  CodingProblem,
  CodingSolution,
  CodeReview,
  CoachChatMessage,
  MockInterviewState,
  LearningInsights,
  HistoryItem,
  WorkspaceNotification,
  NotificationPreferences,
  PushConfig,
  TeamMeeting,
  CreateTeamMeetingPayload,
  UpdateTeamMeetingPayload,
  TeamPerformanceReport,
  MemberPerformanceReport,
} from '../types';

const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;
const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const DEFAULT_PROD_URL = 'https://jvm-crew.onrender.com';

let BASE_URL = '/api';

if (rawEnvUrl && typeof rawEnvUrl === 'string' && rawEnvUrl.trim() !== '') {
  const cleaned = rawEnvUrl.trim().replace(/\/+$/, '');
  BASE_URL = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
} else if (!isLocal) {
  // Direct production routing to Render to bypass intermediate proxy timeouts
  BASE_URL = `${DEFAULT_PROD_URL}/api`;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jvmcrew_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getHeaders(): HeadersInit {
  const headers = getAuthHeaders();
  headers['Content-Type'] = 'application/json';
  return headers;
}

export type AuthStatusCallback = (statusMessage: string) => void;

export class ApiError extends Error {
  status: number;
  data?: any;
  isTransient: boolean;

  constructor(message: string, status: number = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Transient errors: network drops (0), timeouts (408), Render cold-start gateway wake-up states (502, 503, 504)
    this.isTransient = status === 0 || status === 408 || status === 502 || status === 503 || status === 504;
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const cacheStore = {
  get<T>(key: string): T | null {
    const mem = memoryCache.get(key);
    const now = Date.now();
    if (mem && now - mem.timestamp < mem.ttlMs) {
      return mem.data as T;
    }
    try {
      const stored = localStorage.getItem(`jvm_cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<T> = JSON.parse(stored);
        if (parsed && parsed.data && now - parsed.timestamp < parsed.ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {}
    return null;
  },

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    if (data === undefined || data === null) return;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };
    memoryCache.set(key, entry);
    try {
      localStorage.setItem(`jvm_cache_${key}`, JSON.stringify(entry));
    } catch {}
  },

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      memoryCache.clear();
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('jvm_cache_')) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
      return;
    }
    for (const k of Array.from(memoryCache.keys())) {
      if (k.startsWith(keyPrefix)) memoryCache.delete(k);
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`jvm_cache_${keyPrefix}`)) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};

async function fetchWithAdaptiveTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 25000,
  onStatusUpdate?: AuthStatusCallback
): Promise<Response> {
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  if (onStatusUpdate) {
    timers.push(
      setTimeout(() => {
        onStatusUpdate('Signing in...');
      }, 1500)
    );
    timers.push(
      setTimeout(() => {
        onStatusUpdate('Connecting to workspace...');
      }, 5000)
    );
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  timers.push(timeoutId);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      throw new ApiError('Sign-in request timed out while connecting to the server.', 408);
    }
    if (err?.message === 'Failed to fetch' || err?.name === 'TypeError') {
      throw new ApiError('Unable to reach the server. Please check your connection.', 0);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Network request failed', 0);
  } finally {
    timers.forEach((t) => clearTimeout(t));
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 20000
): Promise<Response> {
  return fetchWithAdaptiveTimeout(url, options, timeoutMs);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return null as unknown as T;
  }
  if (!res.ok) {
    let errorMessage = '';
    let parsedData: any = null;
    try {
      const text = await res.text();
      if (text) {
        try {
          parsedData = JSON.parse(text);
          if (parsedData.message) {
            errorMessage = parsedData.message;
          } else if (parsedData.error) {
            errorMessage = parsedData.error;
          }
        } catch {
          if (text.length < 200) {
            errorMessage = text;
          }
        }
      }
    } catch {
      // ignore text parsing error
    }

    if (!errorMessage) {
      if (res.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (res.status === 403) {
        errorMessage = 'Access denied: You do not have permission for this resource.';
      } else if (res.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (res.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (res.status >= 500) {
        errorMessage = 'Backend service is starting up or temporarily unreachable. Please retry in a moment.';
      } else {
        errorMessage = res.statusText || `Request failed with status ${res.status}`;
      }
    }
    throw new ApiError(errorMessage, res.status, parsedData);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

async function executeAuthWithRetry<T>(
  action: (onStatus?: AuthStatusCallback) => Promise<T>,
  onStatus?: AuthStatusCallback,
  maxAttempts: number = 2
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await action(onStatus);
    } catch (err: any) {
      lastError = err;

      const status = err?.status ?? (err instanceof ApiError ? err.status : 0);
      const isTransient = err?.isTransient ?? (status === 0 || status === 408 || status === 502 || status === 503 || status === 504);

      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }

      if (onStatus) {
        onStatus('Connecting to workspace...');
      }

      const delayMs = attempt === 1 ? 800 : 1500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new ApiError('Sign-in is taking longer than expected. Please try again.', 408);
}

export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const api = {
  // Non-blocking proactive warmup ping for server / DB pool pre-initialization
  warmup(): void {
    try {
      const host = BASE_URL.replace(/\/api\/?$/, '');
      const endpoints = Array.from(
        new Set([
          `${host}/health`,
          `${host}/api/health`,
          `${host}/api/readiness`,
          'https://jvm-crew.onrender.com/health',
          '/health',
          '/api/health',
        ])
      );
      endpoints.forEach((ep) => {
        fetch(ep, { method: 'GET', mode: 'cors', keepalive: true }).catch(() => {});
      });
    } catch (e) {}
  },

  // Auth
  async login(email: string, password: string, onStatus?: AuthStatusCallback): Promise<AuthUser> {
    return executeAuthWithRetry(
      async (statusCb) => {
        const res = await fetchWithAdaptiveTimeout(
          `${BASE_URL}/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          },
          25000,
          statusCb
        );
        return handleResponse<AuthUser>(res);
      },
      onStatus,
      2
    );
  },

  async register(data: { name: string; email: string; password: string; teamName?: string }, onStatus?: AuthStatusCallback): Promise<AuthUser> {
    return executeAuthWithRetry(
      async (statusCb) => {
        const res = await fetchWithAdaptiveTimeout(
          `${BASE_URL}/auth/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          },
          25000,
          statusCb
        );
        return handleResponse<AuthUser>(res);
      },
      onStatus,
      2
    );
  },

  async getCurrentUser(): Promise<AuthUser> {
    const res = await fetchWithAdaptiveTimeout(
      `${BASE_URL}/auth/me`,
      {
        headers: getHeaders(),
      },
      20000
    );
    return handleResponse<AuthUser>(res);
  },

  async updateAccount(data: {
    name: string;
    email: string;
    phoneNumber?: string;
    college?: string;
    organization?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    photoUrl?: string;
    avatarUrl?: string;
  }): Promise<AuthUser> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthUser>(res);
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Dashboards & Daily Briefs
  async getMemberDashboard(date?: string): Promise<MemberDashboard> {
    const queryDate = date || getLocalTodayDateString();
    const cacheKey = `member_dash_${queryDate}`;
    const res = await fetch(`${BASE_URL}/dashboard/member?date=${queryDate}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<MemberDashboard>(res);
    if (data) {
      cacheStore.set(cacheKey, data, 3 * 60 * 1000);
    }
    return data;
  },

  async getLeadDailyBrief(date?: string): Promise<LeadDailyBrief> {
    const queryDate = date || getLocalTodayDateString();
    const cacheKey = `lead_brief_${queryDate}`;
    const res = await fetch(`${BASE_URL}/dashboard/lead-daily-brief?date=${queryDate}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<LeadDailyBrief>(res);
    if (data) {
      cacheStore.set(cacheKey, data, 3 * 60 * 1000);
    }
    return data;
  },

  async getLeadDashboard(date?: string): Promise<LeadDashboard> {
    const queryDate = date || getLocalTodayDateString();
    const cacheKey = `lead_dash_${queryDate}`;
    const res = await fetch(`${BASE_URL}/dashboard/lead?date=${queryDate}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<LeadDashboard>(res);
    if (data) {
      cacheStore.set(cacheKey, data, 3 * 60 * 1000);
    }
    return data;
  },

  async getMemberDetailProgress(memberId: number): Promise<MemberDetailProgress> {
    const res = await fetch(`${BASE_URL}/dashboard/member/${memberId}/detail`, {
      headers: getHeaders(),
    });
    return handleResponse<MemberDetailProgress>(res);
  },

  async updateTeamMember(
    userId: number,
    data: {
      name: string;
      email: string;
      serialNumber?: string;
      role?: Role | string;
      position?: string;
      phoneNumber?: string;
      college?: string;
      organization?: string;
      bio?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      photoUrl?: string;
      avatarUrl?: string;
      teamName?: string;
    }
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/members/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Adaptive Daily Check-in & Standups
  async getCheckInTemplate(date?: string): Promise<CheckInTemplate> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/standups/checkin-template?date=${queryDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<CheckInTemplate>(res);
  },

  async getTodayStandup(date?: string): Promise<Standup | null> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/standups/today?date=${queryDate}`, {
      headers: getHeaders(),
    });
    if (res.status === 204) return null;
    return handleResponse<Standup>(res);
  },

  async getTodayLeadStandup(date?: string): Promise<Standup | null> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/standups/lead/today?date=${queryDate}`, {
      headers: getHeaders(),
    });
    if (res.status === 204) return null;
    return handleResponse<Standup>(res);
  },

  async submitStandup(data: Partial<Standup>): Promise<Standup> {
    const payload = {
      ...data,
      date: data.date || getLocalTodayDateString(),
    };
    const res = await fetch(`${BASE_URL}/standups/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await handleResponse<Standup>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    cacheStore.invalidate('standup_history');
    cacheStore.invalidate('my_team');
    return result;
  },

  async answerQuestion(standupId: number, answer: string): Promise<Standup> {
    const res = await fetch(`${BASE_URL}/standups/${standupId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answer }),
    });
    const result = await handleResponse<Standup>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async createFollowUp(userId: number, note: string, dueDate?: string): Promise<FollowUp> {
    const res = await fetch(`${BASE_URL}/standups/followups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, note, dueDate }),
    });
    const result = await handleResponse<FollowUp>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async completeFollowUp(id: number): Promise<FollowUp> {
    const res = await fetch(`${BASE_URL}/standups/followups/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const result = await handleResponse<FollowUp>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async submitVoiceStandup(formData: FormData): Promise<Standup> {
    const res = await fetchWithTimeout(`${BASE_URL}/standups/submit-voice`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    }, 60000);
    const result = await handleResponse<Standup>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    cacheStore.invalidate('standup_history');
    cacheStore.invalidate('my_team');
    return result;
  },

  async getVoiceRecordingBlobUrl(standupId: number): Promise<string> {
    const res = await fetch(`${BASE_URL}/standups/${standupId}/voice`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Recording access denied.');
      }
      if (res.status === 404) {
        throw new Error('Voice recording unavailable.');
      }
      const err = await res.json().catch(() => ({ message: 'Unable to load this recording.' }));
      throw new Error(err.message || 'Unable to load this recording.');
    }
    const blob = await res.blob();
    return window.URL.createObjectURL(blob);
  },

  async downloadVoiceRecording(standupId: number, fallbackFilename?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/standups/${standupId}/voice`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to download voice recording' }));
      throw new Error(err.message || 'Failed to download voice recording');
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = fallbackFilename || `JVM_CREW_Standup_Voice_${standupId}.webm`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getStandupById(id: number): Promise<Standup> {
    const res = await fetch(`${BASE_URL}/standups/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<Standup>(res);
  },

  async downloadStandupPdf(id: number, fallbackFilename?: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/standups/${id}/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to download standup PDF' }));
      throw new Error(err.message || 'Failed to download standup PDF');
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = fallbackFilename || `JVM_CREW_Standup_${id}.pdf`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadTeamStandupPdf(date?: string, fallbackFilename?: string): Promise<void> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/standups/team/${queryDate}/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to download team standup PDF' }));
      throw new Error(err.message || 'Failed to download team standup PDF');
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = fallbackFilename || `JVM_CREW_Team_Standup_${queryDate}.pdf`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async getTeamStandupHistory(): Promise<Standup[]> {
    const res = await fetch(`${BASE_URL}/standups/team/history`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Standup[]>(res);
  },

  async getStandupHistory(memberId?: number): Promise<Standup[]> {
    const url = memberId ? `${BASE_URL}/standups/history?memberId=${memberId}` : `${BASE_URL}/standups/history`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    const data = await handleResponse<Standup[]>(res);
    if (!memberId && data) {
      cacheStore.set('standup_history', data, 3 * 60 * 1000);
    }
    return data;
  },

  async getTeamStandupsToday(date?: string): Promise<Standup[]> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/standups/team?date=${queryDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<Standup[]>(res);
  },

  // Permanent "Ask Your Lead" Channel
  async sendLeadMessage(data: {
    message: string;
    inputMethod?: string;
    relatedTopic?: string;
    isUrgent?: boolean;
  }): Promise<LeadMessage> {
    const res = await fetch(`${BASE_URL}/lead-messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<LeadMessage>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async getMyLeadMessages(): Promise<LeadMessage[]> {
    const res = await fetch(`${BASE_URL}/lead-messages/my-messages`, {
      headers: getHeaders(),
    });
    return handleResponse<LeadMessage[]>(res);
  },

  async getTeamLeadMessages(): Promise<LeadMessage[]> {
    const res = await fetch(`${BASE_URL}/lead-messages/team`, {
      headers: getHeaders(),
    });
    return handleResponse<LeadMessage[]>(res);
  },

  async respondToLeadMessage(id: number, response: string): Promise<LeadMessage> {
    const res = await fetch(`${BASE_URL}/lead-messages/${id}/respond`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ response }),
    });
    const result = await handleResponse<LeadMessage>(res);
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  // Tasks
  async getTasks(params?: { assigneeId?: number; status?: string }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.assigneeId) query.append('assigneeId', String(params.assigneeId));
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`${BASE_URL}/tasks?${query.toString()}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<Task[]>(res);
    if (data && !params?.assigneeId && !params?.status) {
      cacheStore.set('tasks_list', data, 3 * 60 * 1000);
    }
    return data;
  },

  async getTask(id: number): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<Task>(res);
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    const result = await handleResponse<Task>(res);
    cacheStore.invalidate('tasks_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    const result = await handleResponse<Task>(res);
    cacheStore.invalidate('tasks_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async deleteTask(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete task' }));
      throw new Error(err.message || 'Failed to delete task');
    }
    cacheStore.invalidate('tasks_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
  },

  async updateTaskStatus(
    id: number,
    data: { status?: string; progressPct?: number; actualHours?: number }
  ): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Task>(res);
    cacheStore.invalidate('tasks_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
      headers: getHeaders(),
    });
    return handleResponse<TaskComment[]>(res);
  },

  async addTaskComment(taskId: number, body: string): Promise<TaskComment> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ body }),
    });
    return handleResponse<TaskComment>(res);
  },

  async getTaskHistory(taskId: number): Promise<TaskHistoryItem[]> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/history`, {
      headers: getHeaders(),
    });
    return handleResponse<TaskHistoryItem[]>(res);
  },

  async getRecentActivity(): Promise<TaskHistoryItem[]> {
    const res = await fetch(`${BASE_URL}/tasks/activity`, {
      headers: getHeaders(),
    });
    return handleResponse<TaskHistoryItem[]>(res);
  },

  // Learning & Curriculum
  async getCurriculumTree(): Promise<SubjectProgress[]> {
    const res = await fetch(`${BASE_URL}/learning/tree`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<SubjectProgress[]>(res);
    if (data) {
      cacheStore.set('curriculum_tree', data, 5 * 60 * 1000);
    }
    return data;
  },

  async updateLearningProgress(topicId: number, status: string): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topicId, status }),
    });
    const result = await handleResponse<LearningTopic>(res);
    cacheStore.invalidate('curriculum_tree');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async createCurriculumTopic(data: { subject: string; title: string; orderIndex?: number }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/topics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<LearningTopic>(res);
    cacheStore.invalidate('curriculum_tree');
    return result;
  },

  async updateCurriculumTopic(id: number, data: { subject?: string; title?: string; orderIndex?: number }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/topics/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<LearningTopic>(res);
    cacheStore.invalidate('curriculum_tree');
    return result;
  },

  async deleteCurriculumTopic(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/learning/topics/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete topic' }));
      throw new Error(err.message || 'Failed to delete topic');
    }
    cacheStore.invalidate('curriculum_tree');
  },

  async createCurriculumSubject(data: { subject: string; initialTopicTitle?: string }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<LearningTopic>(res);
    cacheStore.invalidate('curriculum_tree');
    return result;
  },

  // DSA
  async getDsaStats(): Promise<DsaTopicStats[]> {
    const res = await fetch(`${BASE_URL}/dsa/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<DsaTopicStats[]>(res);
  },

  async recordDsaAttempt(data: {
    problemId: number;
    status: string;
    timeTakenMin?: number;
  }): Promise<Problem> {
    const res = await fetch(`${BASE_URL}/dsa/attempts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Problem>(res);
  },

  // Blockers
  async getOpenBlockers(): Promise<Blocker[]> {
    const res = await fetch(`${BASE_URL}/blockers/open`, {
      headers: getHeaders(),
    });
    return handleResponse<Blocker[]>(res);
  },

  async resolveBlocker(id: number): Promise<Blocker> {
    const res = await fetch(`${BASE_URL}/blockers/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    return handleResponse<Blocker>(res);
  },

  // =========================================================================
  // HOMEWORK
  // =========================================================================
  async getHomeworkList(date?: string): Promise<Homework[]> {
    const targetDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/homework?date=${targetDate}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse<Homework[]>(res);
    if (data) {
      cacheStore.set('homework_list', data, 3 * 60 * 1000);
    }
    return data;
  },

  async getHomework(id: number, date?: string): Promise<Homework> {
    const targetDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/homework/${id}?date=${targetDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<Homework>(res);
  },

  async createHomework(data: Partial<Homework> & { publishNow?: boolean }): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Homework>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async updateHomework(id: number, data: Partial<Homework> & { publishNow?: boolean }): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<Homework>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async publishHomework(id: number): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const result = await handleResponse<Homework>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async publishHomeworkSolution(id: number, data?: { solutionText?: string; solutionAttachmentName?: string; solutionAttachmentData?: string; solutionAttachmentType?: string }): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}/solution`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    const result = await handleResponse<Homework>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async submitHomework(id: number, data: { answerText?: string; attachmentName?: string; attachmentData?: string; attachmentType?: string; notes?: string }): Promise<HomeworkSubmission> {
    const res = await fetch(`${BASE_URL}/homework/${id}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<HomeworkSubmission>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async reviewHomeworkSubmission(submissionId: number, feedback?: string): Promise<HomeworkSubmission> {
    const res = await fetch(`${BASE_URL}/homework/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ feedback: feedback || '' }),
    });
    const result = await handleResponse<HomeworkSubmission>(res);
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async remindHomeworkMember(homeworkId: number, userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/homework/${homeworkId}/remind/${userId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to remind member' }));
      throw new Error(err.message || 'Failed to remind member');
    }
  },

  async deleteHomework(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/homework/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to delete homework' }));
      throw new Error(err.message || 'Failed to delete homework');
    }
    cacheStore.invalidate('homework_list');
    cacheStore.invalidate('member_dash_');
    cacheStore.invalidate('lead_brief_');
  },

  // ==========================================
  // LEADERSHIP ROTATION & MONTHLY EVALUATIONS
  // ==========================================

  async getCurrentLead(date?: string): Promise<any> {
    const url = date ? `${BASE_URL}/leadership/current?date=${date}` : `${BASE_URL}/leadership/current`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getLeadershipHistory(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/leadership/history`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createLeadershipAssignment(data: { userId: number; startDate: string; endDate: string; notes?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/leadership/assignments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(res);
    cacheStore.invalidate('my_team');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async getMonthlyEvaluation(month?: string): Promise<any> {
    const url = month ? `${BASE_URL}/evaluations/monthly?month=${month}` : `${BASE_URL}/evaluations/monthly`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getMonthlyReport(month?: string): Promise<any> {
    const url = month ? `${BASE_URL}/reports/monthly?month=${month}` : `${BASE_URL}/reports/monthly`;
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async downloadMonthlyReportPdf(month?: string, fallbackFilename?: string): Promise<void> {
    const url = month ? `${BASE_URL}/reports/monthly/pdf?month=${month}` : `${BASE_URL}/reports/monthly/pdf`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to download monthly lecturer report PDF' }));
      throw new Error(err.message || 'Failed to download monthly lecturer report PDF');
    }

    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = fallbackFilename || `JVM_Crew_Monthly_Lecturer_Report_${month || 'current'}.pdf`;
    if (contentDisposition && contentDisposition.includes('filename=')) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  // ==========================================
  // DYNAMIC MULTI-TEAM MANAGEMENT APIS
  // ==========================================

  async getMyTeam(): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me`, { headers: getHeaders() });
    const data = await handleResponse<any>(res);
    if (data) {
      cacheStore.set('my_team', data, 5 * 60 * 1000);
    }
    return data;
  },

  async updateTeamName(customName: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/name`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ customName }),
    });
    const result = await handleResponse<any>(res);
    cacheStore.invalidate('my_team');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async addTeamMember(data: {
    userId?: number;
    email?: string;
    name?: string;
    password?: string;
    phoneNumber?: string;
    college?: string;
    organization?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    photoUrl?: string;
    avatarUrl?: string;
    serialNumber?: string;
    transferIfAssigned?: boolean;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<any>(res);
    cacheStore.invalidate('my_team');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async removeTeamMember(userId: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await handleResponse<any>(res);
    cacheStore.invalidate('my_team');
    cacheStore.invalidate('lead_brief_');
    return result;
  },

  async changeTeamLead(data: { newLeadUserId: number; startDate?: string; endDate?: string; notes?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/change-lead`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getAllTeams(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/teams`, { headers: getHeaders() });
    return handleResponse<any[]>(res);
  },

  async createTeam(data: { customName: string; cohort?: string }): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // ==========================================
  // INTERVIEW LAB API METHODS
  // ==========================================

  async createInterviewSession(data: { userInput: string; technology?: string; difficulty?: string }): Promise<SessionDetail> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<SessionDetail>(res);
  },

  async getInterviewSessions(limit: number = 10): Promise<SessionSummary[]> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions?limit=${limit}`, {
      headers: getHeaders(),
    });
    return handleResponse<SessionSummary[]>(res);
  },

  async getInterviewSession(id: number): Promise<SessionDetail> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<SessionDetail>(res);
  },

  async generatePracticeQuestions(sessionId: number): Promise<PracticeQuestion[]> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions/${sessionId}/practice/generate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<PracticeQuestion[]>(res);
  },

  async getPracticeHint(questionId: number): Promise<{ hint: string }> {
    const res = await fetch(`${BASE_URL}/interview-lab/questions/${questionId}/hint`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ hint: string }>(res);
  },

  async submitPracticeAnswer(questionId: number, answer: string): Promise<PracticeEvaluation> {
    const res = await fetch(`${BASE_URL}/interview-lab/questions/${questionId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answer }),
    });
    return handleResponse<PracticeEvaluation>(res);
  },

  async generateCodingProblem(sessionId: number): Promise<CodingProblem> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions/${sessionId}/coding/generate`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<CodingProblem>(res);
  },

  async getCodingHint(problemId: number, hintIndex: number = 1): Promise<{ hint: string; hintIndex: number; totalHints: number; hasMoreHints: boolean }> {
    const res = await fetch(`${BASE_URL}/interview-lab/coding/${problemId}/hint?hintIndex=${hintIndex}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ hint: string; hintIndex: number; totalHints: number; hasMoreHints: boolean }>(res);
  },

  async revealCodingSolution(problemId: number): Promise<CodingSolution> {
    const res = await fetch(`${BASE_URL}/interview-lab/coding/${problemId}/solution`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<CodingSolution>(res);
  },

  async reviewCode(problemId: number, code: string, language: string = 'JAVA'): Promise<CodeReview> {
    const res = await fetch(`${BASE_URL}/interview-lab/coding/${problemId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, language }),
    });
    return handleResponse<CodeReview>(res);
  },

  async askInterviewCoach(sessionId: number, message: string): Promise<CoachChatMessage> {
    const res = await fetch(`${BASE_URL}/interview-lab/sessions/${sessionId}/coach`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message }),
    });
    return handleResponse<CoachChatMessage>(res);
  },

  async startMockInterview(data: {
    technology: string;
    topic: string;
    difficulty?: string;
    interviewType?: string;
    targetQuestions?: number;
  }): Promise<MockInterviewState> {
    const res = await fetch(`${BASE_URL}/interview-lab/mock/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<MockInterviewState>(res);
  },

  async getMockInterview(id: number): Promise<MockInterviewState> {
    const res = await fetch(`${BASE_URL}/interview-lab/mock/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<MockInterviewState>(res);
  },

  async submitMockAnswer(id: number, answer: string): Promise<MockInterviewState> {
    const res = await fetch(`${BASE_URL}/interview-lab/mock/${id}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answer }),
    });
    return handleResponse<MockInterviewState>(res);
  },

  async finishMockInterview(id: number): Promise<MockInterviewState> {
    const res = await fetch(`${BASE_URL}/interview-lab/mock/${id}/finish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<MockInterviewState>(res);
  },

  async getInterviewHistory(): Promise<HistoryItem[]> {
    const res = await fetch(`${BASE_URL}/interview-lab/history`, {
      headers: getHeaders(),
    });
    return handleResponse<HistoryItem[]>(res);
  },

  async getInterviewInsights(): Promise<LearningInsights> {
    const res = await fetch(`${BASE_URL}/interview-lab/insights`, {
      headers: getHeaders(),
    });
    return handleResponse<LearningInsights>(res);
  },

  // ==========================================
  // TEAM MEETINGS & COMMUNICATION API
  // ==========================================

  async getTeamMeetings(): Promise<TeamMeeting[]> {
    const res = await fetch(`${BASE_URL}/meetings`, { headers: getHeaders() });
    const data = await handleResponse<TeamMeeting[]>(res);
    if (data) {
      cacheStore.set('team_meetings', data, 60 * 1000);
    }
    return data || [];
  },

  async getUpcomingMeeting(): Promise<TeamMeeting | null> {
    const res = await fetch(`${BASE_URL}/meetings/upcoming`, { headers: getHeaders() });
    if (res.status === 204) return null;
    return handleResponse<TeamMeeting>(res);
  },

  async createMeeting(data: CreateTeamMeetingPayload): Promise<TeamMeeting> {
    const res = await fetch(`${BASE_URL}/meetings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<TeamMeeting>(res);
    cacheStore.invalidate('team_meetings');
    return result;
  },

  async updateMeeting(id: number, data: UpdateTeamMeetingPayload): Promise<TeamMeeting> {
    const res = await fetch(`${BASE_URL}/meetings/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<TeamMeeting>(res);
    cacheStore.invalidate('team_meetings');
    return result;
  },

  async deleteMeeting(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/meetings/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse<any>(res);
    cacheStore.invalidate('team_meetings');
  },

  // ==========================================
  // NOTIFICATIONS & PUSH NOTIFICATIONS
  // ==========================================

  async getNotifications(page: number = 0, size: number = 20): Promise<{ content: WorkspaceNotification[]; totalElements: number; totalPages: number }> {
    const res = await fetch(`${BASE_URL}/notifications?page=${page}&size=${size}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ content: WorkspaceNotification[]; totalElements: number; totalPages: number }>(res);
  },

  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: getHeaders(),
    });
    return handleResponse<{ unreadCount: number }>(res);
  },

  async markNotificationAsRead(id: number): Promise<WorkspaceNotification> {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<WorkspaceNotification>(res);
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getPushConfig(): Promise<PushConfig> {
    const res = await fetch(`${BASE_URL}/notifications/push-config`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PushConfig>(res);
  },

  async registerPushSubscription(subscriptionPayload: any, userAgent?: string): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/notifications/push-subscription`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        endpoint: subscriptionPayload.endpoint,
        keys: {
          p256dh: subscriptionPayload.keys?.p256dh,
          auth: subscriptionPayload.keys?.auth,
        },
        userAgent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
      }),
    });
    return handleResponse<{ status: string }>(res);
  },

  async deletePushSubscription(endpoint: string): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/notifications/push-subscription?endpoint=${encodeURIComponent(endpoint)}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ status: string }>(res);
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const res = await fetch(`${BASE_URL}/notifications/preferences`, {
      headers: getHeaders(),
    });
    return handleResponse<NotificationPreferences>(res);
  },

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await fetch(`${BASE_URL}/notifications/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(preferences),
    });
    return handleResponse<NotificationPreferences>(res);
  },

  // ==========================================
  // TEAM PERFORMANCE INTELLIGENCE REPORT APIS
  // ==========================================
  async getTeamPerformanceReport(
    period: string = 'THIS_MONTH',
    startDate?: string,
    endDate?: string
  ): Promise<TeamPerformanceReport> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${BASE_URL}/team/performance?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<TeamPerformanceReport>(res);
  },

  async getMemberPerformanceReport(
    userId: number,
    period: string = 'THIS_MONTH',
    startDate?: string,
    endDate?: string
  ): Promise<MemberPerformanceReport> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${BASE_URL}/team/performance/member/${userId}?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<MemberPerformanceReport>(res);
  },

  async downloadTeamPerformanceReportPdf(
    period: string = 'THIS_MONTH',
    startDate?: string,
    endDate?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${BASE_URL}/team/performance/pdf?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to download report PDF' }));
      throw new Error(err.message || 'Failed to download report PDF');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EngineerSpace_Team_Performance_Report_${period}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async exportTeamPerformanceReportCsv(
    period: string = 'THIS_MONTH',
    startDate?: string,
    endDate?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${BASE_URL}/team/performance/csv?${params.toString()}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to export report CSV' }));
      throw new Error(err.message || 'Failed to export report CSV');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EngineerSpace_Team_Performance_Report_${period}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// Continuous background keepalive to prevent backend container from sleeping during active sessions
if (typeof window !== 'undefined') {
  // Proactively ping on initial script evaluation
  api.warmup();

  // Periodic heartbeat every 3.5 minutes while tab is open
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      api.warmup();
    }
  }, 3.5 * 60 * 1000);

  // Warmup immediately when user switches back to tab
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      api.warmup();
    }
  });

  // Warmup on window focus
  window.addEventListener('focus', () => {
    api.warmup();
  });
}

