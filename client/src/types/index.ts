export type Role = 'ADMIN' | 'LEAD' | 'MEMBER';
export type TaskPriority = 'LOW' | 'MED' | 'HIGH';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type LearningStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type AttemptStatus = 'ATTEMPTED' | 'SOLVED';
export type BlockerStatus = 'OPEN' | 'RESOLVED';
export type BlockerPriority = 'LOW' | 'MED' | 'HIGH';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  teamId: number;
  teamName: string;
  team?: {
    id: number;
    name: string;
    displayName?: string;
  };
  serialNumber?: string;
  position?: string;
  isCurrentLead?: boolean;
  leadPeriod?: string;
  phoneNumber?: string;
  college?: string;
  organization?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  avatarUrl?: string;
  token?: string;
}

export interface ChecklistItem {
  id: string;
  type: string;
  entityId?: number;
  title: string;
  subtitle: string;
  status: string;
  completed: boolean;
  badge: string;
}

export interface Standup {
  id: number;
  userId: number;
  userName: string;
  userEmail?: string;
  teamId: number;
  date: string;
  yesterday: string;
  today: string;
  blockers: string | null;
  learned: string;
  confidence: number;
  difficulty?: string | null;
  hasBlockers?: boolean;
  blockerCategory?: string | null;
  blockerDuration?: string | null;
  needsHelp?: boolean;
  helpDescription?: string | null;
  questionForLead?: string | null;
  leadAnswer?: string | null;
  leadAnsweredAt?: string | null;
  nextStep?: string | null;
  confidenceLabel?: string | null;
  answersJson?: string | null;
  questionsJson?: string | null;
  inputMethodsJson?: string | null;
  primaryInputMethod?: string;
  isCompleted?: boolean;
  submittedAt: string;
  blockerCreated?: boolean;

  // Voice submission metadata
  submissionType?: 'TEXT' | 'VOICE' | 'TEXT_AND_VOICE';
  hasVoiceRecording?: boolean;
  audioFileName?: string | null;
  audioContentType?: string | null;
  audioFileSize?: number | null;
  audioDurationSeconds?: number | null;
  audioUrl?: string | null;
}

export interface CheckInQuestion {
  id: string;
  category: string;
  questionText: string;
  questionType: 'TEXTAREA' | 'YES_NO' | 'CONFIDENCE_TIERS' | 'SINGLE_SELECT';
  placeholder?: string;
  subtitle?: string;
  required: boolean;
  options?: string[];
  dependsOnQuestionId?: string;
  showIfValue?: string;
}

export interface CheckInTemplate {
  dayName: string;
  focusTheme: string;
  greetingSubtitle: string;
  alreadySubmitted: boolean;
  todaySubmission?: Standup | null;
  questions: CheckInQuestion[];
}

export interface LeadMessage {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  teamId: number;
  message: string;
  inputMethod: 'text' | 'voice';
  relatedTopic?: string | null;
  isUrgent: boolean;
  status: 'OPEN' | 'ANSWERED';
  leadResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

export interface AttentionItem {
  id: string;
  userId: number;
  userName: string;
  reason: string;
  type: 'BLOCKER' | 'QUESTION' | 'URGENT_MESSAGE' | 'CONFIDENCE_DROP' | 'PENDING_UPDATE';
  actionLabel: string;
  entityId?: number;
  inputMethod?: string;
}

export interface TeamSummaryRow {
  userId: number;
  name: string;
  email: string;
  role: string;
  progress: string;
  currentFocus: string;
  learningSignal: string;
  blockerStatus: string;
  hasBlocker: boolean;
  needsHelp: boolean;
  questionWaiting: boolean;
  questionText?: string | null;
  leadAnswer?: string | null;
  status: 'SUBMITTED' | 'PENDING';
  confidence?: number | null;
  confidenceLabel?: string | null;
  submittedAt?: string | null;
  standupId?: number | null;
  yesterday?: string | null;
  today?: string | null;
  learned?: string | null;
  difficulty?: string | null;
  blockers?: string | null;
  nextStep?: string | null;
  primaryInputMethod?: string;
  inputMethodsJson?: string | null;

  // Voice standup metadata
  submissionType?: 'TEXT' | 'VOICE' | 'TEXT_AND_VOICE';
  hasVoiceRecording?: boolean;
  audioDurationSeconds?: number | null;
  audioFileName?: string | null;
  audioUrl?: string | null;
}

export interface Accomplishment {
  userId: number;
  userName: string;
  title: string;
  type: string;
  completedAt: string;
}

export interface WorkingOn {
  userId: number;
  userName: string;
  focus: string;
}

export interface TeamQuestion {
  standupId: number;
  userId: number;
  userName: string;
  question: string;
  leadAnswer?: string | null;
  answered: boolean;
  inputMethod?: string;
  submittedAt: string;
  answeredAt?: string | null;
}

export interface LearningSignal {
  userId: number;
  userName: string;
  signalType: 'CONFIDENT' | 'STRUGGLING';
  concept: string;
  detail: string;
}

export interface FollowUp {
  id: number;
  userId: number;
  userName: string;
  leadId: number;
  leadName: string;
  note: string;
  status: 'PENDING' | 'COMPLETED';
  dueDate?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface RecurringIssue {
  userId: number;
  userName: string;
  issueType: 'LEARNING' | 'TECHNICAL';
  description: string;
  occurrenceCount: number;
}

export interface LeadDailyBrief {
  teamName: string;
  date: string;
  dayName: string;
  totalMembers: number;
  updatesReceived: number;
  needsAttentionCount: number;
  openBlockersCount: number;
  questionsWaitingCount: number;
  openFollowUpsCount: number;
  urgentCount: number;
  leadOpenTasksCount?: number;
  leadTasks?: Task[];
  needsAttention: AttentionItem[];
  teamSummary: TeamSummaryRow[];
  completedToday: Accomplishment[];
  currentlyWorkingOn: WorkingOn[];
  openBlockers: Blocker[];
  questionsFromTeam: TeamQuestion[];
  messagesForYou: LeadMessage[];
  learningSignals: LearningSignal[];
  followUps: FollowUp[];
  recurringIssues: RecurringIssue[];
}

export interface Blocker {
  id: number;
  standupId?: number;
  userId: number;
  userName: string;
  title: string;
  category: string;
  priority: BlockerPriority;
  description: string;
  status: BlockerStatus;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Task {
  id: number;
  teamId: number;
  title: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  progressPct: number;
  estHours?: number;
  actualHours?: number;
  createdAt: string;
  labels?: string[];
  commentsCount: number;
}

export interface TaskComment {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  body: string;
  createdAt: string;
}

export interface TaskHistoryItem {
  id: number;
  taskId: number;
  taskTitle: string;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedById?: number;
  changedByName?: string;
  changedAt: string;
}

export interface LearningTopic {
  id: number;
  subject: string;
  parentId?: number;
  title: string;
  orderIndex: number;
  status: LearningStatus;
  description?: string;
  completedAt?: string | null;
}

export interface SubjectProgress {
  subject: string;
  totalTopics: number;
  completedTopics: number;
  doneTopics: number;
  inProgressTopics: number;
  completionPct: number;
  topics: LearningTopic[];
}

export interface Problem {
  id: number;
  title: string;
  name: string;
  platform: string;
  topic: string;
  difficulty: ProblemDifficulty;
  leetcodeUrl?: string;
  description?: string;
  timeTargetMin?: number;
  userStatus: AttemptStatus | null;
  attempts: number;
  timeTakenMin?: number;
  solvedAt?: string;
}

export interface DsaTopicStats {
  topic: string;
  targetCount: number;
  solvedCount: number;
  attemptedCount: number;
  completionPct: number;
  problems: Problem[];
}

export interface FocusItem {
  id: string;
  type: 'OVERDUE_TASK' | 'TASK_DUE_TODAY' | 'HIGH_PRIORITY_TASK' | 'IN_PROGRESS_TASK' | 'HOMEWORK_DUE' | 'BLOCKER';
  entityId?: number;
  title: string;
  category: string;
  status: string;
  priority?: string;
  dueInfo: string;
  actionLabel: string;
}

export interface MemberDashboard {
  userName: string;
  serialNumber?: string;
  position?: string;
  role?: string;
  teamName: string;
  currentWeek: number;
  totalWeeks: number;
  timelinePct: number;
  openTasksCount: number;
  lifetimeCompletedTasks: number;
  completedTasksTodayCount: number;
  overdueTasksCount: number;
  tasksDueTodayCount: number;
  pendingHomeworkCount: number;
  totalHomeworkCount: number;
  openBlockersCount: number;
  curriculumProgressPct: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  teamLead?: CurrentLeadInfo | null;
  teamLeadStandup?: Standup | null;
  standupDoneToday: boolean;
  checkInInProgress: boolean;
  todayStandup?: Standup;
  focusItems?: FocusItem[];
  myTasks?: Task[];
  myBlockers?: Blocker[];
  todayChecklist: ChecklistItem[];
  leadFollowUps?: FollowUp[];
  directMessages?: LeadMessage[];
}

export interface AttentionItem {
  userId: number;
  memberName: string;
  memberEmail: string;
  issueType: 'PENDING_STANDUP' | 'OPEN_BLOCKER' | 'PENDING_HOMEWORK' | 'OVERDUE_TASK';
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TeamDayProgress {
  date: string;
  dayLabel: string;
  standupsCount: number;
  tasksCompletedCount: number;
  homeworkSubmittedCount: number;
}

export interface MemberRosterItem {
  userId: number;
  name: string;
  email: string;
  role: Role;
  serialNumber?: string;
  position?: string;
  teamName?: string;
  status: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK';
  statusReason: string;
  overallProgressPct: number;

  taskCompletionPct: number;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
  inProgressTasks: number;
  activeTaskTitle?: string | null;

  standupSubmittedToday: boolean;
  standupConfidence?: number | null;
  standupConfidenceLabel?: string | null;

  curriculumCompletedTopics: number;
  curriculumTotalTopics: number;
  curriculumProgressPct: number;
  currentLearningSubject: string;
  currentTopicTitle: string;

  homeworkSubmittedCount: number;
  homeworkTotalCount: number;
  homeworkPendingCount: number;
  latestHomeworkTitle?: string | null;
  latestHomeworkStatus?: string | null;

  openBlockersCount: number;
}

export interface MemberTopicItem {
  topicId: number;
  subject: string;
  title: string;
  orderIndex: number;
  status: 'DONE' | 'IN_PROGRESS' | 'NOT_STARTED';
  completedAt?: string | null;
}

export interface MemberHomeworkSummaryItem {
  homeworkId: number;
  title: string;
  subject: string;
  dueDate: string;
  submissionStatus: 'SUBMITTED' | 'REVIEWED' | 'PENDING';
  submittedAt?: string | null;
  feedback?: string | null;
}

export interface MemberActivityPoint {
  type: 'STANDUP' | 'TASK' | 'HOMEWORK';
  title: string;
  description: string;
  timestamp: string;
  standupId?: number;
  submissionType?: 'TEXT' | 'VOICE' | 'HYBRID';
  hasVoiceRecording?: boolean;
  audioDurationSeconds?: number;
  audioUrl?: string;
}

export interface MemberDetailProgress {
  userId: number;
  name: string;
  email: string;
  role: Role;
  teamName: string;
  status: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'AT_RISK';
  statusReason: string;
  overallProgressPct: number;

  currentCurriculumTopic: string;
  currentTask: string;
  currentHomework: string;
  currentFocus: string;

  curriculumCompletedCount: number;
  curriculumTotalCount: number;
  curriculumProgressPct: number;
  curriculumTopics: MemberTopicItem[];

  tasksCompletedCount: number;
  tasksInProgressCount: number;
  tasksPendingCount: number;
  tasksOverdueCount: number;
  taskList: Task[];

  homeworkSubmittedCount: number;
  homeworkPendingCount: number;
  homeworkReviewedCount: number;
  homeworkList: MemberHomeworkSummaryItem[];

  standupSubmittedToday: boolean;
  todayStandup?: Standup | null;
  recentStandupHistory: Standup[];

  openBlockers: Blocker[];
  activityPoints: MemberActivityPoint[];
}

export interface LeadDashboard {
  teamName: string;
  totalMembers: number;
  activeTodayCount: number;
  standupsSubmittedToday: number;
  standupRatePct: number;

  tasksCompleted: number;
  totalTasks: number;
  teamTaskCompletionPct: number;

  homeworkSubmittedCount: number;
  totalHomework: number;

  openBlockersCount: number;
  curriculumProgressPct: number;
  attendancePct: number;

  needsAttention: AttentionItem[];
  memberRoster: MemberRosterItem[];
  teamProgressTrend: TeamDayProgress[];
  openBlockers: Blocker[];
  recentActivity: TaskHistoryItem[];
}

export interface MemberHomeworkStatus {
  userId: number;
  name: string;
  email: string;
  status: 'Pending' | 'Submitted' | 'Reviewed' | 'Overdue';
  isSubmitted: boolean;
  isReviewed: boolean;
  submittedAt?: string | null;
  submissionId?: number | null;
  answerText?: string | null;
  attachmentName?: string | null;
  attachmentData?: string | null;
  attachmentType?: string | null;
  notes?: string | null;
  leadFeedback?: string | null;
  isReminded?: boolean;
}

export interface HomeworkSubmission {
  id: number;
  homeworkId: number;
  userId: number;
  userName: string;
  userEmail?: string;
  answerText?: string | null;
  attachmentName?: string | null;
  attachmentData?: string | null;
  attachmentType?: string | null;
  notes?: string | null;
  status: 'SUBMITTED' | 'REVIEWED';
  leadFeedback?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
}

export interface Homework {
  id: number;
  teamId: number;
  teamName: string;
  creatorId: number;
  creatorName: string;
  title: string;
  subjectTopic: string;
  questions: string[];
  instructions?: string | null;
  dueDate: string;
  isOverdue: boolean;
  attachmentName?: string | null;
  attachmentData?: string | null;
  attachmentType?: string | null;
  solutionText?: string | null;
  solutionAttachmentName?: string | null;
  solutionAttachmentData?: string | null;
  solutionAttachmentType?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  isSolutionPublished: boolean;
  solutionPublishedAt?: string | null;
  createdAt: string;

  totalMembers?: number;
  submittedCount?: number;
  reviewedCount?: number;
  pendingCount?: number;

  mySubmission?: HomeworkSubmission | null;
  myStatus?: 'Pending' | 'Submitted' | 'Reviewed' | 'Overdue';
  isReminded?: boolean;

  memberSubmissions?: MemberHomeworkStatus[];
}

export interface LeadershipAssignment {
  id: number;
  teamId: number;
  teamName: string;
  userId: number;
  userName: string;
  userEmail: string;
  serialNumber: string;
  position: string;
  startDate: string;
  endDate: string;
  monthLabel: string;
  notes?: string;
  status: string;
  isCurrent: boolean;
}

export interface CurrentLeadInfo {
  userId: number;
  name: string;
  email: string;
  position: string;
  serialNumber: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  monthName: string;
  isUserCurrentLead: boolean;
  phoneNumber?: string;
  college?: string;
  organization?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface MonthlyEvaluation {
  month: string;
  monthLabel: string;
  teamId: number;
  teamName: string;
  leadInfo: CurrentLeadInfo | null;
  personalPerformance: {
    userId: number;
    name: string;
    email: string;
    position: string;
    serialNumber: string;
    wasLeadThisMonth: boolean;
    tasksAssigned: number;
    tasksCompleted: number;
    tasksOverdue: number;
    taskCompletionPct: number;
    homeworkAssigned: number;
    homeworkSubmitted: number;
    homeworkReviewed: number;
    standupDaysExpected: number;
    standupsSubmitted: number;
    voiceStandupsSubmitted: number;
    standupConsistencyPct: number;
    blockersReported: number;
    blockersResolved: number;
    performanceRating: string;
  } | null;
  leadershipPerformance: {
    leadUserId: number;
    leadName: string;
    periodLabel: string;
    tasksCreatedForTeam: number;
    tasksReviewed: number;
    tasksApproved: number;
    homeworkCreated: number;
    homeworkReviewed: number;
    memberStandupsMonitored: number;
    totalExpectedMemberStandups: number;
    cohortStandupSubmissionPct: number;
    blockersTriaged: number;
    followUpsIssued: number;
    teamQuestionsAnswered: number;
    cohortOverallCompletionPct: number;
    leadershipRating: string;
  } | null;
  cohortSummaries: Array<{
    userId: number;
    name: string;
    position: string;
    serialNumber: string;
    roleInMonth: string;
    tasksCompleted: number;
    tasksTotal: number;
    homeworkSubmitted: number;
    homeworkTotal: number;
    standupsSubmitted: number;
    progressPct: number;
  }>;
}

// ==========================================
// DYNAMIC MULTI-TEAM MANAGEMENT TYPES
// ==========================================

export interface TeamMemberSummary {
  membershipId: number;
  userId: number;
  name: string;
  email: string;
  serialNumber: string;
  position: string;
  role: 'LEAD' | 'MEMBER';
  isCurrentLead: boolean;
  joinedAt: string;
  isActive: boolean;
  phoneNumber?: string;
  college?: string;
  organization?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  avatarUrl?: string;
}

export interface TeamManagementInfo {
  id: number;
  parentBrand: string;
  customName: string;
  displayName: string;
  cohort: string;
  isActive: boolean;
  createdAt: string;
  currentLead: CurrentLeadInfo | null;
  members: TeamMemberSummary[];
  memberCount: number;
  isUserAuthorizedToManage: boolean;
}

export interface OrganizationTeamSummary {
  id: number;
  parentBrand: string;
  customName: string;
  displayName: string;
  cohort: string;
  memberCount: number;
  currentLeadUserId?: number;
  currentLeadName?: string;
  currentLeadEmail?: string;
  currentLeadPeriod?: string;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// INTERVIEW LAB TYPES
// ==========================================

export type InterviewDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'INTERVIEW';
export type PracticeQuestionType = 'MCQ' | 'CONCEPTUAL' | 'SHORT_ANSWER' | 'OUTPUT_PREDICTION' | 'DEBUGGING' | 'CODE_COMPLETION' | 'SCENARIO' | 'INTERVIEW_STYLE';
export type MockInterviewType = 'TECHNICAL' | 'CODING' | 'CONCEPTUAL' | 'MIXED';
export type MockInterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CodeExample {
  title: string;
  code: string;
  explanation: string;
  language: string;
}

export interface PracticeEvaluation {
  attemptId: number;
  questionId: number;
  answerText: string;
  score: number; // 0-10
  whatYouGotRight: string;
  whatIsMissing: string;
  technicalCorrection: string;
  betterInterviewAnswer: string;
  interviewTip: string;
  createdAt: string;
}

export interface PracticeQuestion {
  id: number;
  sessionId: number;
  questionText: string;
  questionType: PracticeQuestionType;
  difficulty: InterviewDifficulty;
  options?: string[];
  hint?: string;
  sampleAnswer?: string;
  explanation?: string;
  sequenceOrder: number;
  createdAt: string;
  latestAttempt?: PracticeEvaluation | null;
}

export interface CodingExample {
  input: string;
  output: string;
  explanation: string;
}

export interface CodeReview {
  attemptId: number;
  problemId: number;
  score: number;
  status: string;
  summary: string;
  correctnessAnalysis: string;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  suggestedImprovements: string[];
  optimizedSolution?: string;
  createdAt: string;
}

export interface CodingSolution {
  code: string;
  explanation: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  syntaxNotes?: string;
  whyItWorks?: string;
  exampleWalkthrough?: string;
  edgeCases?: string[];
}

export interface CodingProblem {
  id: number;
  sessionId: number;
  title: string;
  problemStatement: string;
  difficulty: InterviewDifficulty;
  questionType?: 'PROGRAM' | 'METHOD';
  language?: string;
  examples: CodingExample[];
  constraints: string[];
  starterCode?: string;
  hint?: string;
  hints?: string[];
  solution?: CodingSolution | null;
  createdAt: string;
  latestAttempt?: CodeReview | null;
}

export interface CoachChatMessage {
  id: number;
  role: 'USER' | 'COACH';
  content: string;
  createdAt: string;
}

export interface SessionDetail {
  id: number;
  topic: string;
  technology: string;
  userInput: string;
  difficulty: InterviewDifficulty;
  summary: string;
  keyConcepts: string[];
  examples: CodeExample[];
  commonMistakes: string[];
  interviewRelevance: string;
  createdAt: string;
  completedAt?: string | null;
  practiceQuestions: PracticeQuestion[];
  codingProblems: CodingProblem[];
  coachMessages: CoachChatMessage[];
}

export interface SessionSummary {
  id: number;
  topic: string;
  technology: string;
  userInput: string;
  difficulty: InterviewDifficulty;
  summary: string;
  createdAt: string;
  completedAt?: string | null;
  practiceQuestionsCount: number;
  codingProblemsCount: number;
}

export interface MockAnswer {
  id: number;
  mockQuestionId: number;
  answerText: string;
  score: number;
  evaluationSummary: string;
  technicalFeedback: string;
  betterResponse: string;
  createdAt: string;
}

export interface MockQuestion {
  id: number;
  sequenceNumber: number;
  questionText: string;
  category?: string;
  difficulty: InterviewDifficulty;
  createdAt: string;
  answer?: MockAnswer | null;
}

export interface MockInterviewReport {
  overallScore: number;
  readinessLevel: string;
  executiveSummary: string;
  rubricScores: Record<string, number>;
  strongAreas: string[];
  weakAreas: string[];
  questionsStruggledWith: string[];
  whatToRevise: string[];
  recommendedNextTopic: string;
}

export interface MockInterviewState {
  id: number;
  technology: string;
  topic: string;
  difficulty: InterviewDifficulty;
  interviewType: MockInterviewType;
  status: MockInterviewStatus;
  targetQuestions: number;
  currentQuestionIndex: number;
  overallScore?: number | null;
  performanceRating?: string | null;
  startedAt: string;
  completedAt?: string | null;
  currentQuestion?: MockQuestion | null;
  questions: MockQuestion[];
  report?: MockInterviewReport | null;
}


export interface UserWeakness {
  id: number;
  topic: string;
  weakConcept: string;
  totalAttempts: number;
  averageScore: number;
  performanceRating: 'CRITICAL' | 'WEAK' | 'MODERATE' | 'STRONG';
  lastAttemptedAt: string;
}

export interface UserRecommendation {
  suggestedTopic: string;
  technology: string;
  reason: string;
  actionPrompt: string;
}

export interface LearningInsights {
  totalSessionsCount: number;
  totalPracticeQuestionsAttempted: number;
  totalMockInterviewsCompleted: number;
  overallPracticeAverage?: number | null;
  overallMockAverage?: number | null;
  weakAreas: UserWeakness[];
  recommendation?: UserRecommendation | null;
}

export interface HistoryItem {
  id: number;
  type: 'LEARNING_SESSION' | 'MOCK_INTERVIEW';
  topic: string;
  technology: string;
  difficulty: string;
  score?: number | null;
  status?: string;
  timestamp: string;
}

// ==========================================
// PUSH & NOTIFICATION SYSTEM TYPES
// ==========================================

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'TASK_SUBMITTED'
  | 'TASK_APPROVED'
  | 'TASK_CHANGES_REQUESTED'
  | 'HOMEWORK_PUBLISHED'
  | 'HOMEWORK_DEADLINE_CHANGED'
  | 'HOMEWORK_REVIEWED'
  | 'HOMEWORK_SOLUTION_PUBLISHED'
  | 'STANDUP_SUBMITTED'
  | 'STANDUP_ANSWERED'
  | 'STANDUP_REMINDER'
  | 'TEAM_UPDATE';

export interface WorkspaceNotification {
  id: number;
  recipientUserId: number;
  teamId: number;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: number;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  taskAssigned: boolean;
  taskReviews: boolean;
  homeworkPublished: boolean;
  homeworkReviews: boolean;
  standupReminders: boolean;
  teamUpdates: boolean;
}

export interface PushConfig {
  vapidPublicKey: string;
  pushEnabled: boolean;
}

// ==========================================
// TEAM MEETINGS & COMMUNICATION TYPES
// ==========================================

export type MeetingPlatform = 'GOOGLE_MEET' | 'ZOOM' | 'MS_TEAMS' | 'OTHER';

export interface TeamMeeting {
  id: number;
  teamId: number;
  teamName: string;
  createdById?: number;
  createdByName?: string;
  title: string;
  platform: MeetingPlatform;
  meetingUrl: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isUpcoming?: boolean;
}

export interface CreateTeamMeetingPayload {
  title: string;
  platform: MeetingPlatform;
  meetingUrl: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  description?: string;
}

export interface UpdateTeamMeetingPayload {
  title?: string;
  platform?: MeetingPlatform;
  meetingUrl?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  isActive?: boolean;
}

// ==========================================
// TEAM PERFORMANCE INTELLIGENCE REPORT TYPES
// ==========================================

export type ReportPeriodType = 'DAY' | 'YESTERDAY' | 'WEEK' | 'LAST_WEEK' | 'MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface ExecutiveSummary {
  totalActiveMembers: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  totalTasksInProgress: number;
  totalTasksReview: number;
  totalTasksBlocked: number;
  totalTasksOverdue: number;
  taskCompletionRatePct: number;
  totalHomeworkAssigned: number;
  totalHomeworkSubmitted: number;
  totalHomeworkReviewed: number;
  homeworkSubmissionRatePct: number;
  totalStandupsExpected: number;
  totalStandupsSubmitted: number;
  standupComplianceRatePct: number;
  curriculumTopicsCompleted: number;
  teamMeetingsConducted: number;
  interviewLabSessionsConducted: number;
  totalActiveBlockers: number;
  executiveSummaryText: string;
}

export interface TeamHealth {
  taskExecutionPct: number;
  taskExecutionFormula: string;
  standupParticipationPct: number;
  standupParticipationFormula: string;
  homeworkSubmissionPct: number;
  homeworkSubmissionFormula: string;
  reviewQueueCount: number;
  reviewQueueStatus: string;
  activeBlockersCount: number;
  activeBlockersStatus: string;
  membersActiveCount: number;
  totalEnrolledMembers: number;
  activeParticipationFormula: string;
  healthSummary: string;
}

export interface WorkflowPipeline {
  backlogCount: number;
  todoCount: number;
  inProgressCount: number;
  blockedCount: number;
  reviewCount: number;
  doneCount: number;
  totalCount: number;
  backlogPct: number;
  todoPct: number;
  inProgressPct: number;
  blockedPct: number;
  reviewPct: number;
  donePct: number;
}

export interface DailyActivityItem {
  date: string;
  dayOfWeek: string;
  dayLabel: string;
  isWorkday: boolean;
  isToday: boolean;
  tasksCompleted: number;
  tasksAssigned: number;
  standupsSubmitted: number;
  standupsExpected: number;
  homeworkSubmitted: number;
  interviewSessions: number;
  meetingsConducted: number;
  activeBlockersReported: number;
  hasActivity: boolean;
}

export interface WeeklyTrend {
  weekLabel: string;
  startDate: string;
  endDate: string;
  tasksCompleted: number;
  tasksAssigned: number;
  standupsSubmitted: number;
  homeworkSubmitted: number;
  interviewSessions: number;
  activeMembers: number;
}

export interface PeriodComparison {
  metricName: string;
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange?: number | null;
  changeDirection: 'INCREASED' | 'DECREASED' | 'UNCHANGED' | 'NOT_APPLICABLE';
  unit: string;
  explanation: string;
}

export interface BlockerItem {
  id: number;
  userId: number;
  memberName: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: string;
  resolvedAt?: string;
  daysOpen: number;
}

export interface BlockerAnalysis {
  totalActiveBlockers: number;
  totalResolvedBlockers: number;
  uniqueMembersAffected: number;
  activeBlockersList: BlockerItem[];
  resolvedBlockersList: BlockerItem[];
  statusSummary: string;
}

export interface HomeworkAnalysisItem {
  id: number;
  title: string;
  subjectTopic: string;
  dueDate: string;
  isPublished: boolean;
  assignedMembersCount: number;
  submittedCount: number;
  reviewedCount: number;
  pendingCount: number;
  submissionRatePct: number;
}

export interface HomeworkAnalysis {
  totalAssignments: number;
  totalExpectedSubmissions: number;
  totalActualSubmissions: number;
  totalReviewedSubmissions: number;
  totalPendingReviews: number;
  submissionRatePct: number;
  reviewRatePct: number;
  assignments: HomeworkAnalysisItem[];
}

export interface CurriculumTopicProgress {
  topicId: number;
  subject: string;
  title: string;
  membersCompleted: number;
  membersInProgress: number;
  lastActivityAt?: string;
}

export interface CurriculumAnalysis {
  dataAvailable: boolean;
  statusMessage: string;
  totalTopicsAvailable: number;
  topicsCompletedInPeriod: number;
  topicsActiveInPeriod: number;
  uniqueMembersParticipating: number;
  topicProgress: CurriculumTopicProgress[];
}

export interface MemberStandupSummary {
  userId: number;
  name: string;
  expected: number;
  submitted: number;
  missed: number;
  compliancePct: number;
  streakDays: number;
  avgConfidence?: number | null;
}

export interface StandupAnalysis {
  totalEligibleWorkdays: number;
  totalExpectedSubmissions: number;
  totalActualSubmissions: number;
  participationRatePct: number;
  textSubmissionsCount: number;
  voiceSubmissionsCount: number;
  uniqueMembersReportingBlockers: number;
  averageConfidenceScore?: number | null;
  confidenceLevel1Count: number;
  confidenceLevel2Count: number;
  confidenceLevel3Count: number;
  confidenceLevel4Count: number;
  confidenceLevel5Count: number;
  memberStandupRates: MemberStandupSummary[];
}

export interface MeetingSummaryItem {
  id: number;
  title: string;
  platform: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string | null;
  createdByName: string;
  isUpcoming: boolean;
}

export interface TeamMeetingsAnalysis {
  totalMeetingsScheduled: number;
  totalMeetingsConducted: number;
  upcomingMeetingsCount: number;
  meetingsList: MeetingSummaryItem[];
}

export interface MemberLabActivity {
  userId: number;
  memberName: string;
  sessionsCount: number;
  practiceAttempts: number;
  codingAttempts: number;
  mockInterviews: number;
  avgScore?: number | null;
}

export interface InterviewLabAnalytics {
  activityRecorded: boolean;
  statusMessage: string;
  totalLearningSessions: number;
  totalPracticeQuestionsAttempted: number;
  totalCodingProblemsAttempted: number;
  totalMockInterviewsCompleted: number;
  averageMockScore?: number | null;
  uniqueMembersActive: number;
  memberLabActivity: MemberLabActivity[];
}

export interface DataDerivedInsight {
  category: 'WHAT_HAPPENED' | 'WHAT_IS_HAPPENING' | 'WHAT_IS_CHANGING' | 'WHAT_NEEDS_ATTENTION';
  title: string;
  insightText: string;
  metricReference: string;
  supportingData: string;
}

export interface AttentionAreaItem {
  type: string;
  severity: string;
  title: string;
  description: string;
  entityType?: string;
  entityId?: number;
  memberName?: string;
  memberUserId?: number;
  actionPrompt?: string;
}

export interface NotableAchievement {
  category: string;
  title: string;
  description: string;
  memberName?: string;
  timestamp?: string;
}

export interface MemberPerformanceSummary {
  userId: number;
  name: string;
  email: string;
  position: string;
  serialNumber: string;
  role: string;
  isCurrentLead: boolean;
  avatarUrl?: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksReview: number;
  tasksBlocked: number;
  tasksOverdue: number;
  taskCompletionPct: number;
  homeworkAssigned: number;
  homeworkSubmitted: number;
  homeworkReviewed: number;
  homeworkPending: number;
  homeworkSubmissionPct: number;
  standupsExpected: number;
  standupsSubmitted: number;
  standupConsistencyPct: number;
  streakDays: number;
  curriculumCompleted: number;
  interviewSessionsCount: number;
  lastRecordedActivity?: string;
  lastRecordedActivityAt?: string;
  activeWorkloadCount: number;
  workloadStatus: string;
  factualSummary: string;
}

export interface MemberTimelineEvent {
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
  entityId?: string;
  statusBadge: string;
}

export interface ReportMethodology {
  databaseEngine: string;
  reportingSystem: string;
  statementOfFact: string;
  dataSources: string[];
  calculationRules: string[];
}

export interface TeamPerformanceReport {
  reportId: string;
  periodType: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  teamId: number;
  teamName: string;
  teamCohort: string;
  currentLeadName: string;
  currentLeadEmail: string;
  currentLeadSerialNumber: string;
  executiveSummary: ExecutiveSummary;
  teamHealth: TeamHealth;
  workflowPipeline: WorkflowPipeline;
  dailyActivity: DailyActivityItem[];
  weeklyTrends: WeeklyTrend[];
  periodComparisons: PeriodComparison[];
  memberSummaries: MemberPerformanceSummary[];
  blockerAnalysis: BlockerAnalysis;
  homeworkAnalysis: HomeworkAnalysis;
  curriculumAnalysis: CurriculumAnalysis;
  standupAnalysis: StandupAnalysis;
  meetingAnalysis: TeamMeetingsAnalysis;
  interviewLabAnalytics: InterviewLabAnalytics;
  insights: DataDerivedInsight[];
  attentionAreas: AttentionAreaItem[];
  notableAchievements: NotableAchievement[];
  methodology: ReportMethodology;
  hasSufficientData: boolean;
  emptyDataMessage?: string;
}

export interface MemberPerformanceReport {
  reportId: string;
  userId: number;
  name: string;
  email: string;
  position: string;
  serialNumber: string;
  role: string;
  isCurrentLead: boolean;
  teamName: string;
  teamId: number;
  avatarUrl?: string;
  photoUrl?: string;
  bio?: string;
  college?: string;
  organization?: string;
  joinedAt?: string;
  periodType: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksReview: number;
  tasksBlocked: number;
  tasksOverdue: number;
  taskCompletionPct: number;
  homeworkAssigned: number;
  homeworkSubmitted: number;
  homeworkReviewed: number;
  homeworkPending: number;
  homeworkOverdue: number;
  homeworkSubmissionPct: number;
  standupsExpected: number;
  standupsSubmitted: number;
  standupConsistencyPct: number;
  currentStreakDays: number;
  averageConfidence?: number | null;
  curriculumTopicsCompleted: number;
  curriculumTopicsActive: number;
  lastLearningActivityAt?: string;
  interviewSessionsCount: number;
  practiceQuestionsAttempted: number;
  codingProblemsSolved: number;
  mockInterviewsCompleted: number;
  averageMockScore?: number | null;
  activeWorkloadCount: number;
  teamMedianWorkload: number;
  workloadStatusMessage: string;
  activityTimeline: MemberTimelineEvent[];
  memberInsights: DataDerivedInsight[];
  memberAttentionAreas: AttentionAreaItem[];
  hasSufficientData: boolean;
  emptyDataMessage?: string;
}

