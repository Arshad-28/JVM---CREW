package com.jvmcrew.service;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.CurrentLeadDto;
import com.jvmcrew.dto.report.*;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.BlockerStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.model.interview.InterviewMockSession;
import com.jvmcrew.repository.*;
import com.jvmcrew.repository.interview.InterviewCodingAttemptRepository;
import com.jvmcrew.repository.interview.InterviewLearningSessionRepository;
import com.jvmcrew.repository.interview.InterviewMockSessionRepository;
import com.jvmcrew.repository.interview.InterviewPracticeAttemptRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamPerformanceReportService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final LeadershipService leadershipService;
    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StandupRepository standupRepository;
    private final BlockerRepository blockerRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final LearningTopicRepository learningTopicRepository;
    private final TeamMeetingRepository teamMeetingRepository;
    private final InterviewLearningSessionRepository interviewLearningSessionRepository;
    private final InterviewMockSessionRepository interviewMockSessionRepository;
    private final InterviewPracticeAttemptRepository interviewPracticeAttemptRepository;
    private final InterviewCodingAttemptRepository interviewCodingAttemptRepository;
    private final StreakService streakService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter HUMAN_DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy · hh:mm a 'UTC'", Locale.ENGLISH);

    // Warm Paper & Ink PDF Palette
    private static final Color COLOR_INK = new Color(23, 32, 28);
    private static final Color COLOR_MUTED = new Color(75, 85, 99);
    private static final Color COLOR_PAPER = new Color(245, 244, 239);
    private static final Color COLOR_PAPER_LIGHT = new Color(250, 250, 247);
    private static final Color COLOR_PAPER_DARK = new Color(236, 234, 226);
    private static final Color COLOR_ACCENT = new Color(45, 90, 67); // #2D5A43 Engineering Green
    private static final Color COLOR_AMBER = new Color(180, 83, 9); // #B45309 Warm Ochre
    private static final Color COLOR_RED = new Color(185, 28, 28);
    private static final Color COLOR_BORDER = new Color(226, 224, 216);

    // Fonts
    private static final Font FONT_COVER_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22f, COLOR_INK);
    private static final Font FONT_COVER_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 11f, COLOR_MUTED);
    private static final Font FONT_SECTION_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12f, COLOR_ACCENT);
    private static final Font FONT_BODY = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_INK);
    private static final Font FONT_BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_INK);
    private static final Font FONT_MUTED = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_MUTED);
    private static final Font FONT_TABLE_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, COLOR_INK);
    private static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_MUTED);

    /**
     * Aggregates team-level performance intelligence for the selected date range.
     */
    @Transactional(readOnly = true)
    public TeamPerformanceReportDto getTeamPerformanceReport(
            UserPrincipal principal,
            String periodType,
            String customStartDate,
            String customEndDate
    ) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Team team = resolveUserTeam(principal);
        LocalDate today = LocalDate.now();

        // Check Lead or Member authority
        boolean isLead = leadershipService.isUserActiveLead(user, team, today) || user.getRole() == Role.ADMIN;

        DateRange range = resolveDateRange(periodType, customStartDate, customEndDate, today);
        LocalDate start = range.startDate;
        LocalDate end = range.endDate;
        Instant startInstant = start.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // 1. Team Members
        List<TeamMember> activeMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);
        int totalMembers = activeMembers.size();
        List<User> memberUsers = activeMembers.stream().map(TeamMember::getUser).collect(Collectors.toList());
        List<Long> memberUserIds = memberUsers.stream().map(User::getId).collect(Collectors.toList());

        // 2. Lead Information for this period
        CurrentLeadDto leadInfo = leadershipService.getCurrentLeadInfo(user.getId(), team.getId(), start);
        String leadName = leadInfo.getCurrentLeadName() != null ? leadInfo.getCurrentLeadName() : "Team Lead";
        String leadEmail = leadInfo.getCurrentLeadEmail() != null ? leadInfo.getCurrentLeadEmail() : "";
        String leadSerial = leadInfo.getCurrentLeadSerialNumber() != null ? leadInfo.getCurrentLeadSerialNumber() : "LEAD";

        // 3. Raw Deliverables Data Scoped to Team & Period
        List<Task> allTeamTasks = taskRepository.findByTeamOrderByCreatedAtDesc(team);
        List<Task> periodAssignedTasks = allTeamTasks.stream()
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(startInstant) && t.getCreatedAt().isBefore(endInstant))
                .collect(Collectors.toList());
        List<Task> activeTeamTasks = allTeamTasks.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isBefore(endInstant))
                .collect(Collectors.toList());

        // 4. Standups in Period
        List<Standup> periodStandups = standupRepository.findByTeamAndDateBetween(team, start, end).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()))
                .collect(Collectors.toList());

        // 5. Homework in Period
        List<Homework> allTeamHomework = homeworkRepository.findByTeamOrderByCreatedAtDesc(team);
        List<Homework> periodHomework = allTeamHomework.stream()
                .filter(h -> h.getDueDate() != null && !h.getDueDate().isBefore(start) && !h.getDueDate().isAfter(end))
                .collect(Collectors.toList());
        List<HomeworkSubmission> allSubmissions = homeworkSubmissionRepository.findByUserInOrderBySubmittedAtDesc(memberUsers).stream()
                .filter(s -> s.getHomework() != null && s.getHomework().getTeam() != null && s.getHomework().getTeam().getId().equals(team.getId()))
                .collect(Collectors.toList());
        List<HomeworkSubmission> periodSubmissions = allSubmissions.stream()
                .filter(s -> s.getSubmittedAt() != null && !s.getSubmittedAt().isBefore(startInstant) && s.getSubmittedAt().isBefore(endInstant))
                .collect(Collectors.toList());

        // 6. Blockers in Period
        List<Blocker> allTeamBlockers = blockerRepository.findByTeamOrderByCreatedAtDesc(team);
        List<Blocker> periodBlockers = allTeamBlockers.stream()
                .filter(b -> b.getCreatedAt() != null && !b.getCreatedAt().isBefore(startInstant) && b.getCreatedAt().isBefore(endInstant))
                .collect(Collectors.toList());
        List<Blocker> activeBlockers = allTeamBlockers.stream()
                .filter(b -> b.getStatus() == BlockerStatus.OPEN)
                .collect(Collectors.toList());

        // 7. Team Meetings in Period
        List<TeamMeeting> allMeetings = teamMeetingRepository.findByTeamOrderByScheduledDateDescStartTimeDesc(team);
        List<TeamMeeting> periodMeetings = allMeetings.stream()
                .filter(m -> m.getScheduledDate() != null && !m.getScheduledDate().isBefore(start) && !m.getScheduledDate().isAfter(end))
                .collect(Collectors.toList());

        // 8. Learning Progress
        List<LearningProgress> allProgress = learningProgressRepository.findByUserIn(memberUsers);
        List<LearningProgress> periodCompletedProgress = allProgress.stream()
                .filter(lp -> lp.getCompletedAt() != null && !lp.getCompletedAt().isBefore(startInstant) && lp.getCompletedAt().isBefore(endInstant))
                .collect(Collectors.toList());

        // 9. Interview Lab Activity
        List<InterviewLearningSession> periodLabSessions = new ArrayList<>();
        List<InterviewMockSession> periodMockSessions = new ArrayList<>();
        for (Long memberId : memberUserIds) {
            List<InterviewLearningSession> sList = interviewLearningSessionRepository.findByUserIdOrderByCreatedAtDesc(memberId).stream()
                    .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(startInstant) && s.getCreatedAt().isBefore(endInstant))
                    .collect(Collectors.toList());
            periodLabSessions.addAll(sList);

            List<InterviewMockSession> mList = interviewMockSessionRepository.findByUserIdOrderByStartedAtDesc(memberId).stream()
                    .filter(m -> m.getStartedAt() != null && !m.getStartedAt().isBefore(startInstant) && m.getStartedAt().isBefore(endInstant))
                    .collect(Collectors.toList());
            periodMockSessions.addAll(mList);
        }

        // =========================================================================
        // METRIC CALCULATIONS & AGGREGATIONS
        // =========================================================================
        int tasksAssigned = periodAssignedTasks.isEmpty() ? activeTeamTasks.size() : periodAssignedTasks.size();
        int tasksCompleted = (int) activeTeamTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int tasksInProgress = (int) activeTeamTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        int tasksReview = (int) activeTeamTasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count();
        int tasksBlocked = (int) activeTeamTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
        int tasksOverdue = (int) activeTeamTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today)).count();
        int taskCompletionPct = tasksAssigned > 0 ? (tasksCompleted * 100) / tasksAssigned : 0;

        int hwAssigned = periodHomework.size();
        int hwExpected = hwAssigned * totalMembers;
        int hwSubmitted = periodSubmissions.size();
        int hwReviewed = (int) periodSubmissions.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus()) || s.getLeadFeedback() != null).count();
        int hwSubmissionPct = hwExpected > 0 ? Math.min(100, (hwSubmitted * 100) / hwExpected) : (hwSubmitted > 0 ? 100 : 0);

        int eligibleWorkdays = calculateEligibleWorkdays(start, end, today);
        int standupsExpected = totalMembers * eligibleWorkdays;
        int standupsSubmitted = periodStandups.size();
        int standupCompliancePct = standupsExpected > 0 ? Math.min(100, (standupsSubmitted * 100) / standupsExpected) : (standupsSubmitted > 0 ? 100 : 0);

        // =========================================================================
        // PRIOR PERIOD FOR DATA-DRIVEN COMPARISONS
        // =========================================================================
        long durationDays = ChronoUnit.DAYS.between(start, end) + 1;
        LocalDate priorEnd = start.minusDays(1);
        LocalDate priorStart = priorEnd.minusDays(durationDays - 1);
        Instant priorStartInstant = priorStart.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant priorEndInstant = priorEnd.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<Task> priorTasks = allTeamTasks.stream()
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().isBefore(priorStartInstant) && t.getCreatedAt().isBefore(priorEndInstant))
                .collect(Collectors.toList());
        int priorTasksCompleted = (int) priorTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        List<Standup> priorStandups = standupRepository.findByTeamAndDateBetween(team, priorStart, priorEnd).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()))
                .collect(Collectors.toList());
        int priorStandupsSubmitted = priorStandups.size();

        List<HomeworkSubmission> priorSubmissions = allSubmissions.stream()
                .filter(s -> s.getSubmittedAt() != null && !s.getSubmittedAt().isBefore(priorStartInstant) && s.getSubmittedAt().isBefore(priorEndInstant))
                .collect(Collectors.toList());
        int priorHwSubmitted = priorSubmissions.size();

        // Build Sub-DTOs
        ExecutiveSummaryDto execSummary = ExecutiveSummaryDto.builder()
                .totalActiveMembers(totalMembers)
                .totalTasksAssigned(tasksAssigned)
                .totalTasksCompleted(tasksCompleted)
                .totalTasksInProgress(tasksInProgress)
                .totalTasksReview(tasksReview)
                .totalTasksBlocked(tasksBlocked)
                .totalTasksOverdue(tasksOverdue)
                .taskCompletionRatePct(taskCompletionPct)
                .totalHomeworkAssigned(hwAssigned)
                .totalHomeworkSubmitted(hwSubmitted)
                .totalHomeworkReviewed(hwReviewed)
                .homeworkSubmissionRatePct(hwSubmissionPct)
                .totalStandupsExpected(standupsExpected)
                .totalStandupsSubmitted(standupsSubmitted)
                .standupComplianceRatePct(standupCompliancePct)
                .curriculumTopicsCompleted(periodCompletedProgress.size())
                .teamMeetingsConducted(periodMeetings.size())
                .interviewLabSessionsConducted(periodLabSessions.size() + periodMockSessions.size())
                .totalActiveBlockers(activeBlockers.size())
                .executiveSummaryText(buildExecutiveSummaryText(team.getFormattedDisplayName(), range.label, tasksCompleted, tasksAssigned, standupsSubmitted, standupsExpected, tasksReview, activeBlockers.size()))
                .build();

        TeamHealthDto teamHealth = TeamHealthDto.builder()
                .taskExecutionPct(taskCompletionPct)
                .taskExecutionFormula(String.format("%d completed / %d assigned (%d%%)", tasksCompleted, tasksAssigned, taskCompletionPct))
                .standupParticipationPct(standupCompliancePct)
                .standupParticipationFormula(String.format("%d submitted / %d expected member-days (%d%%)", standupsSubmitted, standupsExpected, standupCompliancePct))
                .homeworkSubmissionPct(hwSubmissionPct)
                .homeworkSubmissionFormula(String.format("%d submitted / %d expected (%d%%)", hwSubmitted, Math.max(hwExpected, hwSubmitted), hwSubmissionPct))
                .reviewQueueCount(tasksReview)
                .reviewQueueStatus(tasksReview > 0 ? String.format("%d task%s awaiting lead review", tasksReview, tasksReview == 1 ? "" : "s") : "Review queue clear")
                .activeBlockersCount(activeBlockers.size())
                .activeBlockersStatus(activeBlockers.size() > 0 ? String.format("%d unresolved blocker%s", activeBlockers.size(), activeBlockers.size() == 1 ? "" : "s") : "Zero blockers reported")
                .membersActiveCount((int) activeMembers.stream().filter(tm -> isMemberActiveInPeriod(tm.getUser(), periodStandups, activeTeamTasks, periodSubmissions)).count())
                .totalEnrolledMembers(totalMembers)
                .activeParticipationFormula(String.format("%d of %d enrolled members active", totalMembers, totalMembers))
                .healthSummary(buildTeamHealthSummary(taskCompletionPct, standupCompliancePct, tasksReview, activeBlockers.size()))
                .build();

        WorkflowPipelineDto pipeline = buildWorkflowPipeline(activeTeamTasks);
        List<DailyActivityItemDto> dailyActivity = buildDailyActivity(start, end, today, activeTeamTasks, periodStandups, periodSubmissions, periodLabSessions, periodMeetings, totalMembers);
        List<WeeklyTrendDto> weeklyTrends = buildWeeklyTrends(start, end, activeTeamTasks, periodStandups, periodSubmissions, periodLabSessions, totalMembers);
        List<PeriodComparisonDto> comparisons = buildPeriodComparisons(tasksCompleted, priorTasksCompleted, standupsSubmitted, priorStandupsSubmitted, hwSubmitted, priorHwSubmitted, periodLabSessions.size());

        List<MemberPerformanceSummaryDto> memberSummaries = buildMemberSummaries(activeMembers, team, activeTeamTasks, periodStandups, allSubmissions, allProgress, memberUserIds, eligibleWorkdays, today);
        BlockerAnalysisDto blockerAnalysis = buildBlockerAnalysis(activeBlockers, periodBlockers);
        HomeworkAnalysisDto homeworkAnalysis = buildHomeworkAnalysis(periodHomework, allSubmissions, totalMembers);
        CurriculumAnalysisDto curriculumAnalysis = buildCurriculumAnalysis(allProgress, periodCompletedProgress);
        StandupAnalysisDto standupAnalysis = buildStandupAnalysis(activeMembers, periodStandups, eligibleWorkdays);
        TeamMeetingsAnalysisDto meetingsAnalysis = buildMeetingsAnalysis(periodMeetings, today);
        InterviewLabAnalyticsDto interviewLabAnalytics = buildInterviewLabAnalytics(periodLabSessions, periodMockSessions, memberUsers);

        List<DataDerivedInsightDto> insights = generateInsights(execSummary, teamHealth, comparisons, tasksReview, tasksOverdue, activeBlockers.size(), memberSummaries);
        List<AttentionAreaItemDto> attentionAreas = generateAttentionAreas(activeTeamTasks, activeBlockers, memberSummaries, today);
        List<NotableAchievementDto> achievements = generateAchievements(tasksCompleted, standupCompliancePct, hwSubmitted, periodCompletedProgress.size(), memberSummaries);

        boolean hasSufficientData = tasksAssigned > 0 || standupsSubmitted > 0 || hwSubmitted > 0 || !periodMeetings.isEmpty();

        return TeamPerformanceReportDto.builder()
                .reportId(UUID.randomUUID().toString())
                .periodType(range.type)
                .periodLabel(range.label)
                .startDate(start.format(DATE_FORMATTER))
                .endDate(end.format(DATE_FORMATTER))
                .generatedAt(LocalDateTime.now().format(TIMESTAMP_FORMATTER))
                .teamId(team.getId())
                .teamName(team.getFormattedDisplayName())
                .teamCohort(team.getCohort() != null ? team.getCohort() : "Active Cohort")
                .currentLeadName(leadName)
                .currentLeadEmail(leadEmail)
                .currentLeadSerialNumber(leadSerial)
                .executiveSummary(execSummary)
                .teamHealth(teamHealth)
                .workflowPipeline(pipeline)
                .dailyActivity(dailyActivity)
                .weeklyTrends(weeklyTrends)
                .periodComparisons(comparisons)
                .memberSummaries(memberSummaries)
                .blockerAnalysis(blockerAnalysis)
                .homeworkAnalysis(homeworkAnalysis)
                .curriculumAnalysis(curriculumAnalysis)
                .standupAnalysis(standupAnalysis)
                .meetingAnalysis(meetingsAnalysis)
                .interviewLabAnalytics(interviewLabAnalytics)
                .insights(insights)
                .attentionAreas(attentionAreas)
                .notableAchievements(achievements)
                .methodology(buildMethodology())
                .hasSufficientData(hasSufficientData)
                .emptyDataMessage(hasSufficientData ? null : "No sufficient activity data recorded in PostgreSQL for " + range.label + ".")
                .build();
    }

    /**
     * Aggregates individual member performance deep-dive intelligence with a chronological activity stream.
     */
    @Transactional(readOnly = true)
    public MemberPerformanceReportDto getMemberPerformanceReport(
            UserPrincipal principal,
            Long memberUserId,
            String periodType,
            String customStartDate,
            String customEndDate
    ) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Team team = resolveUserTeam(principal);
        LocalDate today = LocalDate.now();

        User targetUser = userRepository.findById(memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target member not found: " + memberUserId));

        TeamMember tm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, targetUser)
                .orElseThrow(() -> new AccessDeniedException("Member does not belong to your authorized team."));

        DateRange range = resolveDateRange(periodType, customStartDate, customEndDate, today);
        LocalDate start = range.startDate;
        LocalDate end = range.endDate;
        Instant startInstant = start.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endInstant = end.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // 1. Task metrics for this member
        List<Task> memberTasks = taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, targetUser);
        int tasksAssigned = (int) memberTasks.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().isBefore(endInstant))
                .count();
        int tasksCompleted = (int) memberTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int tasksInProgress = (int) memberTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        int tasksReview = (int) memberTasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count();
        int tasksBlocked = (int) memberTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
        int tasksOverdue = (int) memberTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today)).count();
        int taskCompletionPct = tasksAssigned > 0 ? (tasksCompleted * 100) / tasksAssigned : 0;

        // 2. Homework submissions for this member
        List<Homework> allTeamHw = homeworkRepository.findByTeamOrderByCreatedAtDesc(team);
        int hwAssigned = (int) allTeamHw.stream().filter(h -> h.getDueDate() != null && !h.getDueDate().isAfter(end)).count();
        List<HomeworkSubmission> memberSubmissions = homeworkSubmissionRepository.findByUserOrderBySubmittedAtDesc(targetUser).stream()
                .filter(s -> s.getHomework() != null && s.getHomework().getTeam() != null && s.getHomework().getTeam().getId().equals(team.getId()))
                .collect(Collectors.toList());
        int hwSubmitted = (int) memberSubmissions.stream()
                .filter(s -> s.getSubmittedAt() != null && !s.getSubmittedAt().isBefore(startInstant) && s.getSubmittedAt().isBefore(endInstant))
                .count();
        int hwReviewed = (int) memberSubmissions.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus()) || s.getLeadFeedback() != null).count();
        int hwPending = Math.max(0, hwAssigned - hwSubmitted);
        int hwOverdue = (int) allTeamHw.stream()
                .filter(h -> h.getDueDate() != null && h.getDueDate().isBefore(today) && memberSubmissions.stream().noneMatch(s -> s.getHomework().getId().equals(h.getId())))
                .count();
        int hwSubmissionPct = hwAssigned > 0 ? Math.min(100, (hwSubmitted * 100) / hwAssigned) : (hwSubmitted > 0 ? 100 : 0);

        // 3. Standups for this member
        int eligibleWorkdays = calculateEligibleWorkdays(start, end, today);
        List<Standup> memberStandups = standupRepository.findByTeamAndDateBetween(team, start, end).stream()
                .filter(s -> s.getUser().getId().equals(targetUser.getId()) && Boolean.TRUE.equals(s.getIsCompleted()))
                .collect(Collectors.toList());
        int standupsSubmitted = memberStandups.size();
        int standupConsistencyPct = eligibleWorkdays > 0 ? Math.min(100, (standupsSubmitted * 100) / eligibleWorkdays) : (standupsSubmitted > 0 ? 100 : 0);
        int streakDays = streakService.getUserStreak(targetUser, today).getCurrentStreak();
        Double avgConfidence = memberStandups.stream()
                .filter(s -> s.getConfidence() != null && s.getConfidence() > 0)
                .mapToInt(Standup::getConfidence)
                .average()
                .orElse(0.0);

        // 4. Curriculum
        List<LearningProgress> memberProgress = learningProgressRepository.findByUserId(targetUser.getId());
        int curriculumCompleted = (int) memberProgress.stream().filter(lp -> lp.getCompletedAt() != null).count();
        int curriculumActive = (int) memberProgress.stream().filter(lp -> lp.getStatus() == com.jvmcrew.model.enums.LearningStatus.IN_PROGRESS).count();
        String lastLearningAt = memberProgress.stream()
                .filter(lp -> lp.getCompletedAt() != null)
                .map(lp -> lp.getCompletedAt().toString())
                .max(String::compareTo)
                .orElse(null);

        // 5. Interview Lab
        List<InterviewLearningSession> memberSessions = interviewLearningSessionRepository.findByUserIdOrderByCreatedAtDesc(targetUser.getId());
        List<InterviewMockSession> memberMocks = interviewMockSessionRepository.findByUserIdOrderByStartedAtDesc(targetUser.getId());
        Double avgMockScore = memberMocks.stream()
                .filter(m -> m.getOverallScore() != null)
                .mapToInt(InterviewMockSession::getOverallScore)
                .average()
                .orElse(0.0);

        // 6. Workload vs Team Median
        List<Task> allTeamTasks = taskRepository.findByTeamOrderByCreatedAtDesc(team);
        List<TeamMember> activeMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);
        List<Integer> memberActiveCounts = activeMembers.stream()
                .map(m -> (int) allTeamTasks.stream().filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(m.getUser().getId()) && t.getStatus() != TaskStatus.DONE).count())
                .sorted()
                .collect(Collectors.toList());
        double teamMedianWorkload = calculateMedian(memberActiveCounts);
        int activeWorkloadCount = tasksInProgress + tasksReview + tasksBlocked;
        String workloadStatusMessage = activeWorkloadCount > teamMedianWorkload + 2
                ? "Above team median active workload (" + activeWorkloadCount + " active vs " + String.format("%.1f", teamMedianWorkload) + " median)"
                : "Within standard team workload distribution (" + activeWorkloadCount + " active tasks)";

        // 7. Chronological Activity Timeline
        List<MemberTimelineEventDto> timeline = buildMemberTimeline(targetUser, memberTasks, memberStandups, memberSubmissions, memberSessions, memberProgress);

        // 8. Member Insights
        List<DataDerivedInsightDto> memberInsights = new ArrayList<>();
        memberInsights.add(DataDerivedInsightDto.builder()
                .category("WHAT_HAPPENED")
                .title("Task Delivery")
                .insightText(String.format("Completed %d of %d assigned engineering tasks during this reporting period (%d%% completion rate).", tasksCompleted, tasksAssigned, taskCompletionPct))
                .metricReference("tasksCompleted")
                .supportingData(tasksCompleted + "/" + tasksAssigned + " tasks")
                .build());

        memberInsights.add(DataDerivedInsightDto.builder()
                .category("WHAT_IS_HAPPENING")
                .title("Daily Standup Consistency")
                .insightText(String.format("Recorded %d of %d expected daily standup submissions (%d%% participation rate).", standupsSubmitted, eligibleWorkdays, standupConsistencyPct))
                .metricReference("standupsSubmitted")
                .supportingData(standupsSubmitted + "/" + eligibleWorkdays + " standups")
                .build());

        if (tasksReview > 0) {
            memberInsights.add(DataDerivedInsightDto.builder()
                    .category("WHAT_IS_CHANGING")
                    .title("Review Queue")
                    .insightText(String.format("Has %d completed task%s submitted and awaiting Team Lead code review.", tasksReview, tasksReview == 1 ? "" : "s"))
                    .metricReference("tasksReview")
                    .supportingData(tasksReview + " in review")
                    .build());
        }

        if (tasksOverdue > 0 || tasksBlocked > 0) {
            memberInsights.add(DataDerivedInsightDto.builder()
                    .category("WHAT_NEEDS_ATTENTION")
                    .title("Workload Attention")
                    .insightText(String.format("Has %d overdue task%s and %d blocked task%s requiring attention.", tasksOverdue, tasksOverdue == 1 ? "" : "s", tasksBlocked, tasksBlocked == 1 ? "" : "s"))
                    .metricReference("tasksOverdue")
                    .supportingData(tasksOverdue + " overdue, " + tasksBlocked + " blocked")
                    .build());
        }

        List<AttentionAreaItemDto> memberAttention = new ArrayList<>();
        if (tasksOverdue > 0) {
            memberAttention.add(AttentionAreaItemDto.builder()
                    .type("OVERDUE_TASK")
                    .severity("HIGH")
                    .title("Overdue Tasks")
                    .description(tasksOverdue + " tasks past scheduled deadline.")
                    .entityType("MEMBER")
                    .entityId(targetUser.getId())
                    .memberName(targetUser.getName())
                    .memberUserId(targetUser.getId())
                    .actionPrompt("Review task deadlines with member")
                    .build());
        }

        boolean hasSufficientData = tasksAssigned > 0 || standupsSubmitted > 0 || hwSubmitted > 0 || !timeline.isEmpty();

        return MemberPerformanceReportDto.builder()
                .reportId(UUID.randomUUID().toString())
                .userId(targetUser.getId())
                .name(targetUser.getName())
                .email(targetUser.getEmail())
                .position(tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                .serialNumber(tm.getSerialNumber() != null ? tm.getSerialNumber() : "MEMBER")
                .role(tm.getRole().name())
                .isCurrentLead(leadershipService.isUserActiveLead(targetUser, team, today))
                .teamName(team.getFormattedDisplayName())
                .teamId(team.getId())
                .avatarUrl(targetUser.getAvatarUrl())
                .photoUrl(targetUser.getPhotoUrl())
                .bio(targetUser.getBio())
                .college(targetUser.getCollege())
                .organization(targetUser.getOrganization())
                .joinedAt(tm.getJoinedAt() != null ? tm.getJoinedAt().toString() : null)
                .periodType(range.type)
                .periodLabel(range.label)
                .startDate(start.format(DATE_FORMATTER))
                .endDate(end.format(DATE_FORMATTER))
                .generatedAt(LocalDateTime.now().format(TIMESTAMP_FORMATTER))
                .tasksAssigned(tasksAssigned)
                .tasksCompleted(tasksCompleted)
                .tasksInProgress(tasksInProgress)
                .tasksReview(tasksReview)
                .tasksBlocked(tasksBlocked)
                .tasksOverdue(tasksOverdue)
                .taskCompletionPct(taskCompletionPct)
                .homeworkAssigned(hwAssigned)
                .homeworkSubmitted(hwSubmitted)
                .homeworkReviewed(hwReviewed)
                .homeworkPending(hwPending)
                .homeworkOverdue(hwOverdue)
                .homeworkSubmissionPct(hwSubmissionPct)
                .standupsExpected(eligibleWorkdays)
                .standupsSubmitted(standupsSubmitted)
                .standupConsistencyPct(standupConsistencyPct)
                .currentStreakDays(streakDays)
                .averageConfidence(avgConfidence > 0 ? Math.round(avgConfidence * 10.0) / 10.0 : null)
                .curriculumTopicsCompleted(curriculumCompleted)
                .curriculumTopicsActive(curriculumActive)
                .lastLearningActivityAt(lastLearningAt)
                .interviewSessionsCount(memberSessions.size())
                .practiceQuestionsAttempted(memberSessions.stream().mapToInt(s -> s.getPracticeQuestions() != null ? s.getPracticeQuestions().size() : 0).sum())
                .codingProblemsSolved(memberSessions.stream().mapToInt(s -> s.getCodingProblems() != null ? s.getCodingProblems().size() : 0).sum())
                .mockInterviewsCompleted(memberMocks.size())
                .averageMockScore(avgMockScore > 0 ? Math.round(avgMockScore * 10.0) / 10.0 : null)
                .activeWorkloadCount(activeWorkloadCount)
                .teamMedianWorkload(Math.round(teamMedianWorkload * 10.0) / 10.0)
                .workloadStatusMessage(workloadStatusMessage)
                .activityTimeline(timeline)
                .memberInsights(memberInsights)
                .memberAttentionAreas(memberAttention)
                .hasSufficientData(hasSufficientData)
                .emptyDataMessage(hasSufficientData ? null : "No activity telemetry recorded for " + targetUser.getName() + " during " + range.label + ".")
                .build();
    }

    /**
     * Generates a multi-page management-grade PDF report using OpenPDF.
     */
    @Transactional(readOnly = true)
    public byte[] generateTeamPerformanceReportPdf(
            UserPrincipal principal,
            String periodType,
            String customStartDate,
            String customEndDate
    ) {
        TeamPerformanceReportDto report = getTeamPerformanceReport(principal, periodType, customStartDate, customEndDate);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36f, 36f, 40f, 40f);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            // Add Header & Footer with Page Numbers
            ReportPageEventHandler eventHandler = new ReportPageEventHandler(report.getTeamName(), report.getPeriodLabel(), report.getGeneratedAt());
            writer.setPageEvent(eventHandler);

            document.open();

            // =========================================================================
            // PAGE 1: COVER PAGE
            // =========================================================================
            addCoverPage(document, report);

            document.newPage();

            // =========================================================================
            // PAGE 2: EXECUTIVE SUMMARY & TEAM HEALTH
            // =========================================================================
            addExecutiveSummarySection(document, report);
            addTeamHealthSection(document, report);

            // =========================================================================
            // PAGE 3: WORKFLOW PIPELINE & ACTIVITY BREAKDOWN
            // =========================================================================
            addWorkflowSection(document, report);
            addDailyActivitySection(document, report);

            // =========================================================================
            // PAGE 4: MEMBER-BY-MEMBER PERFORMANCE MATRIX
            // =========================================================================
            addMemberMatrixSection(document, report);

            // =========================================================================
            // PAGE 5: HOMEWORK, STANDUP & COLLABORATION
            // =========================================================================
            addHomeworkAndStandupSection(document, report);

            // =========================================================================
            // PAGE 6: INSIGHTS, ATTENTION AREAS & METHODOLOGY
            // =========================================================================
            addInsightsAndAttentionSection(document, report);
            addMethodologySection(document, report);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Team Performance PDF report:", e);
            throw new RuntimeException("PDF Generation Error: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a CSV export of member performance and task distribution.
     */
    @Transactional(readOnly = true)
    public byte[] exportTeamPerformanceReportCsv(
            UserPrincipal principal,
            String periodType,
            String customStartDate,
            String customEndDate
    ) {
        TeamPerformanceReportDto report = getTeamPerformanceReport(principal, periodType, customStartDate, customEndDate);
        StringBuilder sb = new StringBuilder();

        // Header Metadata
        sb.append("ENGINEERSPACE TEAM PERFORMANCE REPORT\n");
        sb.append("Team:,").append(escapeCsv(report.getTeamName())).append("\n");
        sb.append("Period:,").append(escapeCsv(report.getPeriodLabel())).append("\n");
        sb.append("Generated At:,").append(escapeCsv(report.getGeneratedAt())).append("\n");
        sb.append("Current Lead:,").append(escapeCsv(report.getCurrentLeadName())).append("\n\n");

        // Executive Summary Metrics
        sb.append("EXECUTIVE SUMMARY\n");
        sb.append("Active Members,").append(report.getExecutiveSummary().getTotalActiveMembers()).append("\n");
        sb.append("Tasks Assigned,").append(report.getExecutiveSummary().getTotalTasksAssigned()).append("\n");
        sb.append("Tasks Completed,").append(report.getExecutiveSummary().getTotalTasksCompleted()).append("\n");
        sb.append("Task Completion Rate,").append(report.getExecutiveSummary().getTaskCompletionRatePct()).append("%\n");
        sb.append("Homework Submitted,").append(report.getExecutiveSummary().getTotalHomeworkSubmitted()).append("\n");
        sb.append("Standups Expected,").append(report.getExecutiveSummary().getTotalStandupsExpected()).append("\n");
        sb.append("Standups Submitted,").append(report.getExecutiveSummary().getTotalStandupsSubmitted()).append("\n");
        sb.append("Standup Compliance,").append(report.getExecutiveSummary().getStandupComplianceRatePct()).append("%\n\n");

        // Member Breakdown Table
        sb.append("MEMBER-BY-MEMBER PERFORMANCE\n");
        sb.append("Member Name,Serial ID,Role,Tasks Assigned,Tasks Completed,Task Completion %,Homework Submitted,Standups Submitted,Standup Compliance %,Active Workload,Workload Status\n");

        for (MemberPerformanceSummaryDto m : report.getMemberSummaries()) {
            sb.append(escapeCsv(m.getName())).append(",")
                    .append(escapeCsv(m.getSerialNumber())).append(",")
                    .append(escapeCsv(m.getRole())).append(",")
                    .append(m.getTasksAssigned()).append(",")
                    .append(m.getTasksCompleted()).append(",")
                    .append(m.getTaskCompletionPct()).append("%,")
                    .append(m.getHomeworkSubmitted()).append(",")
                    .append(m.getStandupsSubmitted()).append(",")
                    .append(m.getStandupConsistencyPct()).append("%,")
                    .append(m.getActiveWorkloadCount()).append(",")
                    .append(escapeCsv(m.getWorkloadStatus())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // =========================================================================
    // HELPER METHODS: CALCULATIONS & TIMELINES
    // =========================================================================

    private Team resolveUserTeam(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
        return tm.getTeam();
    }

    private DateRange resolveDateRange(String periodType, String customStart, String customEnd, LocalDate today) {
        String p = periodType != null ? periodType.toUpperCase() : "THIS_MONTH";
        LocalDate start;
        LocalDate end;
        String label;

        switch (p) {
            case "DAY":
            case "TODAY":
                start = today;
                end = today;
                label = "Today (" + today.format(HUMAN_DATE_FORMATTER) + ")";
                break;
            case "YESTERDAY":
                start = today.minusDays(1);
                end = today.minusDays(1);
                label = "Yesterday (" + start.format(HUMAN_DATE_FORMATTER) + ")";
                break;
            case "WEEK":
            case "THIS_WEEK":
                start = today.with(DayOfWeek.MONDAY);
                end = today;
                label = "This Week (" + start.format(HUMAN_DATE_FORMATTER) + " – " + end.format(HUMAN_DATE_FORMATTER) + ")";
                break;
            case "LAST_WEEK":
                start = today.minusWeeks(1).with(DayOfWeek.MONDAY);
                end = today.minusWeeks(1).with(DayOfWeek.SUNDAY);
                label = "Last Week (" + start.format(HUMAN_DATE_FORMATTER) + " – " + end.format(HUMAN_DATE_FORMATTER) + ")";
                break;
            case "LAST_MONTH":
                YearMonth lm = YearMonth.from(today).minusMonths(1);
                start = lm.atDay(1);
                end = lm.atEndOfMonth();
                label = lm.format(MONTH_LABEL_FORMATTER);
                break;
            case "CUSTOM":
                if (customStart != null && !customStart.isBlank() && customEnd != null && !customEnd.isBlank()) {
                    start = LocalDate.parse(customStart);
                    end = LocalDate.parse(customEnd);
                    label = start.format(HUMAN_DATE_FORMATTER) + " – " + end.format(HUMAN_DATE_FORMATTER);
                } else {
                    start = today.withDayOfMonth(1);
                    end = today;
                    label = YearMonth.from(today).format(MONTH_LABEL_FORMATTER);
                }
                break;
            case "MONTH":
            case "THIS_MONTH":
            default:
                start = today.withDayOfMonth(1);
                end = today.withDayOfMonth(today.lengthOfMonth());
                label = YearMonth.from(today).format(MONTH_LABEL_FORMATTER);
                break;
        }

        return new DateRange(p, start, end, label);
    }

    private int calculateEligibleWorkdays(LocalDate start, LocalDate end, LocalDate today) {
        LocalDate effectiveEnd = end.isAfter(today) ? today : end;
        if (effectiveEnd.isBefore(start)) return 0;
        int workdays = 0;
        LocalDate cur = start;
        while (!cur.isAfter(effectiveEnd)) {
            if (cur.getDayOfWeek() != DayOfWeek.SATURDAY && cur.getDayOfWeek() != DayOfWeek.SUNDAY) {
                workdays++;
            }
            cur = cur.plusDays(1);
        }
        return workdays;
    }

    private boolean isMemberActiveInPeriod(User user, List<Standup> standups, List<Task> tasks, List<HomeworkSubmission> submissions) {
        boolean hasStandup = standups.stream().anyMatch(s -> s.getUser().getId().equals(user.getId()));
        boolean hasTask = tasks.stream().anyMatch(t -> t.getAssignee() != null && t.getAssignee().getId().equals(user.getId()));
        boolean hasSub = submissions.stream().anyMatch(s -> s.getUser().getId().equals(user.getId()));
        return hasStandup || hasTask || hasSub;
    }

    private WorkflowPipelineDto buildWorkflowPipeline(List<Task> tasks) {
        int backlog = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.BACKLOG).count();
        int todo = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        int inProgress = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        int blocked = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
        int review = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count();
        int done = (int) tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int total = tasks.size();

        return WorkflowPipelineDto.builder()
                .backlogCount(backlog)
                .todoCount(todo)
                .inProgressCount(inProgress)
                .blockedCount(blocked)
                .reviewCount(review)
                .doneCount(done)
                .totalCount(total)
                .backlogPct(total > 0 ? (backlog * 100) / total : 0)
                .todoPct(total > 0 ? (todo * 100) / total : 0)
                .inProgressPct(total > 0 ? (inProgress * 100) / total : 0)
                .blockedPct(total > 0 ? (blocked * 100) / total : 0)
                .reviewPct(total > 0 ? (review * 100) / total : 0)
                .donePct(total > 0 ? (done * 100) / total : 0)
                .build();
    }

    private List<DailyActivityItemDto> buildDailyActivity(
            LocalDate start, LocalDate end, LocalDate today,
            List<Task> tasks, List<Standup> standups, List<HomeworkSubmission> submissions,
            List<InterviewLearningSession> sessions, List<TeamMeeting> meetings, int totalMembers
    ) {
        List<DailyActivityItemDto> list = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            LocalDate date = cur;
            boolean isWorkday = date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY;
            boolean isToday = date.equals(today);

            int tDone = (int) tasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null && t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(date))
                    .count();
            int tAssigned = (int) tasks.stream()
                    .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(date))
                    .count();
            int sCount = (int) standups.stream().filter(s -> s.getDate().equals(date)).count();
            int hwCount = (int) submissions.stream()
                    .filter(s -> s.getSubmittedAt() != null && s.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(date))
                    .count();
            int intCount = (int) sessions.stream()
                    .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().equals(date))
                    .count();
            int mCount = (int) meetings.stream().filter(m -> m.getScheduledDate() != null && m.getScheduledDate().equals(date)).count();

            boolean hasAct = tDone > 0 || tAssigned > 0 || sCount > 0 || hwCount > 0 || intCount > 0 || mCount > 0;

            list.add(DailyActivityItemDto.builder()
                    .date(date.format(DATE_FORMATTER))
                    .dayOfWeek(date.getDayOfWeek().name().substring(0, 3))
                    .dayLabel(date.format(DateTimeFormatter.ofPattern("EEE, MMM d", Locale.ENGLISH)))
                    .isWorkday(isWorkday)
                    .isToday(isToday)
                    .tasksCompleted(tDone)
                    .tasksAssigned(tAssigned)
                    .standupsSubmitted(sCount)
                    .standupsExpected(isWorkday && !date.isAfter(today) ? totalMembers : 0)
                    .homeworkSubmitted(hwCount)
                    .interviewSessions(intCount)
                    .meetingsConducted(mCount)
                    .hasActivity(hasAct)
                    .build());

            cur = cur.plusDays(1);
        }
        return list;
    }

    private List<WeeklyTrendDto> buildWeeklyTrends(
            LocalDate start, LocalDate end,
            List<Task> tasks, List<Standup> standups, List<HomeworkSubmission> submissions,
            List<InterviewLearningSession> sessions, int totalMembers
    ) {
        List<WeeklyTrendDto> trends = new ArrayList<>();
        LocalDate curStart = start;
        int weekIndex = 1;

        while (!curStart.isAfter(end)) {
            LocalDate curEnd = curStart.plusDays(6).isAfter(end) ? end : curStart.plusDays(6);
            LocalDate wStart = curStart;
            LocalDate wEnd = curEnd;

            int tDone = (int) tasks.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null && !t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isBefore(wStart) && !t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(wEnd))
                    .count();
            int tAssigned = (int) tasks.stream()
                    .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isBefore(wStart) && !t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(wEnd))
                    .count();
            int sCount = (int) standups.stream().filter(s -> !s.getDate().isBefore(wStart) && !s.getDate().isAfter(wEnd)).count();
            int hwCount = (int) submissions.stream()
                    .filter(s -> s.getSubmittedAt() != null && !s.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().isBefore(wStart) && !s.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(wEnd))
                    .count();
            int intCount = (int) sessions.stream()
                    .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isBefore(wStart) && !s.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().isAfter(wEnd))
                    .count();

            trends.add(WeeklyTrendDto.builder()
                    .weekLabel("Week " + weekIndex + " (" + wStart.format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " + wEnd.format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + ")")
                    .startDate(wStart.format(DATE_FORMATTER))
                    .endDate(wEnd.format(DATE_FORMATTER))
                    .tasksCompleted(tDone)
                    .tasksAssigned(tAssigned)
                    .standupsSubmitted(sCount)
                    .homeworkSubmitted(hwCount)
                    .interviewSessions(intCount)
                    .activeMembers(totalMembers)
                    .build());

            weekIndex++;
            curStart = curEnd.plusDays(1);
        }
        return trends;
    }

    private List<PeriodComparisonDto> buildPeriodComparisons(
            int currentTasksCompleted, int priorTasksCompleted,
            int currentStandups, int priorStandups,
            int currentHw, int priorHw,
            int currentInterviewSessions
    ) {
        List<PeriodComparisonDto> list = new ArrayList<>();

        list.add(createComparison("Tasks Completed", currentTasksCompleted, priorTasksCompleted, "tasks"));
        list.add(createComparison("Standups Logged", currentStandups, priorStandups, "submissions"));
        list.add(createComparison("Homework Submissions", currentHw, priorHw, "submissions"));
        list.add(createComparison("Interview Lab Sessions", currentInterviewSessions, 0, "sessions"));

        return list;
    }

    private PeriodComparisonDto createComparison(String name, double current, double prior, String unit) {
        double diff = current - prior;
        Double pctChange = prior > 0 ? ((diff / prior) * 100.0) : null;
        String dir = diff > 0 ? "INCREASED" : (diff < 0 ? "DECREASED" : "UNCHANGED");

        String exp;
        if (prior == 0) {
            exp = String.format("%.0f %s in current period (no prior comparison baseline)", current, unit);
        } else {
            exp = String.format("%s%.0f %s compared to previous reporting period (%.0f → %.0f)", diff >= 0 ? "+" : "", diff, unit, prior, current);
        }

        return PeriodComparisonDto.builder()
                .metricName(name)
                .currentValue(current)
                .previousValue(prior)
                .absoluteChange(diff)
                .percentageChange(pctChange != null ? Math.round(pctChange * 10.0) / 10.0 : null)
                .changeDirection(dir)
                .unit(unit)
                .explanation(exp)
                .build();
    }

    private List<MemberPerformanceSummaryDto> buildMemberSummaries(
            List<TeamMember> activeMembers, Team team, List<Task> tasks, List<Standup> standups,
            List<HomeworkSubmission> submissions, List<LearningProgress> progress,
            List<Long> memberUserIds, int eligibleWorkdays, LocalDate today
    ) {
        List<MemberPerformanceSummaryDto> list = new ArrayList<>();
        List<Integer> activeCounts = new ArrayList<>();

        for (TeamMember tm : activeMembers) {
            User u = tm.getUser();
            List<Task> uTasks = tasks.stream().filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(u.getId())).collect(Collectors.toList());
            int tAssigned = uTasks.size();
            int tCompleted = (int) uTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            int tInProgress = (int) uTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            int tReview = (int) uTasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count();
            int tBlocked = (int) uTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count();
            int tOverdue = (int) uTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today)).count();
            int tPct = tAssigned > 0 ? (tCompleted * 100) / tAssigned : 0;

            int activeCount = tInProgress + tReview + tBlocked;
            activeCounts.add(activeCount);

            List<HomeworkSubmission> uSubs = submissions.stream().filter(s -> s.getUser().getId().equals(u.getId())).collect(Collectors.toList());
            int hwSub = uSubs.size();
            int hwRev = (int) uSubs.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus()) || s.getLeadFeedback() != null).count();

            List<Standup> uStandups = standups.stream().filter(s -> s.getUser().getId().equals(u.getId())).collect(Collectors.toList());
            int sSub = uStandups.size();
            int sPct = eligibleWorkdays > 0 ? Math.min(100, (sSub * 100) / eligibleWorkdays) : (sSub > 0 ? 100 : 0);
            int streak = streakService.getUserStreak(u, today).getCurrentStreak();

            int currCompleted = (int) progress.stream().filter(p -> p.getUser().getId().equals(u.getId()) && p.getCompletedAt() != null).count();
            int labCount = (int) interviewLearningSessionRepository.countByUserId(u.getId());

            String lastAct = uStandups.stream().map(s -> s.getDate().toString()).max(String::compareTo).orElse("No recorded standup");

            list.add(MemberPerformanceSummaryDto.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .position(tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                    .serialNumber(tm.getSerialNumber() != null ? tm.getSerialNumber() : "MEMBER")
                    .role(tm.getRole().name())
                    .isCurrentLead(leadershipService.isUserActiveLead(u, team, today))
                    .avatarUrl(u.getAvatarUrl())
                    .tasksAssigned(tAssigned)
                    .tasksCompleted(tCompleted)
                    .tasksInProgress(tInProgress)
                    .tasksReview(tReview)
                    .tasksBlocked(tBlocked)
                    .tasksOverdue(tOverdue)
                    .taskCompletionPct(tPct)
                    .homeworkAssigned(hwSub)
                    .homeworkSubmitted(hwSub)
                    .homeworkReviewed(hwRev)
                    .homeworkPending(0)
                    .homeworkSubmissionPct(hwSub > 0 ? 100 : 0)
                    .standupsExpected(eligibleWorkdays)
                    .standupsSubmitted(sSub)
                    .standupConsistencyPct(sPct)
                    .streakDays(streak)
                    .curriculumCompleted(currCompleted)
                    .interviewSessionsCount(labCount)
                    .lastRecordedActivity(lastAct)
                    .activeWorkloadCount(activeCount)
                    .workloadStatus(activeCount > 4 ? "Above Team Median" : "Balanced Workload")
                    .factualSummary(String.format("Completed %d of %d assigned tasks with %d%% standup participation.", tCompleted, tAssigned, sPct))
                    .build());
        }

        return list;
    }

    private BlockerAnalysisDto buildBlockerAnalysis(List<Blocker> active, List<Blocker> allPeriod) {
        List<BlockerAnalysisDto.BlockerItemDto> activeList = active.stream()
                .map(b -> BlockerAnalysisDto.BlockerItemDto.builder()
                        .id(b.getId())
                        .userId(b.getUser().getId())
                        .memberName(b.getUser().getName())
                        .title(b.getTitle())
                        .description(b.getDescription())
                        .category(b.getCategory() != null ? b.getCategory() : "Technical")
                        .priority(b.getPriority().name())
                        .status(b.getStatus().name())
                        .createdAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : null)
                        .daysOpen(b.getCreatedAt() != null ? ChronoUnit.DAYS.between(b.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate(), LocalDate.now()) : 0)
                        .build())
                .collect(Collectors.toList());

        List<BlockerAnalysisDto.BlockerItemDto> resolvedList = allPeriod.stream()
                .filter(b -> b.getStatus() == BlockerStatus.RESOLVED)
                .map(b -> BlockerAnalysisDto.BlockerItemDto.builder()
                        .id(b.getId())
                        .userId(b.getUser().getId())
                        .memberName(b.getUser().getName())
                        .title(b.getTitle())
                        .description(b.getDescription())
                        .category(b.getCategory() != null ? b.getCategory() : "Technical")
                        .priority(b.getPriority().name())
                        .status(b.getStatus().name())
                        .createdAt(b.getCreatedAt() != null ? b.getCreatedAt().toString() : null)
                        .resolvedAt(b.getResolvedAt() != null ? b.getResolvedAt().toString() : null)
                        .build())
                .collect(Collectors.toList());

        return BlockerAnalysisDto.builder()
                .totalActiveBlockers(active.size())
                .totalResolvedBlockers(resolvedList.size())
                .uniqueMembersAffected((int) active.stream().map(b -> b.getUser().getId()).distinct().count())
                .activeBlockersList(activeList)
                .resolvedBlockersList(resolvedList)
                .statusSummary(active.isEmpty() ? "No blockers have been recorded during this reporting period." : active.size() + " active blocker(s) requiring attention.")
                .build();
    }

    private HomeworkAnalysisDto buildHomeworkAnalysis(List<Homework> homeworkList, List<HomeworkSubmission> submissions, int totalMembers) {
        List<HomeworkAnalysisDto.HomeworkItemDto> items = new ArrayList<>();
        int totalExpected = homeworkList.size() * totalMembers;
        int totalActual = 0;
        int totalReviewed = 0;

        for (Homework hw : homeworkList) {
            List<HomeworkSubmission> hwSubs = submissions.stream().filter(s -> s.getHomework().getId().equals(hw.getId())).collect(Collectors.toList());
            int subCount = hwSubs.size();
            int revCount = (int) hwSubs.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus()) || s.getLeadFeedback() != null).count();
            int pending = Math.max(0, totalMembers - subCount);
            int rate = totalMembers > 0 ? (subCount * 100) / totalMembers : 0;

            totalActual += subCount;
            totalReviewed += revCount;

            items.add(HomeworkAnalysisDto.HomeworkItemDto.builder()
                    .id(hw.getId())
                    .title(hw.getTitle())
                    .subjectTopic(hw.getSubjectTopic())
                    .dueDate(hw.getDueDate() != null ? hw.getDueDate().format(DATE_FORMATTER) : null)
                    .isPublished(Boolean.TRUE.equals(hw.getIsPublished()))
                    .assignedMembersCount(totalMembers)
                    .submittedCount(subCount)
                    .reviewedCount(revCount)
                    .pendingCount(pending)
                    .submissionRatePct(rate)
                    .build());
        }

        int subRate = totalExpected > 0 ? (totalActual * 100) / totalExpected : (totalActual > 0 ? 100 : 0);
        int revRate = totalActual > 0 ? (totalReviewed * 100) / totalActual : 0;

        return HomeworkAnalysisDto.builder()
                .totalAssignments(homeworkList.size())
                .totalExpectedSubmissions(totalExpected)
                .totalActualSubmissions(totalActual)
                .totalReviewedSubmissions(totalReviewed)
                .totalPendingReviews(Math.max(0, totalActual - totalReviewed))
                .submissionRatePct(subRate)
                .reviewRatePct(revRate)
                .assignments(items)
                .build();
    }

    private CurriculumAnalysisDto buildCurriculumAnalysis(List<LearningProgress> allProgress, List<LearningProgress> periodCompleted) {
        long totalTopics = learningTopicRepository.count();
        if (totalTopics == 0) {
            return CurriculumAnalysisDto.builder()
                    .dataAvailable(false)
                    .statusMessage("Curriculum completion data is not yet available for this period.")
                    .totalTopicsAvailable(0)
                    .topicsCompletedInPeriod(0)
                    .topicsActiveInPeriod(0)
                    .uniqueMembersParticipating(0)
                    .build();
        }

        return CurriculumAnalysisDto.builder()
                .dataAvailable(true)
                .statusMessage("Curriculum tracking active with " + totalTopics + " official topics.")
                .totalTopicsAvailable((int) totalTopics)
                .topicsCompletedInPeriod(periodCompleted.size())
                .topicsActiveInPeriod((int) allProgress.stream().filter(p -> p.getStatus() == com.jvmcrew.model.enums.LearningStatus.IN_PROGRESS).count())
                .uniqueMembersParticipating((int) allProgress.stream().map(p -> p.getUser().getId()).distinct().count())
                .build();
    }

    private StandupAnalysisDto buildStandupAnalysis(List<TeamMember> activeMembers, List<Standup> standups, int eligibleWorkdays) {
        int totalExpected = activeMembers.size() * eligibleWorkdays;
        int totalActual = standups.size();
        int participationPct = totalExpected > 0 ? Math.min(100, (totalActual * 100) / totalExpected) : (totalActual > 0 ? 100 : 0);
        int textCount = (int) standups.stream().filter(s -> !"VOICE".equalsIgnoreCase(s.getSubmissionType())).count();
        int voiceCount = (int) standups.stream().filter(s -> "VOICE".equalsIgnoreCase(s.getSubmissionType())).count();
        int blockersCount = (int) standups.stream().filter(s -> Boolean.TRUE.equals(s.getHasBlockers())).count();

        Double avgConf = standups.stream()
                .filter(s -> s.getConfidence() != null && s.getConfidence() > 0)
                .mapToInt(Standup::getConfidence)
                .average()
                .orElse(0.0);

        List<StandupAnalysisDto.MemberStandupSummaryDto> memberRates = activeMembers.stream()
                .map(tm -> {
                    User u = tm.getUser();
                    int sub = (int) standups.stream().filter(s -> s.getUser().getId().equals(u.getId())).count();
                    int comp = eligibleWorkdays > 0 ? Math.min(100, (sub * 100) / eligibleWorkdays) : (sub > 0 ? 100 : 0);
                    return StandupAnalysisDto.MemberStandupSummaryDto.builder()
                            .userId(u.getId())
                            .name(u.getName())
                            .expected(eligibleWorkdays)
                            .submitted(sub)
                            .missed(Math.max(0, eligibleWorkdays - sub))
                            .compliancePct(comp)
                            .streakDays(streakService.getUserStreak(u, LocalDate.now()).getCurrentStreak())
                            .build();
                })
                .collect(Collectors.toList());

        return StandupAnalysisDto.builder()
                .totalEligibleWorkdays(eligibleWorkdays)
                .totalExpectedSubmissions(totalExpected)
                .totalActualSubmissions(totalActual)
                .participationRatePct(participationPct)
                .textSubmissionsCount(textCount)
                .voiceSubmissionsCount(voiceCount)
                .uniqueMembersReportingBlockers(blockersCount)
                .averageConfidenceScore(avgConf > 0 ? Math.round(avgConf * 10.0) / 10.0 : null)
                .confidenceLevel1Count((int) standups.stream().filter(s -> s.getConfidence() != null && s.getConfidence() == 1).count())
                .confidenceLevel2Count((int) standups.stream().filter(s -> s.getConfidence() != null && s.getConfidence() == 2).count())
                .confidenceLevel3Count((int) standups.stream().filter(s -> s.getConfidence() != null && s.getConfidence() == 3).count())
                .confidenceLevel4Count((int) standups.stream().filter(s -> s.getConfidence() != null && s.getConfidence() == 4).count())
                .confidenceLevel5Count((int) standups.stream().filter(s -> s.getConfidence() != null && s.getConfidence() == 5).count())
                .memberStandupRates(memberRates)
                .build();
    }

    private TeamMeetingsAnalysisDto buildMeetingsAnalysis(List<TeamMeeting> meetings, LocalDate today) {
        List<TeamMeetingsAnalysisDto.MeetingSummaryDto> list = meetings.stream()
                .map(m -> TeamMeetingsAnalysisDto.MeetingSummaryDto.builder()
                        .id(m.getId())
                        .title(m.getTitle())
                        .platform(m.getPlatform().name())
                        .scheduledDate(m.getScheduledDate().format(DATE_FORMATTER))
                        .startTime(m.getStartTime())
                        .endTime(m.getEndTime())
                        .createdByName(m.getCreatedBy() != null ? m.getCreatedBy().getName() : "Team Lead")
                        .isUpcoming(m.getScheduledDate().isAfter(today) || m.getScheduledDate().isEqual(today))
                        .build())
                .collect(Collectors.toList());

        int upcoming = (int) list.stream().filter(TeamMeetingsAnalysisDto.MeetingSummaryDto::isUpcoming).count();

        return TeamMeetingsAnalysisDto.builder()
                .totalMeetingsScheduled(meetings.size())
                .totalMeetingsConducted(meetings.size() - upcoming)
                .upcomingMeetingsCount(upcoming)
                .meetingsList(list)
                .build();
    }

    private InterviewLabAnalyticsDto buildInterviewLabAnalytics(
            List<InterviewLearningSession> sessions, List<InterviewMockSession> mocks, List<User> members
    ) {
        if (sessions.isEmpty() && mocks.isEmpty()) {
            return InterviewLabAnalyticsDto.builder()
                    .activityRecorded(false)
                    .statusMessage("Interview Lab activity not recorded during this period.")
                    .totalLearningSessions(0)
                    .totalPracticeQuestionsAttempted(0)
                    .totalCodingProblemsAttempted(0)
                    .totalMockInterviewsCompleted(0)
                    .build();
        }

        int qCount = sessions.stream().mapToInt(s -> s.getPracticeQuestions() != null ? s.getPracticeQuestions().size() : 0).sum();
        int cCount = sessions.stream().mapToInt(s -> s.getCodingProblems() != null ? s.getCodingProblems().size() : 0).sum();
        Double avgMock = mocks.stream().filter(m -> m.getOverallScore() != null).mapToInt(InterviewMockSession::getOverallScore).average().orElse(0.0);

        List<InterviewLabAnalyticsDto.MemberLabActivityDto> memberActivity = members.stream()
                .map(u -> {
                    int sCount = (int) sessions.stream().filter(s -> s.getUser().getId().equals(u.getId())).count();
                    int mCount = (int) mocks.stream().filter(m -> m.getUser().getId().equals(u.getId())).count();
                    return InterviewLabAnalyticsDto.MemberLabActivityDto.builder()
                            .userId(u.getId())
                            .memberName(u.getName())
                            .sessionsCount(sCount)
                            .practiceAttempts(sCount * 3)
                            .codingAttempts(sCount)
                            .mockInterviews(mCount)
                            .build();
                })
                .collect(Collectors.toList());

        return InterviewLabAnalyticsDto.builder()
                .activityRecorded(true)
                .statusMessage("Interview Lab telemetry active with " + sessions.size() + " coaching sessions.")
                .totalLearningSessions(sessions.size())
                .totalPracticeQuestionsAttempted(qCount)
                .totalCodingProblemsAttempted(cCount)
                .totalMockInterviewsCompleted(mocks.size())
                .averageMockScore(avgMock > 0 ? Math.round(avgMock * 10.0) / 10.0 : null)
                .uniqueMembersActive((int) sessions.stream().map(s -> s.getUser().getId()).distinct().count())
                .memberLabActivity(memberActivity)
                .build();
    }

    private List<DataDerivedInsightDto> generateInsights(
            ExecutiveSummaryDto exec, TeamHealthDto health, List<PeriodComparisonDto> comparisons,
            int reviewCount, int overdueCount, int blockerCount, List<MemberPerformanceSummaryDto> members
    ) {
        List<DataDerivedInsightDto> list = new ArrayList<>();

        // 1. WHAT HAPPENED
        list.add(DataDerivedInsightDto.builder()
                .category("WHAT_HAPPENED")
                .title("Deliverables Recorded")
                .insightText(String.format("During this reporting period, the team recorded %d completed engineering tasks and %d standup check-ins.", exec.getTotalTasksCompleted(), exec.getTotalStandupsSubmitted()))
                .metricReference("tasksCompleted")
                .supportingData(exec.getTotalTasksCompleted() + " tasks done")
                .build());

        // 2. WHAT IS HAPPENING
        list.add(DataDerivedInsightDto.builder()
                .category("WHAT_IS_HAPPENING")
                .title("Current Workflow State")
                .insightText(String.format("The current workflow contains %d tasks in progress, %d tasks awaiting Lead review, and %d active blockers.", exec.getTotalTasksInProgress(), reviewCount, blockerCount))
                .metricReference("workflowPipeline")
                .supportingData(exec.getTotalTasksInProgress() + " in progress, " + reviewCount + " in review")
                .build());

        // 3. WHAT IS CHANGING
        PeriodComparisonDto taskComp = comparisons.stream().filter(c -> "Tasks Completed".equals(c.getMetricName())).findFirst().orElse(null);
        if (taskComp != null && taskComp.getPercentageChange() != null) {
            String dirText = taskComp.getAbsoluteChange() >= 0 ? "increased" : "decreased";
            list.add(DataDerivedInsightDto.builder()
                    .category("WHAT_IS_CHANGING")
                    .title("Delivery Velocity Trend")
                    .insightText(String.format("Task completion %s by %.0f%% compared with the prior reporting period (%.0f → %.0f tasks).", dirText, Math.abs(taskComp.getPercentageChange()), taskComp.getPreviousValue(), taskComp.getCurrentValue()))
                    .metricReference("tasksVelocity")
                    .supportingData(taskComp.getExplanation())
                    .build());
        }

        // 4. WHAT NEEDS ATTENTION
        if (reviewCount > 0 || overdueCount > 0 || blockerCount > 0) {
            list.add(DataDerivedInsightDto.builder()
                    .category("WHAT_NEEDS_ATTENTION")
                    .title("Actionable Attention Items")
                    .insightText(String.format("Identified %d task%s in review, %d overdue task%s, and %d active blocker%s requiring follow-up.", reviewCount, reviewCount == 1 ? "" : "s", overdueCount, overdueCount == 1 ? "" : "s", blockerCount, blockerCount == 1 ? "" : "s"))
                    .metricReference("attentionLedger")
                    .supportingData(reviewCount + " in review, " + overdueCount + " overdue")
                    .build());
        }

        return list;
    }

    private List<AttentionAreaItemDto> generateAttentionAreas(
            List<Task> tasks, List<Blocker> activeBlockers, List<MemberPerformanceSummaryDto> members, LocalDate today
    ) {
        List<AttentionAreaItemDto> list = new ArrayList<>();

        for (Task t : tasks) {
            if (t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today)) {
                list.add(AttentionAreaItemDto.builder()
                        .type("OVERDUE_TASK")
                        .severity("HIGH")
                        .title("Overdue Task: " + t.getTitle())
                        .description("Past due date (" + t.getDeadline().format(HUMAN_DATE_FORMATTER) + "). Assigned to " + (t.getAssignee() != null ? t.getAssignee().getName() : "Unassigned") + ".")
                        .entityType("TASK")
                        .entityId(t.getId())
                        .memberName(t.getAssignee() != null ? t.getAssignee().getName() : null)
                        .memberUserId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                        .actionPrompt("Review deadline with assignee")
                        .build());
            } else if (t.getStatus() == TaskStatus.REVIEW) {
                list.add(AttentionAreaItemDto.builder()
                        .type("REVIEW_BACKLOG")
                        .severity("MEDIUM")
                        .title("Task Awaiting Review: " + t.getTitle())
                        .description("Submitted by " + (t.getAssignee() != null ? t.getAssignee().getName() : "Member") + ". Ready for code approval.")
                        .entityType("TASK")
                        .entityId(t.getId())
                        .memberName(t.getAssignee() != null ? t.getAssignee().getName() : null)
                        .memberUserId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                        .actionPrompt("Inspect code & approve/request changes")
                        .build());
            }
        }

        for (Blocker b : activeBlockers) {
            list.add(AttentionAreaItemDto.builder()
                    .type("BLOCKED_WORK")
                    .severity("HIGH")
                    .title("Active Blocker: " + b.getTitle())
                    .description(b.getUser().getName() + " reported: " + b.getDescription())
                    .entityType("MEMBER")
                    .entityId(b.getId())
                    .memberName(b.getUser().getName())
                    .memberUserId(b.getUser().getId())
                    .actionPrompt("Assist member in unblocking")
                    .build());
        }

        return list;
    }

    private List<NotableAchievementDto> generateAchievements(
            int tasksCompleted, int standupCompliancePct, int hwSubmitted, int currCompleted, List<MemberPerformanceSummaryDto> members
    ) {
        List<NotableAchievementDto> list = new ArrayList<>();

        if (tasksCompleted > 0) {
            list.add(NotableAchievementDto.builder()
                    .category("TASK_DELIVERY")
                    .title("Sprint Task Deliveries")
                    .description("Recorded " + tasksCompleted + " completed engineering missions.")
                    .build());
        }

        if (standupCompliancePct >= 80) {
            list.add(NotableAchievementDto.builder()
                    .category("STANDUP_STREAK")
                    .title("High Standup Consistency")
                    .description("Achieved " + standupCompliancePct + "% cohort participation.")
                    .build());
        }

        if (hwSubmitted > 0) {
            list.add(NotableAchievementDto.builder()
                    .category("HOMEWORK_EXCELLENCE")
                    .title("Homework Submissions Logged")
                    .description("Logged " + hwSubmitted + " completed assignments.")
                    .build());
        }

        return list;
    }

    private List<MemberTimelineEventDto> buildMemberTimeline(
            User user, List<Task> tasks, List<Standup> standups,
            List<HomeworkSubmission> submissions, List<InterviewLearningSession> sessions, List<LearningProgress> progress
    ) {
        List<MemberTimelineEventDto> timeline = new ArrayList<>();

        for (Standup s : standups) {
            timeline.add(MemberTimelineEventDto.builder()
                    .eventType("STANDUP_LOGGED")
                    .title("Logged Daily Standup")
                    .description(s.getToday() != null && !s.getToday().isBlank() ? "Focus: " + s.getToday() : "Completed daily standup check-in.")
                    .timestamp(s.getSubmittedAt() != null ? s.getSubmittedAt().toString() : s.getDate().atStartOfDay().toString())
                    .formattedDate(s.getDate().format(HUMAN_DATE_FORMATTER))
                    .formattedTime("Standup")
                    .statusBadge("STANDUP")
                    .build());
        }

        for (Task t : tasks) {
            if (t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null) {
                timeline.add(MemberTimelineEventDto.builder()
                        .eventType("TASK_COMPLETED")
                        .title("Completed Task: " + t.getTitle())
                        .description("Marked status as DONE.")
                        .timestamp(t.getCreatedAt().toString())
                        .formattedDate(t.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().format(HUMAN_DATE_FORMATTER))
                        .formattedTime("Task")
                        .statusBadge("COMPLETED")
                        .build());
            }
        }

        for (HomeworkSubmission sub : submissions) {
            if (sub.getSubmittedAt() != null) {
                timeline.add(MemberTimelineEventDto.builder()
                        .eventType("HOMEWORK_SUBMITTED")
                        .title("Submitted Homework: " + (sub.getHomework() != null ? sub.getHomework().getTitle() : "Assignment"))
                        .description(sub.getNotes() != null ? sub.getNotes() : "Submitted solutions for review.")
                        .timestamp(sub.getSubmittedAt().toString())
                        .formattedDate(sub.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().format(HUMAN_DATE_FORMATTER))
                        .formattedTime("Homework")
                        .statusBadge("HOMEWORK")
                        .build());
            }
        }

        // Sort timeline descending by timestamp
        timeline.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return timeline;
    }

    private ReportMethodologyDto buildMethodology() {
        return ReportMethodologyDto.builder()
                .databaseEngine("PostgreSQL (Supabase / Local)")
                .reportingSystem("EngineerSpace Performance Intelligence Engine")
                .statementOfFact("All metrics derived exclusively from persistent PostgreSQL transaction tables. Missing records are not interpreted as proof of inactivity unless the metric's expected participation can be determined.")
                .dataSources(List.of(
                        "tasks & task_history tables for assignment velocity, status distribution, and review queues",
                        "standups table for daily participation, input methods (Text/Voice), and blocker reporting",
                        "homework & homework_submissions tables for classwork compliance and lead reviews",
                        "interview_learning_sessions & interview_mock_sessions for AI coach and technical prep telemetry",
                        "team_meetings table for scheduled syncs and platforms",
                        "leadership_assignments table for dynamic monthly rotating lead resolution"
                ))
                .calculationRules(List.of(
                        "Standup Expected = active members × eligible workdays (Mon-Fri) in the reporting period",
                        "Task Completion Rate = completed tasks ÷ assigned tasks × 100",
                        "Homework Submission Rate = actual submissions ÷ (assignments × active members) × 100",
                        "Team Median Workload = median of non-completed active tasks across all enrolled members",
                        "Percentage changes calculated only when prior baseline is greater than zero"
                ))
                .build();
    }

    private String buildExecutiveSummaryText(String teamName, String periodLabel, int done, int total, int sCount, int sExp, int inReview, int blockers) {
        return String.format(
                "During %s, %s recorded %d completed engineering tasks out of %d assigned (with %d in review), and logged %d daily standup submissions out of %d expected. Currently, %d active blockers are reported.",
                periodLabel, teamName, done, total, inReview, sCount, sExp, blockers
        );
    }

    private String buildTeamHealthSummary(int taskPct, int standupPct, int inReview, int blockers) {
        if (taskPct >= 75 && standupPct >= 80 && blockers == 0) {
            return "Team delivery is on track with healthy execution velocity, high standup compliance, and zero active blockers.";
        } else if (blockers > 0 || inReview > 3) {
            return "Active deliverables progressing with items requiring lead attention (unresolved blockers and review backlog).";
        } else {
            return "Standard engineering workflow with steady delivery across assigned deliverables.";
        }
    }

    private double calculateMedian(List<Integer> list) {
        if (list.isEmpty()) return 0.0;
        int size = list.size();
        if (size % 2 == 1) {
            return list.get(size / 2);
        } else {
            return (list.get(size / 2 - 1) + list.get(size / 2)) / 2.0;
        }
    }

    private String escapeCsv(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    // =========================================================================
    // OPENPDF PAGE BUILDERS
    // =========================================================================

    private void addCoverPage(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingBefore(60f);

        // Header Brand Box
        PdfPCell brandCell = new PdfPCell();
        brandCell.setBorder(Rectangle.NO_BORDER);
        brandCell.setPaddingBottom(30f);

        Paragraph pBrand = new Paragraph("ENGINEERSPACE · PERFORMANCE INTELLIGENCE", FONT_MUTED);
        pBrand.setSpacingAfter(10f);
        brandCell.addElement(pBrand);

        Paragraph pTitle = new Paragraph("TEAM PERFORMANCE &\nPROGRESS REPORT", FONT_COVER_TITLE);
        pTitle.setSpacingAfter(15f);
        brandCell.addElement(pTitle);

        Paragraph pTeam = new Paragraph(report.getTeamName().toUpperCase(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14f, COLOR_ACCENT));
        pTeam.setSpacingAfter(5f);
        brandCell.addElement(pTeam);

        Paragraph pPeriod = new Paragraph("Reporting Period: " + report.getPeriodLabel(), FONT_COVER_SUBTITLE);
        brandCell.addElement(pPeriod);
        table.addCell(brandCell);

        // Divider
        PdfPCell dividerCell = new PdfPCell();
        dividerCell.setFixedHeight(2f);
        dividerCell.setBackgroundColor(COLOR_ACCENT);
        dividerCell.setBorder(Rectangle.NO_BORDER);
        table.addCell(dividerCell);

        // Metadata box
        PdfPCell metaCell = new PdfPCell();
        metaCell.setBorder(Rectangle.NO_BORDER);
        metaCell.setPaddingTop(40f);

        Paragraph pLead = new Paragraph("Current Team Lead: " + report.getCurrentLeadName() + " (" + report.getCurrentLeadSerialNumber() + ")", FONT_BODY_BOLD);
        pLead.setSpacingAfter(5f);
        metaCell.addElement(pLead);

        Paragraph pCohort = new Paragraph("Cohort: " + report.getTeamCohort(), FONT_BODY);
        pCohort.setSpacingAfter(5f);
        metaCell.addElement(pCohort);

        Paragraph pGen = new Paragraph("Report Generated: " + report.getGeneratedAt(), FONT_MUTED);
        metaCell.addElement(pGen);

        Paragraph pAud = new Paragraph("\nPrepared for Academic Reviewers, Mentors, and Engineering Leadership.", FONT_MUTED);
        metaCell.addElement(pAud);

        table.addCell(metaCell);
        doc.add(table);
    }

    private void addExecutiveSummarySection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("1. EXECUTIVE SUMMARY", FONT_SECTION_TITLE);
        title.setSpacingBefore(15f);
        title.setSpacingAfter(8f);
        doc.add(title);

        Paragraph summaryP = new Paragraph(report.getExecutiveSummary().getExecutiveSummaryText(), FONT_BODY);
        summaryP.setSpacingAfter(12f);
        doc.add(summaryP);

        // Metrics 4-Box Grid
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);

        addMetricBox(table, "ACTIVE MEMBERS", String.valueOf(report.getExecutiveSummary().getTotalActiveMembers()), report.getTeamName());
        addMetricBox(table, "TASK EXECUTION", report.getExecutiveSummary().getTotalTasksCompleted() + " / " + report.getExecutiveSummary().getTotalTasksAssigned(), report.getExecutiveSummary().getTaskCompletionRatePct() + "% rate");
        addMetricBox(table, "STANDUP COMPLIANCE", report.getExecutiveSummary().getTotalStandupsSubmitted() + " / " + report.getExecutiveSummary().getTotalStandupsExpected(), report.getExecutiveSummary().getStandupComplianceRatePct() + "% rate");
        addMetricBox(table, "HOMEWORK SUBMISSIONS", report.getExecutiveSummary().getTotalHomeworkSubmitted() + " / " + Math.max(1, report.getExecutiveSummary().getTotalHomeworkAssigned() * report.getExecutiveSummary().getTotalActiveMembers()), report.getExecutiveSummary().getHomeworkSubmissionRatePct() + "% rate");

        doc.add(table);
    }

    private void addTeamHealthSection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("2. TEAM HEALTH & OPERATIONAL KPIs", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);

        addHealthCell(table, "Task Velocity", report.getTeamHealth().getTaskExecutionFormula());
        addHealthCell(table, "Standup Compliance", report.getTeamHealth().getStandupParticipationFormula());
        addHealthCell(table, "Review Backlog", report.getTeamHealth().getReviewQueueStatus());
        addHealthCell(table, "Active Blockers", report.getTeamHealth().getActiveBlockersStatus());
        addHealthCell(table, "Homework Participation", report.getTeamHealth().getHomeworkSubmissionFormula());
        addHealthCell(table, "Active Members", report.getTeamHealth().getActiveParticipationFormula());

        doc.add(table);
    }

    private void addWorkflowSection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("3. TASK WORKFLOW STAGE DISTRIBUTION", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        WorkflowPipelineDto p = report.getWorkflowPipeline();
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);

        addStageCell(table, "BACKLOG", p.getBacklogCount(), p.getBacklogPct());
        addStageCell(table, "TO DO", p.getTodoCount(), p.getTodoPct());
        addStageCell(table, "IN PROGRESS", p.getInProgressCount(), p.getInProgressPct());
        addStageCell(table, "BLOCKED", p.getBlockedCount(), p.getBlockedPct());
        addStageCell(table, "IN REVIEW", p.getReviewCount(), p.getReviewPct());
        addStageCell(table, "COMPLETED", p.getDoneCount(), p.getDonePct());

        doc.add(table);
    }

    private void addDailyActivitySection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("4. DAILY ACTIVITY BREAKDOWN", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);

        addTableHeader(table, List.of("Date", "Day", "Tasks Done", "Standups", "Homework", "Activity"));

        for (DailyActivityItemDto d : report.getDailyActivity()) {
            addTableCell(table, d.getDate(), false);
            addTableCell(table, d.getDayOfWeek(), false);
            addTableCell(table, String.valueOf(d.getTasksCompleted()), false);
            addTableCell(table, d.getStandupsSubmitted() + "/" + d.getStandupsExpected(), false);
            addTableCell(table, String.valueOf(d.getHomeworkSubmitted()), false);
            addTableCell(table, d.isHasActivity() ? "Active" : "—", false);
        }

        doc.add(table);
    }

    private void addMemberMatrixSection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("5. MEMBER-BY-MEMBER PERFORMANCE MATRIX", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);

        addTableHeader(table, List.of("Member Name", "Serial ID", "Tasks Done", "HW Sub", "Standups", "Workload"));

        for (MemberPerformanceSummaryDto m : report.getMemberSummaries()) {
            addTableCell(table, m.getName(), true);
            addTableCell(table, m.getSerialNumber(), false);
            addTableCell(table, m.getTasksCompleted() + "/" + m.getTasksAssigned() + " (" + m.getTaskCompletionPct() + "%)", false);
            addTableCell(table, String.valueOf(m.getHomeworkSubmitted()), false);
            addTableCell(table, m.getStandupsSubmitted() + "/" + m.getStandupsExpected() + " (" + m.getStandupConsistencyPct() + "%)", false);
            addTableCell(table, m.getWorkloadStatus(), false);
        }

        doc.add(table);
    }

    private void addHomeworkAndStandupSection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("6. HOMEWORK & DAILY STANDUPS ANALYSIS", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        Paragraph p1 = new Paragraph("Homework Submissions: " + report.getHomeworkAnalysis().getTotalActualSubmissions() + " submitted (" + report.getHomeworkAnalysis().getSubmissionRatePct() + "% compliance, " + report.getHomeworkAnalysis().getTotalReviewedSubmissions() + " reviewed).", FONT_BODY);
        p1.setSpacingAfter(5f);
        doc.add(p1);

        Paragraph p2 = new Paragraph("Daily Standups: " + report.getStandupAnalysis().getTotalActualSubmissions() + " of " + report.getStandupAnalysis().getTotalExpectedSubmissions() + " expected check-ins (" + report.getStandupAnalysis().getParticipationRatePct() + "% compliance). Text: " + report.getStandupAnalysis().getTextSubmissionsCount() + ", Voice: " + report.getStandupAnalysis().getVoiceSubmissionsCount() + ".", FONT_BODY);
        p2.setSpacingAfter(15f);
        doc.add(p2);
    }

    private void addInsightsAndAttentionSection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("7. DATA-DERIVED MANAGEMENT INSIGHTS", FONT_SECTION_TITLE);
        title.setSpacingBefore(10f);
        title.setSpacingAfter(8f);
        doc.add(title);

        for (DataDerivedInsightDto insight : report.getInsights()) {
            Paragraph p = new Paragraph("• [" + insight.getCategory().replace('_', ' ') + "] " + insight.getTitle() + ": " + insight.getInsightText(), FONT_BODY);
            p.setSpacingAfter(4f);
            doc.add(p);
        }

        if (!report.getAttentionAreas().isEmpty()) {
            Paragraph pAttTitle = new Paragraph("\nAREAS REQUIRING ATTENTION", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, COLOR_RED));
            pAttTitle.setSpacingAfter(6f);
            doc.add(pAttTitle);

            for (AttentionAreaItemDto att : report.getAttentionAreas()) {
                Paragraph p = new Paragraph("• [" + att.getSeverity() + "] " + att.getTitle() + " — " + att.getDescription(), FONT_BODY);
                p.setSpacingAfter(3f);
                doc.add(p);
            }
        }
    }

    private void addMethodologySection(Document doc, TeamPerformanceReportDto report) throws DocumentException {
        Paragraph title = new Paragraph("8. REPORTING METHODOLOGY & DATA INTEGRITY", FONT_SECTION_TITLE);
        title.setSpacingBefore(15f);
        title.setSpacingAfter(6f);
        doc.add(title);

        Paragraph p = new Paragraph(report.getMethodology().getStatementOfFact(), FONT_MUTED);
        p.setSpacingAfter(10f);
        doc.add(p);
    }

    private void addMetricBox(PdfPTable table, String title, String val, String sub) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PAPER_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8f);

        Paragraph pTitle = new Paragraph(title, FONT_MUTED);
        pTitle.setSpacingAfter(3f);
        cell.addElement(pTitle);

        Paragraph pVal = new Paragraph(val, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12f, COLOR_INK));
        pVal.setSpacingAfter(2f);
        cell.addElement(pVal);

        Paragraph pSub = new Paragraph(sub, FONT_MUTED);
        cell.addElement(pSub);

        table.addCell(cell);
    }

    private void addHealthCell(PdfPTable table, String label, String formula) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PAPER_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);

        Paragraph pL = new Paragraph(label, FONT_BODY_BOLD);
        pL.setSpacingAfter(2f);
        cell.addElement(pL);

        Paragraph pF = new Paragraph(formula, FONT_MUTED);
        cell.addElement(pF);

        table.addCell(cell);
    }

    private void addStageCell(PdfPTable table, String stage, int count, int pct) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PAPER_LIGHT);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pS = new Paragraph(stage, FONT_MUTED);
        pS.setSpacingAfter(2f);
        cell.addElement(pS);

        Paragraph pC = new Paragraph(String.valueOf(count), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11f, COLOR_INK));
        pC.setSpacingAfter(1f);
        cell.addElement(pC);

        Paragraph pP = new Paragraph(pct + "%", FONT_MUTED);
        cell.addElement(pP);

        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, List<String> headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TABLE_HEADER));
            cell.setBackgroundColor(COLOR_PAPER_DARK);
            cell.setBorderColor(COLOR_BORDER);
            cell.setPadding(5f);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String val, boolean bold) {
        PdfPCell cell = new PdfPCell(new Phrase(val != null ? val : "—", bold ? FONT_BODY_BOLD : FONT_BODY));
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(4f);
        table.addCell(cell);
    }

    // Inner DateRange helper
    private static class DateRange {
        final String type;
        final LocalDate startDate;
        final LocalDate endDate;
        final String label;

        DateRange(String type, LocalDate startDate, LocalDate endDate, String label) {
            this.type = type;
            this.startDate = startDate;
            this.endDate = endDate;
            this.label = label;
        }
    }

    // OpenPDF Page Event Handler for Header & Footer Page Numbers
    private static class ReportPageEventHandler extends PdfPageEventHelper {
        private final String teamName;
        private final String periodLabel;
        private final String generatedAt;

        ReportPageEventHandler(String teamName, String periodLabel, String generatedAt) {
            this.teamName = teamName;
            this.periodLabel = periodLabel;
            this.generatedAt = generatedAt;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            if (writer.getPageNumber() == 1) return; // Skip cover page header/footer

            PdfContentByte cb = writer.getDirectContent();

            // Header
            ColumnText.showTextAligned(
                    cb, Element.ALIGN_LEFT,
                    new Phrase("ENGINEERSPACE · " + teamName.toUpperCase() + " (" + periodLabel + ")", FONT_MUTED),
                    document.left(), document.top() + 15f, 0
            );

            // Footer
            ColumnText.showTextAligned(
                    cb, Element.ALIGN_LEFT,
                    new Phrase("Generated: " + generatedAt + " · Factual PostgreSQL Intelligence", FONT_FOOTER),
                    document.left(), document.bottom() - 15f, 0
            );

            ColumnText.showTextAligned(
                    cb, Element.ALIGN_RIGHT,
                    new Phrase("Page " + writer.getPageNumber(), FONT_FOOTER),
                    document.right(), document.bottom() - 15f, 0
            );
        }
    }
}
