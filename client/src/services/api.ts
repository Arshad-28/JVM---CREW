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
} from '../types';

const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;
let BASE_URL = '/api';

if (rawEnvUrl && typeof rawEnvUrl === 'string' && rawEnvUrl.trim() !== '') {
  const cleaned = rawEnvUrl.trim().replace(/\/+$/, '');
  BASE_URL = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      throw new Error('Server took too long to respond. If the cloud service was asleep, it is waking up now. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return null as unknown as T;
  }
  if (!res.ok) {
    let errorMessage = res.statusText || `Request failed with status ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          if (text.length < 200) {
            errorMessage = text;
          }
        }
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (null as unknown as T);
}

export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const api = {
  // Non-blocking background warmup ping for sleeping Render dynos
  warmup(): void {
    try {
      const healthUrl = BASE_URL.endsWith('/api') ? BASE_URL.replace(/\/api$/, '/health') : `${BASE_URL}/health`;
      fetch(healthUrl, { method: 'GET', mode: 'cors' }).catch(() => {});
    } catch (e) {}
  },

  // Auth
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, 60000);
    return handleResponse<AuthUser>(res);
  },

  async register(data: { name: string; email: string; password: string; teamName?: string }): Promise<AuthUser> {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }, 60000);
    return handleResponse<AuthUser>(res);
  },

  async getCurrentUser(): Promise<AuthUser> {
    const res = await fetchWithTimeout(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    }, 60000);
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
    const res = await fetch(`${BASE_URL}/dashboard/member?date=${queryDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<MemberDashboard>(res);
  },

  async getLeadDailyBrief(date?: string): Promise<LeadDailyBrief> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/dashboard/lead-daily-brief?date=${queryDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<LeadDailyBrief>(res);
  },

  async getLeadDashboard(date?: string): Promise<LeadDashboard> {
    const queryDate = date || getLocalTodayDateString();
    const res = await fetch(`${BASE_URL}/dashboard/lead?date=${queryDate}`, {
      headers: getHeaders(),
    });
    return handleResponse<LeadDashboard>(res);
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
    return handleResponse<Standup>(res);
  },

  async answerQuestion(standupId: number, answer: string): Promise<Standup> {
    const res = await fetch(`${BASE_URL}/standups/${standupId}/answer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ answer }),
    });
    return handleResponse<Standup>(res);
  },

  async createFollowUp(userId: number, note: string, dueDate?: string): Promise<FollowUp> {
    const res = await fetch(`${BASE_URL}/standups/followups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, note, dueDate }),
    });
    return handleResponse<FollowUp>(res);
  },

  async completeFollowUp(id: number): Promise<FollowUp> {
    const res = await fetch(`${BASE_URL}/standups/followups/${id}/complete`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<FollowUp>(res);
  },

  async submitVoiceStandup(formData: FormData): Promise<Standup> {
    const res = await fetchWithTimeout(`${BASE_URL}/standups/submit-voice`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    }, 60000);
    return handleResponse<Standup>(res);
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
    return handleResponse<Standup[]>(res);
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
    return handleResponse<LeadMessage>(res);
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
    return handleResponse<LeadMessage>(res);
  },

  // Tasks
  async getTasks(params?: { assigneeId?: number; status?: string }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.assigneeId) query.append('assigneeId', String(params.assigneeId));
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`${BASE_URL}/tasks?${query.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse<Task[]>(res);
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
    return handleResponse<Task>(res);
  },

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(task),
    });
    return handleResponse<Task>(res);
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
    return handleResponse<Task>(res);
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
    return handleResponse<SubjectProgress[]>(res);
  },

  async updateLearningProgress(topicId: number, status: string): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ topicId, status }),
    });
    return handleResponse<LearningTopic>(res);
  },

  async createCurriculumTopic(data: { subject: string; title: string; orderIndex?: number }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/topics`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<LearningTopic>(res);
  },

  async updateCurriculumTopic(id: number, data: { subject?: string; title?: string; orderIndex?: number }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/topics/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<LearningTopic>(res);
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
  },

  async createCurriculumSubject(data: { subject: string; initialTopicTitle?: string }): Promise<LearningTopic> {
    const res = await fetch(`${BASE_URL}/learning/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<LearningTopic>(res);
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
    return handleResponse<Homework[]>(res);
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
    return handleResponse<Homework>(res);
  },

  async updateHomework(id: number, data: Partial<Homework> & { publishNow?: boolean }): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Homework>(res);
  },

  async publishHomework(id: number): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}/publish`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<Homework>(res);
  },

  async publishHomeworkSolution(id: number, data?: { solutionText?: string; solutionAttachmentName?: string; solutionAttachmentData?: string; solutionAttachmentType?: string }): Promise<Homework> {
    const res = await fetch(`${BASE_URL}/homework/${id}/solution`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    return handleResponse<Homework>(res);
  },

  async submitHomework(id: number, data: { answerText?: string; attachmentName?: string; attachmentData?: string; attachmentType?: string; notes?: string }): Promise<HomeworkSubmission> {
    const res = await fetch(`${BASE_URL}/homework/${id}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<HomeworkSubmission>(res);
  },

  async reviewHomeworkSubmission(submissionId: number, feedback?: string): Promise<HomeworkSubmission> {
    const res = await fetch(`${BASE_URL}/homework/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ feedback: feedback || '' }),
    });
    return handleResponse<HomeworkSubmission>(res);
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
    return handleResponse<any>(res);
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
    return handleResponse<any>(res);
  },

  async updateTeamName(customName: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/name`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ customName }),
    });
    return handleResponse<any>(res);
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
    return handleResponse<any>(res);
  },

  async removeTeamMember(userId: number): Promise<any> {
    const res = await fetch(`${BASE_URL}/teams/me/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
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
};

