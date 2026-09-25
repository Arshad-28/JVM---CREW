package com.jvmcrew.service;

import com.jvmcrew.dto.*;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.AttemptStatus;
import com.jvmcrew.model.enums.BlockerStatus;
import com.jvmcrew.model.enums.LearningStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final StandupRepository standupRepository;
    private final BlockerRepository blockerRepository;
    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final FollowUpRepository followUpRepository;
    private final LeadMessageRepository leadMessageRepository;
    private final LeadMessageService leadMessageService;
    private final StandupService standupService;
    private final TaskService taskService;
    private final BlockerService blockerService;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final LearningTopicRepository learningTopicRepository;
    private final ProblemRepository problemRepository;
    private final StreakService streakService;
    private final LeadershipService leadershipService;

    @Transactional(readOnly = true)
    public MemberDashboardDto getMemberDashboard(Long userId, LocalDate targetDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        LocalDate today = targetDate != null ? targetDate : LocalDate.now();

        TeamMember teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElse(null);
        String teamName = teamMember != null ? teamMember.getTeam().getFormattedDisplayName() : "";
        Team team = teamMember != null ? teamMember.getTeam() : null;

        // Program timeline derived from real team creation date
        int totalWeeks = 26;
        int currentWeek = 1;
        if (team != null && team.getCreatedAt() != null) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(
                    team.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate(),
                    today
            );
            currentWeek = Math.max(1, Math.min(totalWeeks, (int) (days / 7) + 1));
        }
        int timelinePct = (currentWeek * 100) / totalWeeks;

        // All user tasks scoped strictly to active team
        List<Task> allUserTasks = team != null
                ? taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, user)
                : Collections.emptyList();
        List<TaskResponse> myTaskResponses = allUserTasks.stream()
                .map(taskService::mapToResponse)
                .collect(Collectors.toList());

        long openTasks = allUserTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        long lifetimeCompleted = allUserTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        long overdueTasksCount = allUserTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today))
                .count();

        long tasksDueTodayCount = allUserTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isEqual(today))
                .count();

        long completedTodayCount = allUserTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null && t.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().isEqual(today))
                .count();

        UserStreakDto userStreakInfo = streakService.getUserStreak(user, today);
        int streakDays = userStreakInfo.getCurrentStreak();

        // Standup status for this specific calendar date
        Optional<StandupResponse> todayStandup = standupService.getTodayStandup(userId, today);
        boolean standupDoneToday = todayStandup.isPresent();

        // Blocker metrics scoped strictly to active team
        List<Blocker> userOpenBlockers = team != null
                ? blockerRepository.findByTeamAndUserAndStatusOrderByCreatedAtDesc(team, user, BlockerStatus.OPEN)
                : blockerRepository.findByUserAndStatusOrderByCreatedAtDesc(user, BlockerStatus.OPEN);
        long openBlockersCount = userOpenBlockers.size();
        List<BlockerResponse> myBlockerResponses = userOpenBlockers.stream()
                .map(blockerService::mapToResponse)
                .collect(Collectors.toList());

        // Homework metrics
        List<Homework> publishedHomework = team != null
                ? homeworkRepository.findByTeamAndIsPublishedTrueOrderByCreatedAtDesc(team)
                : Collections.emptyList();
        long totalHomeworkCount = publishedHomework.size();
        Set<Long> submittedHwIds = publishedHomework.isEmpty()
                ? Collections.emptySet()
                : homeworkSubmissionRepository.findByHomeworkInAndUser(publishedHomework, user).stream()
                        .map(s -> s.getHomework().getId())
                        .collect(Collectors.toSet());
        long submittedHomeworkCount = submittedHwIds.size();
        List<Homework> pendingHomeworkList = publishedHomework.stream()
                .filter(hw -> !submittedHwIds.contains(hw.getId()))
                .collect(Collectors.toList());
        long pendingHomeworkCount = totalHomeworkCount - submittedHomeworkCount;

        // Curriculum metrics
        long totalTopics = learningTopicRepository.count();
        long completedTopics = learningProgressRepository.countByUserAndStatus(user, LearningStatus.DONE);
        int curriculumProgressPct = totalTopics > 0 ? (int) ((completedTopics * 100) / totalTopics) : 0;

        // Build prioritized Focus Items:
        List<FocusItemDto> focusItems = new ArrayList<>();

        // 1. Overdue tasks
        for (Task t : allUserTasks) {
            if (t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today)) {
                focusItems.add(FocusItemDto.builder()
                        .id("focus-overdue-" + t.getId())
                        .type("OVERDUE_TASK")
                        .entityId(t.getId())
                        .title(t.getTitle())
                        .category("Task")
                        .status(t.getStatus().name())
                        .priority(t.getPriority().name())
                        .dueInfo("Overdue · Was due " + t.getDeadline())
                        .actionLabel("Complete Task")
                        .build());
            }
        }

        // 2. Tasks due today
        for (Task t : allUserTasks) {
            if (t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isEqual(today)) {
                focusItems.add(FocusItemDto.builder()
                        .id("focus-due-today-" + t.getId())
                        .type("TASK_DUE_TODAY")
                        .entityId(t.getId())
                        .title(t.getTitle())
                        .category("Task")
                        .status(t.getStatus().name())
                        .priority(t.getPriority().name())
                        .dueInfo("Due Today")
                        .actionLabel("Work on Task")
                        .build());
            }
        }

        // 3. In-progress / High-priority tasks (if not already added)
        for (Task t : allUserTasks) {
            if (t.getStatus() == TaskStatus.IN_PROGRESS && (t.getDeadline() == null || (!t.getDeadline().isBefore(today) && !t.getDeadline().isEqual(today)))) {
                focusItems.add(FocusItemDto.builder()
                        .id("focus-in-prog-" + t.getId())
                        .type("IN_PROGRESS_TASK")
                        .entityId(t.getId())
                        .title(t.getTitle())
                        .category("Task")
                        .status(t.getStatus().name())
                        .priority(t.getPriority().name())
                        .dueInfo(t.getDeadline() != null ? "Due " + t.getDeadline() : "In Progress")
                        .actionLabel("Continue Task")
                        .build());
            }
        }

        // 4. Pending homework
        for (Homework hw : pendingHomeworkList) {
            focusItems.add(FocusItemDto.builder()
                    .id("focus-hw-" + hw.getId())
                    .type("HOMEWORK_DUE")
                    .entityId(hw.getId())
                    .title(hw.getTitle())
                    .category("Homework · " + hw.getSubjectTopic())
                    .status("PENDING")
                    .priority("MED")
                    .dueInfo(hw.getDueDate() != null ? "Due " + hw.getDueDate() : "Pending Submission")
                    .actionLabel("Submit Solution")
                    .build());
        }

        // 5. Active blockers
        for (Blocker b : userOpenBlockers) {
            focusItems.add(FocusItemDto.builder()
                    .id("focus-blocker-" + b.getId())
                    .type("BLOCKER")
                    .entityId(b.getId())
                    .title(b.getTitle() != null ? b.getTitle() : b.getDescription())
                    .category("Blocker · " + b.getCategory())
                    .status("OPEN")
                    .priority(b.getPriority().name())
                    .dueInfo("Needs Lead Assistance")
                    .actionLabel("View Blocker")
                    .build());
        }

        // Today's checklist auto-pulled from tasks + in-progress learning topics
        List<ChecklistItemDto> checklist = new ArrayList<>();

        // 1. Standup check
        checklist.add(ChecklistItemDto.builder()
                .id("standup-today")
                .type("STANDUP")
                .title("Daily Standup")
                .subtitle(standupDoneToday ? "Submitted at " + todayStandup.get().getSubmittedAt().toString().substring(11, 16) + " UTC" : "2–3 min daily standup with your Lead")
                .status(standupDoneToday ? "DONE" : "PENDING")
                .completed(standupDoneToday)
                .badge("Daily")
                .build());

        // 2. Tasks due today or in progress
        List<Task> userTasks = allUserTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE || (t.getCreatedAt() != null && t.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().isEqual(today)))
                .collect(Collectors.toList());
        for (Task t : userTasks) {
            checklist.add(ChecklistItemDto.builder()
                    .id("task-" + t.getId())
                    .type("TASK")
                    .entityId(t.getId())
                    .title(t.getTitle())
                    .subtitle(t.getDeadline() != null ? "Due: " + t.getDeadline() : "Status: " + t.getStatus())
                    .status(t.getStatus().name())
                    .completed(t.getStatus() == TaskStatus.DONE)
                    .badge(t.getPriority().name())
                    .build());
        }

        // 3. Learning topics in progress
        List<LearningProgress> inProgressLearning = learningProgressRepository.findInProgressTopics(user);
        for (LearningProgress lp : inProgressLearning) {
            checklist.add(ChecklistItemDto.builder()
                    .id("topic-" + lp.getTopic().getId())
                    .type("TOPIC")
                    .entityId(lp.getTopic().getId())
                    .title(lp.getTopic().getTitle())
                    .subtitle(lp.getTopic().getSubject() + " (In Progress)")
                    .status("IN_PROGRESS")
                    .completed(false)
                    .badge(lp.getTopic().getSubject())
                    .build());
        }

        List<FollowUp> pendingFollowUps = team != null
                ? followUpRepository.findByTeamOrderByCreatedAtDesc(team).stream()
                        .filter(f -> f.getUser().getId().equals(user.getId()) && "PENDING".equals(f.getStatus()))
                        .collect(Collectors.toList())
                : Collections.emptyList();
        List<FollowUpDto> memberFollowUpDtos = pendingFollowUps.stream()
                .map(this::mapToFollowUpDto)
                .collect(Collectors.toList());

        boolean checkInInProgress = todayStandup.isPresent() && Boolean.FALSE.equals(todayStandup.get().getIsCompleted());

        List<LeadMessage> memberMessages = team != null
                ? leadMessageRepository.findByTeamOrderByCreatedAtDesc(team).stream()
                        .filter(m -> m.getUser().getId().equals(user.getId()))
                        .collect(Collectors.toList())
                : Collections.emptyList();
        List<LeadMessageResponseDto> directMessages = memberMessages.stream()
                .map(leadMessageService::mapToDto)
                .collect(Collectors.toList());

        // Resolve active Team Lead and Team Lead's standup for today
        CurrentLeadDto teamLeadDto = null;
        StandupResponse teamLeadStandupResponse = null;
        if (team != null) {
            teamLeadDto = leadershipService.getCurrentLeadInfo(user.getId(), team.getId(), today);
            Optional<User> activeLeadOpt = leadershipService.resolveActiveLeadForDate(team, today);
            if (activeLeadOpt.isPresent()) {
                User activeLead = activeLeadOpt.get();
                Optional<Standup> leadStandupOpt = standupRepository.findByTeamAndUserAndDate(team, activeLead, today)
                        .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()));
                if (leadStandupOpt.isEmpty()) {
                    leadStandupOpt = standupRepository.findByUserAndDate(activeLead, today)
                            .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()));
                }
                teamLeadStandupResponse = leadStandupOpt.map(s -> standupService.mapToResponse(s, false)).orElse(null);
            }
        }

        String serialNumber = teamMember != null && teamMember.getSerialNumber() != null
                ? teamMember.getSerialNumber()
                : (teamMember != null ? String.format("%s-%03d", teamMember.getTeam().getCrewIdPrefix(), user.getId()) : "MEMBER");

        return MemberDashboardDto.builder()
                .userName(user.getName())
                .serialNumber(serialNumber)
                .position(teamMember != null && teamMember.getPosition() != null ? teamMember.getPosition() : "SDE Intern")
                .role(teamMember != null && teamMember.getRole() != null ? teamMember.getRole().name() : "MEMBER")
                .teamName(teamName)
                .currentWeek(currentWeek)
                .totalWeeks(totalWeeks)
                .timelinePct(timelinePct)
                .openTasksCount(openTasks)
                .lifetimeCompletedTasks(lifetimeCompleted)
                .completedTasksTodayCount(completedTodayCount)
                .overdueTasksCount(overdueTasksCount)
                .tasksDueTodayCount(tasksDueTodayCount)
                .pendingHomeworkCount(pendingHomeworkCount)
                .totalHomeworkCount(totalHomeworkCount)
                .openBlockersCount(openBlockersCount)
                .curriculumProgressPct(curriculumProgressPct)
                .completedTopicsCount(completedTopics)
                .totalTopicsCount(totalTopics)
                .streakDays(streakDays)
                .streakInfo(userStreakInfo)
                .standupDoneToday(standupDoneToday && !checkInInProgress)
                .checkInInProgress(checkInInProgress)
                .todayStandup(todayStandup.orElse(null))
                .teamLead(teamLeadDto)
                .teamLeadStandup(teamLeadStandupResponse)
                .focusItems(focusItems)
                .myTasks(myTaskResponses)
                .myBlockers(myBlockerResponses)
                .todayChecklist(checklist)
                .leadFollowUps(memberFollowUpDtos)
                .directMessages(directMessages)
                .build();
    }

    @Transactional(readOnly = true)
    public LeadDailyBriefDto getLeadDailyBrief(Long teamId, Long leadUserId, LocalDate targetDate) {
        User leadUser = leadUserId != null ? userRepository.findById(leadUserId).orElse(null) : null;
        Team team = null;
        if (leadUser != null) {
            TeamMember leadTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(leadUser).orElse(null);
            if (leadTm != null) {
                team = leadTm.getTeam();
            }
        }
        if (team == null && teamId != null) {
            team = teamRepository.findById(teamId).orElse(null);
        }
        if (team == null) {
            throw new IllegalArgumentException("Active team not found for lead user: " + leadUserId);
        }

        LocalDate today = targetDate != null ? targetDate : LocalDate.now();
        User activeLead = leadershipService.resolveActiveLeadForDate(team, today).orElse(null);
        final User effectiveLead = activeLead != null ? activeLead : leadUser;

        // Fetch Lead's personal tasks scoped strictly to team
        List<TaskResponse> leadTasks = effectiveLead != null
                ? taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, effectiveLead).stream()
                        .map(taskService::mapToResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();
        long leadOpenTasks = leadTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();

        List<TeamMember> members = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team).stream()
                .filter(tm -> effectiveLead == null || !tm.getUser().getId().equals(effectiveLead.getId()))
                .collect(Collectors.toList());
        int totalMembers = members.size();

        DayOfWeek dow = today.getDayOfWeek();
        String dayName = dow.toString().substring(0, 1) + dow.toString().substring(1).toLowerCase();

        List<User> memberUsers = members.stream().map(TeamMember::getUser).collect(Collectors.toList());

        List<Standup> todayStandupsByTeam = team != null ? standupRepository.findByTeamAndDate(team, today) : Collections.emptyList();
        List<Standup> todayStandupsByUsers = !memberUsers.isEmpty() ? standupRepository.findByUserInAndDate(memberUsers, today) : Collections.emptyList();

        Map<Long, Standup> standupByUserMap = new HashMap<>();
        for (Standup s : todayStandupsByTeam) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getUser() != null) {
                standupByUserMap.put(s.getUser().getId(), s);
            }
        }
        for (Standup s : todayStandupsByUsers) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getUser() != null) {
                standupByUserMap.put(s.getUser().getId(), s);
                if (team != null && (s.getTeam() == null || !team.getId().equals(s.getTeam().getId()))) {
                    s.setTeam(team);
                    standupRepository.save(s);
                }
            }
        }

        int updatesReceived = (int) members.stream()
                .filter(m -> standupByUserMap.containsKey(m.getUser().getId()))
                .count();

        Map<Long, UserStreakDto> memberStreakMap = streakService.getBatchUserStreaks(memberUsers, today);

        List<LeadDailyBriefDto.AttentionItemDto> attentionList = new ArrayList<>();
        List<LeadDailyBriefDto.TeamSummaryRowDto> summaryRows = new ArrayList<>();
        List<LeadDailyBriefDto.AccomplishmentDto> accomplishments = new ArrayList<>();
        List<LeadDailyBriefDto.WorkingOnDto> workingOnList = new ArrayList<>();
        List<LeadDailyBriefDto.TeamQuestionDto> questionsList = new ArrayList<>();
        List<LeadDailyBriefDto.LearningSignalDto> learningSignals = new ArrayList<>();
        List<LeadDailyBriefDto.RecurringIssueDto> recurringIssues = new ArrayList<>();

        for (TeamMember member : members) {
            User u = member.getUser();
            Standup s = standupByUserMap.get(u.getId());

            boolean isSubmitted = s != null;
            boolean hasVoice = isSubmitted && StringUtils.hasText(s.getAudioStoragePath());
            boolean hasBlocker = isSubmitted && Boolean.TRUE.equals(s.getHasBlockers()) && StringUtils.hasText(s.getBlockers());
            boolean needsHelp = isSubmitted && Boolean.TRUE.equals(s.getNeedsHelp());
            boolean questionWaiting = isSubmitted && StringUtils.hasText(s.getQuestionForLead()) && !StringUtils.hasText(s.getLeadAnswer());

            String progressText = isSubmitted ? s.getYesterday() : "No update submitted today.";
            String focusText = isSubmitted ? s.getToday() : "Awaiting standup.";
            String learningSignalText = isSubmitted ? (StringUtils.hasText(s.getLearned()) ? s.getLearned() : (hasVoice ? "Voice Standup" : "—")) : "—";
            String blockerText = hasBlocker ? s.getBlockers() : "None";

            String primaryMethod = isSubmitted && s.getPrimaryInputMethod() != null ? s.getPrimaryInputMethod() : "text";
            String subType = isSubmitted ? (s.getSubmissionType() != null ? s.getSubmissionType() : (hasVoice ? "VOICE" : "TEXT")) : "TEXT";
            String audioUrl = hasVoice ? ("/api/standups/" + s.getId() + "/voice") : null;

            UserStreakDto memberStreak = memberStreakMap.getOrDefault(u.getId(), UserStreakDto.builder().currentStreak(0).longestStreak(0).build());
            summaryRows.add(LeadDailyBriefDto.TeamSummaryRowDto.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .role(member.getRole().name())
                    .streakDays(memberStreak.getCurrentStreak())
                    .hasActivityToday(memberStreak.isHasActivityToday())
                    .progress(progressText)
                    .currentFocus(focusText)
                    .learningSignal(learningSignalText)
                    .blockerStatus(blockerText)
                    .hasBlocker(hasBlocker)
                    .needsHelp(needsHelp)
                    .questionWaiting(questionWaiting)
                    .questionText(isSubmitted ? s.getQuestionForLead() : null)
                    .leadAnswer(isSubmitted ? s.getLeadAnswer() : null)
                    .status(isSubmitted ? "SUBMITTED" : "PENDING")
                    .confidence(isSubmitted ? s.getConfidence() : null)
                    .confidenceLabel(isSubmitted ? s.getConfidenceLabel() : null)
                    .submittedAt(isSubmitted ? s.getSubmittedAt() : null)
                    .standupId(isSubmitted ? s.getId() : null)
                    .yesterday(isSubmitted ? s.getYesterday() : null)
                    .today(isSubmitted ? s.getToday() : null)
                    .learned(isSubmitted ? s.getLearned() : null)
                    .difficulty(isSubmitted ? s.getDifficulty() : null)
                    .blockers(isSubmitted ? s.getBlockers() : null)
                    .nextStep(isSubmitted ? s.getNextStep() : null)
                    .primaryInputMethod(primaryMethod)
                    .inputMethodsJson(isSubmitted ? s.getInputMethodsJson() : null)
                    .submissionType(subType)
                    .hasVoiceRecording(hasVoice)
                    .audioDurationSeconds(isSubmitted ? s.getAudioDurationSeconds() : null)
                    .audioFileName(isSubmitted ? s.getAudioFileName() : null)
                    .audioUrl(audioUrl)
                    .build());

            // 1. Needs Attention Items (Only true blockers, help requests, or questions)
            if (hasBlocker) {
                attentionList.add(LeadDailyBriefDto.AttentionItemDto.builder()
                        .id("att-blocker-" + u.getId())
                        .userId(u.getId())
                        .userName(u.getName())
                        .reason("Roadblock: " + s.getBlockers())
                        .type("BLOCKER")
                        .actionLabel("Review Blocker")
                        .entityId(s.getId())
                        .inputMethod(primaryMethod)
                        .build());
            }

            if (questionWaiting) {
                attentionList.add(LeadDailyBriefDto.AttentionItemDto.builder()
                        .id("att-question-" + u.getId())
                        .userId(u.getId())
                        .userName(u.getName())
                        .reason("Question: \"" + s.getQuestionForLead() + "\"")
                        .type("QUESTION")
                        .actionLabel("Answer Question")
                        .entityId(s.getId())
                        .inputMethod(primaryMethod)
                        .build());
            }

            if (isSubmitted && s.getConfidence() != null && s.getConfidence() <= 2) {
                attentionList.add(LeadDailyBriefDto.AttentionItemDto.builder()
                        .id("att-conf-" + u.getId())
                        .userId(u.getId())
                        .userName(u.getName())
                        .reason("Low confidence reported (" + s.getConfidence() + "/5)")
                        .type("CONFIDENCE_DROP")
                        .actionLabel("Follow Up")
                        .entityId(s.getId())
                        .build());
            }

            // 2. Accomplishments Completed Today
            if (isSubmitted && StringUtils.hasText(s.getYesterday())) {
                accomplishments.add(LeadDailyBriefDto.AccomplishmentDto.builder()
                        .userId(u.getId())
                        .userName(u.getName())
                        .title(s.getYesterday())
                        .type("STANDUP")
                        .completedAt(s.getSubmittedAt().toString())
                        .build());
            }

            // 3. Currently Working On
            if (isSubmitted && StringUtils.hasText(s.getToday())) {
                workingOnList.add(LeadDailyBriefDto.WorkingOnDto.builder()
                        .userId(u.getId())
                        .userName(u.getName())
                        .focus(s.getToday())
                        .build());
            }

            // 4. Questions From Team
            if (isSubmitted && StringUtils.hasText(s.getQuestionForLead())) {
                questionsList.add(LeadDailyBriefDto.TeamQuestionDto.builder()
                        .standupId(s.getId())
                        .userId(u.getId())
                        .userName(u.getName())
                        .question(s.getQuestionForLead())
                        .leadAnswer(s.getLeadAnswer())
                        .answered(StringUtils.hasText(s.getLeadAnswer()))
                        .inputMethod(primaryMethod)
                        .submittedAt(s.getSubmittedAt())
                        .answeredAt(s.getLeadAnsweredAt())
                        .build());
            }

            // 5. Learning Signals
            if (isSubmitted) {
                if (StringUtils.hasText(s.getDifficulty())) {
                    learningSignals.add(LeadDailyBriefDto.LearningSignalDto.builder()
                            .userId(u.getId())
                            .userName(u.getName())
                            .signalType("STRUGGLING")
                            .concept("Needs Support")
                            .detail(s.getDifficulty())
                            .build());
                } else if (StringUtils.hasText(s.getLearned())) {
                    learningSignals.add(LeadDailyBriefDto.LearningSignalDto.builder()
                            .userId(u.getId())
                            .userName(u.getName())
                            .signalType("CONFIDENT")
                            .concept("Grasped Concept")
                            .detail(s.getLearned())
                            .build());
                }
            }
        }

        // Direct Messages for Lead ("Ask Your Lead" permanent channel)
        List<LeadMessage> teamMessages = team != null ? leadMessageRepository.findByTeamOrderByCreatedAtDesc(team) : Collections.emptyList();
        List<LeadMessageResponseDto> messageDtos = teamMessages.stream()
                .map(leadMessageService::mapToDto)
                .collect(Collectors.toList());

        long urgentMessagesCount = teamMessages.stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsUrgent()) && "OPEN".equals(m.getStatus()))
                .count();

        // Add urgent messages to top of Needs Attention
        for (LeadMessage m : teamMessages) {
            if (Boolean.TRUE.equals(m.getIsUrgent()) && "OPEN".equals(m.getStatus())) {
                attentionList.add(0, LeadDailyBriefDto.AttentionItemDto.builder()
                        .id("att-urgent-msg-" + m.getId())
                        .userId(m.getUser().getId())
                        .userName(m.getUser().getName())
                        .reason("Urgent Request: \"" + m.getMessage() + "\"")
                        .type("URGENT_MESSAGE")
                        .actionLabel("Respond")
                        .entityId(m.getId())
                        .inputMethod(m.getInputMethod())
                        .build());
            }
        }

        // Fetch Open Blockers strictly scoped to team
        List<Blocker> openBlockersList = blockerRepository.findByTeamAndStatusOrderByCreatedAtDesc(team, BlockerStatus.OPEN);
        List<BlockerResponse> openBlockers = openBlockersList.stream()
                .map(blockerService::mapToResponse)
                .collect(Collectors.toList());
        long openBlockersCount = openBlockers.size();

        // Fetch Follow-ups
        List<FollowUp> teamFollowUps = followUpRepository.findByTeamOrderByCreatedAtDesc(team);
        List<FollowUpDto> followUpDtos = teamFollowUps.stream()
                .map(this::mapToFollowUpDto)
                .collect(Collectors.toList());

        long openFollowUpsCount = teamFollowUps.stream().filter(f -> "PENDING".equals(f.getStatus())).count();
        long questionsWaitingCount = questionsList.stream().filter(q -> !q.isAnswered()).count();

        // Simple Rule-Based Recurring Issue Detection (check standups over the last 7 days)
        List<Standup> last7DaysStandups = standupRepository.findByTeamAndDateBetween(team, today.minusDays(7), today);

        Map<Long, List<Standup>> byMember = last7DaysStandups.stream().collect(Collectors.groupingBy(s -> s.getUser().getId()));
        for (Map.Entry<Long, List<Standup>> entry : byMember.entrySet()) {
            List<Standup> memberStandups = entry.getValue();
            long blockerOccurrences = memberStandups.stream().filter(s -> Boolean.TRUE.equals(s.getHasBlockers()) || StringUtils.hasText(s.getBlockers())).count();
            if (blockerOccurrences >= 2) {
                User u = memberStandups.get(0).getUser();
                recurringIssues.add(LeadDailyBriefDto.RecurringIssueDto.builder()
                        .userId(u.getId())
                        .userName(u.getName())
                        .issueType("TECHNICAL")
                        .description(u.getName() + " has reported roadblocks " + blockerOccurrences + " times this week.")
                        .occurrenceCount((int) blockerOccurrences)
                        .build());
            }
        }

        return LeadDailyBriefDto.builder()
                .teamName(team.getFormattedDisplayName())
                .date(today)
                .dayName(dayName)
                .totalMembers(totalMembers)
                .updatesReceived(updatesReceived)
                .needsAttentionCount(attentionList.size())
                .openBlockersCount((int) openBlockersCount)
                .questionsWaitingCount((int) questionsWaitingCount)
                .openFollowUpsCount((int) openFollowUpsCount)
                .urgentCount((int) urgentMessagesCount)
                .leadOpenTasksCount(leadOpenTasks)
                .leadTasks(leadTasks)
                .needsAttention(attentionList)
                .teamSummary(summaryRows)
                .completedToday(accomplishments)
                .currentlyWorkingOn(workingOnList)
                .openBlockers(openBlockers)
                .questionsFromTeam(questionsList)
                .messagesForYou(messageDtos)
                .learningSignals(learningSignals)
                .followUps(followUpDtos)
                .recurringIssues(recurringIssues)
                .build();
    }

    @Transactional
    public FollowUpDto createFollowUp(Long leadId, CreateFollowUpRequest request) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        User member = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + request.getUserId()));

        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));

        TeamMember memberTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(member)
                .orElseThrow(() -> new IllegalStateException("Target member does not belong to any active team"));

        if (!tm.getTeam().getId().equals(memberTm.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You cannot create follow-ups for members of another team.");
        }

        FollowUp followUp = FollowUp.builder()
                .user(member)
                .lead(lead)
                .team(tm.getTeam())
                .note(request.getNote().trim())
                .dueDate(request.getDueDate())
                .status("PENDING")
                .build();

        followUp = followUpRepository.save(followUp);
        return mapToFollowUpDto(followUp);
    }

    @Transactional
    public FollowUpDto completeFollowUp(Long followUpId, Long leadUserId) {
        FollowUp followUp = followUpRepository.findById(followUpId)
                .orElseThrow(() -> new IllegalArgumentException("FollowUp not found: " + followUpId));

        if (leadUserId != null) {
            User lead = userRepository.findById(leadUserId).orElse(null);
            if (lead != null) {
                TeamMember leadTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                        .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
                if (followUp.getTeam() != null && !followUp.getTeam().getId().equals(leadTm.getTeam().getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("You cannot complete follow-ups for another team.");
                }
            }
        }

        followUp.setStatus("COMPLETED");
        followUp.setCompletedAt(java.time.Instant.now());
        followUp = followUpRepository.save(followUp);
        return mapToFollowUpDto(followUp);
    }

    @Transactional(readOnly = true)
    public LeadDashboardDto getLeadDashboard(Long teamId, LocalDate targetDate) {
        Team team = teamId != null ? teamRepository.findById(teamId).orElse(null) : null;
        if (team == null) {
            return LeadDashboardDto.builder()
                    .teamName("Not Assigned")
                    .totalMembers(0)
                    .tasksCompleted(0)
                    .totalTasks(0)
                    .memberRoster(Collections.emptyList())
                    .needsAttention(Collections.emptyList())
                    .recentActivity(Collections.emptyList())
                    .teamProgressTrend(Collections.emptyList())
                    .openBlockers(Collections.emptyList())
                    .build();
        }

        LocalDate today = targetDate != null ? targetDate : LocalDate.now();
        User activeLead = leadershipService.resolveActiveLeadForDate(team, today).orElse(null);

        List<TeamMember> members = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team).stream()
                .filter(tm -> activeLead == null || !tm.getUser().getId().equals(activeLead.getId()))
                .collect(Collectors.toList());
        int totalMembers = members.size();

        List<User> memberUsers = members.stream().map(TeamMember::getUser).collect(Collectors.toList());
        List<Standup> todayStandupsByTeam = standupRepository.findByTeamAndDate(team, today);
        List<Standup> todayStandupsByUsers = !memberUsers.isEmpty() ? standupRepository.findByUserInAndDate(memberUsers, today) : Collections.emptyList();

        Map<Long, Standup> standupByUserMap = new HashMap<>();
        for (Standup s : todayStandupsByTeam) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getUser() != null) {
                standupByUserMap.put(s.getUser().getId(), s);
            }
        }
        for (Standup s : todayStandupsByUsers) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getUser() != null) {
                standupByUserMap.put(s.getUser().getId(), s);
                if (team != null && (s.getTeam() == null || !team.getId().equals(s.getTeam().getId()))) {
                    s.setTeam(team);
                    standupRepository.save(s);
                }
            }
        }

        int standupsSubmittedToday = (int) members.stream()
                .filter(m -> standupByUserMap.containsKey(m.getUser().getId()))
                .count();
        int standupRatePct = totalMembers > 0 ? (standupsSubmittedToday * 100) / totalMembers : 0;

        long totalTasks = taskRepository.countByTeam(team);
        long doneTasks = taskRepository.countByTeamAndStatus(team, TaskStatus.DONE);
        int teamTaskCompletionPct = totalTasks > 0 ? (int) ((doneTasks * 100) / totalTasks) : 0;

        long totalTopics = learningTopicRepository.count();

        List<Homework> publishedHomework = homeworkRepository.findByTeamAndIsPublishedTrueOrderByCreatedAtDesc(team);
        long totalHomeworkCount = publishedHomework.size();

        long totalHomeworkSubmissions = 0;
        for (Homework hw : publishedHomework) {
            totalHomeworkSubmissions += homeworkSubmissionRepository.countByHomework(hw);
        }

        long openBlockersCount = blockerRepository.countByTeamAndStatus(team, BlockerStatus.OPEN);

        List<MemberRosterDto> roster = new ArrayList<>();
        List<AttentionItemDto> attentionItems = new ArrayList<>();
        int activeTodayCount = 0;
        int totalCurriculumProgressSum = 0;

        for (TeamMember member : members) {
            User user = member.getUser();

            // 1. Task metrics scoped to team
            List<Task> userTaskList = taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, user);
            long userTotalTasks = userTaskList.size();
            long userDoneTasks = userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            long userInProgressTasks = userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            long userPendingTasks = userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
            long userOpenTasks = userTotalTasks - userDoneTasks;
            int userTaskPct = userTotalTasks > 0 ? (int) ((userDoneTasks * 100) / userTotalTasks) : 0;

            String activeTaskTitle = userTaskList.stream()
                    .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                    .map(Task::getTitle)
                    .findFirst()
                    .orElse(userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.TODO).map(Task::getTitle).findFirst().orElse(null));

            // Overdue tasks
            long overdueTaskCount = userTaskList.stream()
                    .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today))
                    .count();

            // 2. DSA metrics
            long dsaSolved = problemAttemptRepository.countByUserAndStatus(user, AttemptStatus.SOLVED);
            int streak = streakService.getUserStreak(user, today).getCurrentStreak();

            // 3. Standup metrics
            Standup userTodayStandup = standupByUserMap.get(user.getId());
            boolean standupToday = userTodayStandup != null;
            Integer confidence = standupToday ? userTodayStandup.getConfidence() : null;
            String confidenceLabel = standupToday ? getConfidenceLabel(userTodayStandup.getConfidence()) : null;

            if (standupToday) {
                activeTodayCount++;
            }

            // 4. Curriculum metrics
            long userCompletedTopics = learningProgressRepository.countByUserAndStatus(user, LearningStatus.DONE);
            int userCurriculumPct = totalTopics > 0 ? (int) ((userCompletedTopics * 100) / totalTopics) : 0;
            totalCurriculumProgressSum += userCurriculumPct;

            String currentTopicTitle = !learningProgressRepository.findInProgressTopics(user).isEmpty()
                    ? learningProgressRepository.findInProgressTopics(user).get(0).getTopic().getTitle()
                    : learningProgressRepository.findTopByUserAndStatusOrderByCompletedAtDesc(user, LearningStatus.DONE)
                            .map(lp -> lp.getTopic().getTitle())
                            .orElse("Getting Started");

            String currentSubject = !learningProgressRepository.findInProgressTopics(user).isEmpty()
                    ? learningProgressRepository.findInProgressTopics(user).get(0).getTopic().getSubject()
                    : learningProgressRepository.findTopByUserAndStatusOrderByCompletedAtDesc(user, LearningStatus.DONE)
                            .map(lp -> lp.getTopic().getSubject())
                            .orElse("Java Training");

            // 5. Homework metrics
            List<HomeworkSubmission> userHwSubs = homeworkSubmissionRepository.findByUserOrderBySubmittedAtDesc(user).stream()
                    .filter(sub -> sub.getHomework() != null && sub.getHomework().getTeam() != null && sub.getHomework().getTeam().getId().equals(team.getId()))
                    .collect(Collectors.toList());
            long userHwSubmitted = userHwSubs.size();
            long userHwPending = Math.max(0, totalHomeworkCount - userHwSubmitted);

            String latestHwTitle = !publishedHomework.isEmpty() ? publishedHomework.get(0).getTitle() : null;
            String latestHwStatus = userHwSubs.stream()
                    .filter(s -> !publishedHomework.isEmpty() && s.getHomework().getId().equals(publishedHomework.get(0).getId()))
                    .map(HomeworkSubmission::getStatus)
                    .findFirst()
                    .orElse("NOT_SUBMITTED");

            // 6. Blocker metrics
            long userBlockerCount = blockerRepository.findByTeamAndUserAndStatusOrderByCreatedAtDesc(team, user, BlockerStatus.OPEN).size();

            // 7. Overall status evaluation
            String status = "ON_TRACK";
            String statusReason = "Active & progressing normally";

            if (overdueTaskCount > 0 || userBlockerCount > 0) {
                status = "NEEDS_ATTENTION";
                statusReason = userBlockerCount > 0 ? "Has active blockers" : "Has overdue tasks";
                attentionItems.add(AttentionItemDto.builder()
                        .userId(user.getId())
                        .memberName(user.getName())
                        .memberEmail(user.getEmail())
                        .issueType(userBlockerCount > 0 ? "OPEN_BLOCKER" : "OVERDUE_TASK")
                        .description(statusReason)
                        .severity("HIGH")
                        .build());
            } else if (!standupToday && today.getDayOfWeek().getValue() <= 5) {
                status = "STANDUP_PENDING";
                statusReason = "Standup not yet submitted";
                attentionItems.add(AttentionItemDto.builder()
                        .userId(user.getId())
                        .memberName(user.getName())
                        .memberEmail(user.getEmail())
                        .issueType("PENDING_STANDUP")
                        .description("Pending standup submission")
                        .severity("MEDIUM")
                        .build());
            }

            int overallProgress = (userTaskPct + userCurriculumPct) / 2;
            String memberSerial = member.getSerialNumber() != null
                    ? member.getSerialNumber()
                    : String.format("%s-%03d", team.getCrewIdPrefix(), user.getId());

            roster.add(MemberRosterDto.builder()
                    .userId(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(member.getRole())
                    .serialNumber(memberSerial)
                    .position(member.getPosition())
                    .teamName(team.getFormattedDisplayName())
                    .status(status)
                    .statusReason(statusReason)
                    .overallProgressPct(overallProgress)
                    .taskCompletionPct(userTaskPct)
                    .openTasks(userOpenTasks)
                    .completedTasks(userDoneTasks)
                    .totalTasks(userTotalTasks)
                    .inProgressTasks(userInProgressTasks)
                    .activeTaskTitle(activeTaskTitle)
                    .standupSubmittedToday(standupToday)
                    .standupConfidence(confidence)
                    .standupConfidenceLabel(confidenceLabel)
                    .curriculumCompletedTopics(userCompletedTopics)
                    .curriculumTotalTopics(totalTopics)
                    .curriculumProgressPct(userCurriculumPct)
                    .currentLearningSubject(currentSubject)
                    .currentTopicTitle(currentTopicTitle)
                    .homeworkSubmittedCount(userHwSubmitted)
                    .homeworkTotalCount(totalHomeworkCount)
                    .homeworkPendingCount(userHwPending)
                    .latestHomeworkTitle(latestHwTitle)
                    .latestHomeworkStatus(latestHwStatus)
                    .openBlockersCount(userBlockerCount)
                    .build());
        }

        int avgCurriculumPct = totalMembers > 0 ? (totalCurriculumProgressSum / totalMembers) : 0;
        int attendancePct = totalMembers > 0 ? (activeTodayCount * 100) / totalMembers : 0;

        // 8. Real Team Progress Trend (last 7 days)
        List<TeamDayProgressDto> progressTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dayLabel = d.getMonth().name().substring(0, 3) + " " + d.getDayOfMonth();
            int sCount = standupRepository.findByTeamAndDate(team, d).size();
            progressTrend.add(TeamDayProgressDto.builder()
                    .date(d)
                    .dayLabel(dayLabel)
                    .standupsCount(sCount)
                    .tasksCompletedCount(0)
                    .homeworkSubmittedCount(0)
                    .build());
        }

        List<BlockerResponse> openBlockers = blockerRepository.findByTeamAndStatusOrderByCreatedAtDesc(team, BlockerStatus.OPEN).stream()
                .map(blockerService::mapToResponse)
                .collect(Collectors.toList());
        List<TaskHistoryResponse> recentActivity = taskService.getRecentActivity(team.getId());

        return LeadDashboardDto.builder()
                .teamName(team.getFormattedDisplayName())
                .totalMembers(totalMembers)
                .activeTodayCount(activeTodayCount)
                .standupsSubmittedToday(standupsSubmittedToday)
                .standupRatePct(standupRatePct)
                .tasksCompleted(doneTasks)
                .totalTasks(totalTasks)
                .teamTaskCompletionPct(teamTaskCompletionPct)
                .homeworkSubmittedCount(totalHomeworkSubmissions)
                .totalHomework(totalHomeworkCount)
                .openBlockersCount(openBlockersCount)
                .curriculumProgressPct(avgCurriculumPct)
                .attendancePct(attendancePct)
                .needsAttention(attentionItems)
                .memberRoster(roster)
                .teamProgressTrend(progressTrend)
                .openBlockers(openBlockers)
                .recentActivity(recentActivity)
                .build();
    }

    @Transactional(readOnly = true)
    public MemberDetailProgressDto getMemberDetailProgress(Long memberId, Long leadUserId) {
        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        TeamMember teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("Member is not in any active team: " + memberId));
        Team team = teamMember.getTeam();
        String teamName = team.getFormattedDisplayName();

        if (leadUserId != null) {
            User lead = userRepository.findById(leadUserId).orElse(null);
            if (lead != null) {
                TeamMember leadTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                        .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
                if (!leadTm.getTeam().getId().equals(team.getId())) {
                    throw new org.springframework.security.access.AccessDeniedException("You are not authorized to view details of a member from another team.");
                }
            }
        }

        LocalDate today = LocalDate.now();

        // 1. Standup details
        Optional<StandupResponse> todayStandupOpt = standupService.getTodayStandup(memberId, today);
        boolean standupSubmittedToday = todayStandupOpt.isPresent();
        StandupResponse todayStandup = todayStandupOpt.orElse(null);

        List<Standup> allStandups = standupRepository.findByUserOrderByDateDesc(user);
        List<StandupResponse> recentStandupHistory = allStandups.stream()
                .limit(14)
                .map(this::mapStandupToResponse)
                .collect(Collectors.toList());

        // 2. Curriculum details
        List<LearningTopic> allTopics = learningTopicRepository.findAllByOrderBySubjectAscOrderIndexAsc();
        int totalTopicsCount = allTopics.size();
        List<LearningProgress> userProgress = learningProgressRepository.findByUser(user);
        Map<Long, LearningProgress> progressMap = userProgress.stream()
                .collect(Collectors.toMap(lp -> lp.getTopic().getId(), lp -> lp));

        List<MemberTopicItemDto> topicItems = new ArrayList<>();
        int completedTopicsCount = 0;
        String currentTopicTitle = null;

        for (LearningTopic t : allTopics) {
            LearningProgress lp = progressMap.get(t.getId());
            String status = lp != null ? lp.getStatus().name() : "NOT_STARTED";
            Instant compAt = lp != null ? lp.getCompletedAt() : null;

            if ("DONE".equals(status)) {
                completedTopicsCount++;
            } else if ("IN_PROGRESS".equals(status) && currentTopicTitle == null) {
                currentTopicTitle = t.getTitle();
            }

            topicItems.add(MemberTopicItemDto.builder()
                    .topicId(t.getId())
                    .subject(t.getSubject())
                    .title(t.getTitle())
                    .orderIndex(t.getOrderIndex())
                    .status(status)
                    .completedAt(compAt)
                    .build());
        }

        if (currentTopicTitle == null) {
            currentTopicTitle = topicItems.stream()
                    .filter(ti -> "DONE".equals(ti.getStatus()))
                    .map(MemberTopicItemDto::getTitle)
                    .reduce((first, second) -> second)
                    .orElse("Computer Anatomy / Computer Fundamentals");
        }

        int curriculumPct = totalTopicsCount > 0 ? (completedTopicsCount * 100) / totalTopicsCount : 0;

        // 3. Task details strictly scoped to team
        List<Task> userTaskList = taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, user);
        int tasksDone = (int) userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int tasksInProg = (int) userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        int tasksTodo = (int) userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        int tasksOverdue = (int) userTaskList.stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(today))
                .count();

        String currentTaskTitle = userTaskList.stream()
                .filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS)
                .map(Task::getTitle)
                .findFirst()
                .orElse(userTaskList.stream().filter(t -> t.getStatus() == TaskStatus.TODO).map(Task::getTitle).findFirst().orElse("No active task assigned"));

        List<TaskResponse> taskResponses = userTaskList.stream()
                .map(this::mapTaskToResponse)
                .collect(Collectors.toList());

        // 4. Homework details
        List<Homework> publishedHw = homeworkRepository.findByTeamAndIsPublishedTrueOrderByCreatedAtDesc(team);

        List<MemberHomeworkSummaryItemDto> hwItems = new ArrayList<>();
        int hwSubmitted = 0;
        int hwReviewed = 0;
        int hwPending = 0;
        String currentHwTitle = !publishedHw.isEmpty() ? publishedHw.get(0).getTitle() : "No homework assigned";

        for (Homework hw : publishedHw) {
            Optional<HomeworkSubmission> sub = homeworkSubmissionRepository.findByHomeworkAndUser(hw, user);
            if (sub.isPresent()) {
                hwSubmitted++;
                if ("REVIEWED".equals(sub.get().getStatus())) {
                    hwReviewed++;
                }
                hwItems.add(MemberHomeworkSummaryItemDto.builder()
                        .homeworkId(hw.getId())
                        .title(hw.getTitle())
                        .subject(hw.getSubjectTopic())
                        .dueDate(hw.getDueDate())
                        .submissionStatus(sub.get().getStatus())
                        .submittedAt(sub.get().getSubmittedAt())
                        .feedback(sub.get().getLeadFeedback())
                        .build());
            } else {
                hwPending++;
                hwItems.add(MemberHomeworkSummaryItemDto.builder()
                        .homeworkId(hw.getId())
                        .title(hw.getTitle())
                        .subject(hw.getSubjectTopic())
                        .dueDate(hw.getDueDate())
                        .submissionStatus("PENDING")
                        .build());
            }
        }

        // 5. Blockers strictly scoped to team
        List<BlockerResponse> openBlockers = blockerRepository.findByTeamAndUserAndStatusOrderByCreatedAtDesc(team, user, BlockerStatus.OPEN)
                .stream()
                .map(this::mapBlockerToResponse)
                .collect(Collectors.toList());

        // 6. Status & Focus Summary
        String currentFocus = todayStandup != null && StringUtils.hasText(todayStandup.getYesterday())
                ? todayStandup.getYesterday()
                : (!allStandups.isEmpty() && StringUtils.hasText(allStandups.get(0).getYesterday())
                        ? allStandups.get(0).getYesterday()
                        : "Focusing on current curriculum modules");

        int taskPct = !userTaskList.isEmpty() ? (tasksDone * 100) / userTaskList.size() : 0;
        int overallProgress = (int) (
                (curriculumPct * 0.35) +
                (taskPct * 0.30) +
                (!publishedHw.isEmpty() ? ((hwSubmitted * 100.0 / publishedHw.size()) * 0.20) : (taskPct * 0.20)) +
                (standupSubmittedToday ? 15 : 0)
        );
        overallProgress = Math.min(100, Math.max(0, overallProgress));

        String status = "ON_TRACK";
        String statusReason = "Consistent progress across curriculum, tasks, and standups.";

        if (!openBlockers.isEmpty() || tasksOverdue > 0) {
            status = "AT_RISK";
            statusReason = !openBlockers.isEmpty()
                    ? "Active blocker recorded requiring Lead support."
                    : tasksOverdue + " task overdue.";
        } else if (!standupSubmittedToday || hwPending > 0) {
            status = "NEEDS_ATTENTION";
            statusReason = !standupSubmittedToday
                    ? "Daily standup not yet submitted for today."
                    : "Homework submission pending.";
        }

        // 7. Chronological Activity Points (real points only)
        List<MemberActivityPointDto> activityPoints = new ArrayList<>();
        for (Standup s : allStandups) {
            if (s.getSubmittedAt() != null) {
                boolean hasVoice = StringUtils.hasText(s.getAudioStoragePath());
                String subType = s.getSubmissionType() != null ? s.getSubmissionType() : (hasVoice ? "VOICE" : "TEXT");
                Integer dur = s.getAudioDurationSeconds();
                String desc = hasVoice
                        ? ("Voice Standup Recording" + (dur != null && dur > 0 ? (" · " + dur + " sec") : ""))
                        : (StringUtils.hasText(s.getYesterday()) ? s.getYesterday() : "Written standup submitted.");

                activityPoints.add(MemberActivityPointDto.builder()
                        .type("STANDUP")
                        .title("Daily Standup Submitted")
                        .description(desc)
                        .standupId(s.getId())
                        .submissionType(subType)
                        .hasVoiceRecording(hasVoice)
                        .audioDurationSeconds(dur)
                        .audioUrl(hasVoice ? ("/api/standups/" + s.getId() + "/voice") : null)
                        .timestamp(s.getSubmittedAt())
                        .build());
            }
        }
        for (Task t : userTaskList) {
            if (t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null) {
                activityPoints.add(MemberActivityPointDto.builder()
                        .type("TASK")
                        .title("Completed Task: " + t.getTitle())
                        .description(t.getDescription())
                        .timestamp(t.getCreatedAt())
                        .build());
            }
        }
        for (MemberHomeworkSummaryItemDto hw : hwItems) {
            if (hw.getSubmittedAt() != null) {
                activityPoints.add(MemberActivityPointDto.builder()
                        .type("HOMEWORK")
                        .title("Submitted Homework: " + hw.getTitle())
                        .description(hw.getSubject())
                        .timestamp(hw.getSubmittedAt())
                        .build());
            }
        }
        activityPoints.sort(Comparator.comparing(MemberActivityPointDto::getTimestamp).reversed());

        return MemberDetailProgressDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(teamMember.getRole())
                .teamName(teamName)
                .status(status)
                .statusReason(statusReason)
                .overallProgressPct(overallProgress)
                .currentCurriculumTopic(currentTopicTitle)
                .currentTask(currentTaskTitle)
                .currentHomework(currentHwTitle)
                .currentFocus(currentFocus)
                .curriculumCompletedCount(completedTopicsCount)
                .curriculumTotalCount(totalTopicsCount)
                .curriculumProgressPct(curriculumPct)
                .curriculumTopics(topicItems)
                .tasksCompletedCount(tasksDone)
                .tasksInProgressCount(tasksInProg)
                .tasksPendingCount(tasksTodo)
                .tasksOverdueCount(tasksOverdue)
                .taskList(taskResponses)
                .homeworkSubmittedCount(hwSubmitted)
                .homeworkPendingCount(hwPending)
                .homeworkReviewedCount(hwReviewed)
                .homeworkList(hwItems)
                .standupSubmittedToday(standupSubmittedToday)
                .todayStandup(todayStandup)
                .recentStandupHistory(recentStandupHistory)
                .openBlockers(openBlockers)
                .activityPoints(activityPoints)
                .build();
    }

    private String getConfidenceLabel(Integer confidence) {
        if (confidence == null) return "Confidence Not Set";
        return switch (confidence) {
            case 1 -> "1/5 – Struggling / Blocked";
            case 2 -> "2/5 – Confused / Slowed";
            case 3 -> "3/5 – Progressing / Okay";
            case 4 -> "4/5 – Confident / Good";
            case 5 -> "5/5 – Very Confident / Mastered";
            default -> confidence + "/5";
        };
    }

    private StandupResponse mapStandupToResponse(Standup standup) {
        if (standup == null) return null;
        return standupService.mapToResponse(standup, false);
    }

    private TaskResponse mapTaskToResponse(Task task) {
        if (task == null) return null;
        return TaskResponse.builder()
                .id(task.getId())
                .teamId(task.getTeam().getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null ? task.getAssignee().getName() : null)
                .priority(task.getPriority())
                .status(task.getStatus())
                .deadline(task.getDeadline())
                .progressPct(task.getProgressPct())
                .estHours(task.getEstHours())
                .actualHours(task.getActualHours())
                .createdAt(task.getCreatedAt())
                .labels(task.getLabels())
                .build();
    }

    private BlockerResponse mapBlockerToResponse(Blocker blocker) {
        if (blocker == null) return null;
        return BlockerResponse.builder()
                .id(blocker.getId())
                .userId(blocker.getUser().getId())
                .userName(blocker.getUser().getName())
                .title(blocker.getTitle())
                .category(blocker.getCategory())
                .priority(blocker.getPriority())
                .description(blocker.getDescription())
                .status(blocker.getStatus())
                .assignedToId(blocker.getAssignedTo() != null ? blocker.getAssignedTo().getId() : null)
                .assignedToName(blocker.getAssignedTo() != null ? blocker.getAssignedTo().getName() : null)
                .createdAt(blocker.getCreatedAt())
                .resolvedAt(blocker.getResolvedAt())
                .build();
    }

    private FollowUpDto mapToFollowUpDto(FollowUp f) {
        return FollowUpDto.builder()
                .id(f.getId())
                .userId(f.getUser().getId())
                .userName(f.getUser().getName())
                .leadId(f.getLead().getId())
                .leadName(f.getLead().getName())
                .note(f.getNote())
                .status(f.getStatus())
                .dueDate(f.getDueDate())
                .createdAt(f.getCreatedAt())
                .completedAt(f.getCompletedAt())
                .build();
    }


    @Transactional
    public MemberRosterDto updateTeamMember(Long teamId, Long memberId, Long requesterLeadId, com.jvmcrew.dto.LeadUpdateMemberRequest request) {
        User leadUser = requesterLeadId != null ? userRepository.findById(requesterLeadId).orElse(null) : null;
        Team team = null;
        if (leadUser != null) {
            TeamMember leadTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(leadUser)
                    .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
            team = leadTm.getTeam();
        } else if (teamId != null) {
            team = teamRepository.findById(teamId).orElse(null);
        }

        if (team == null) {
            throw new IllegalArgumentException("Team not found");
        }

        User user = userRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberId));

        TeamMember teamMember = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, user)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("User " + memberId + " is not an active member of your team"));

        LocalDate today = LocalDate.now();
        TeamMember leadTm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, leadUser).orElse(null);
        boolean isAdmin = leadTm != null && leadTm.getRole() == Role.ADMIN;
        boolean isLeadToday = isAdmin || leadershipService.isUserActiveLead(leadUser, team, today);
        boolean isSelf = leadUser.getId().equals(memberId);

        if (!isLeadToday && !isSelf) {
            throw new org.springframework.security.access.AccessDeniedException("Only the active Team Lead or the member themselves can edit this profile.");
        }

        String newName = request.getName() != null ? request.getName().trim() : user.getName();
        String newEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : user.getEmail();

        if (newName.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        if (newEmail.isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }

        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email address is already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        user.setName(newName);
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getCollege() != null) user.setCollege(request.getCollege().trim());
        if (request.getOrganization() != null) user.setOrganization(request.getOrganization().trim());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (request.getGithubUrl() != null) user.setGithubUrl(TeamManagementService.validateAndNormalizeGithubUrl(request.getGithubUrl()));
        if (request.getLinkedinUrl() != null) user.setLinkedinUrl(TeamManagementService.validateAndNormalizeLinkedInUrl(request.getLinkedinUrl()));
        if (request.getPhotoUrl() != null) user.setPhotoUrl(request.getPhotoUrl().trim().isEmpty() ? null : request.getPhotoUrl().trim());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        userRepository.save(user);

        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()) {
            teamMember.setSerialNumber(request.getSerialNumber().trim());
        }

        if (request.getPosition() != null) {
            teamMember.setPosition(request.getPosition().trim());
        }

        if (request.getRole() != null) {
            teamMember.setRole(request.getRole());
        }

        if (request.getTeamName() != null && !request.getTeamName().isBlank()) {
            team.setName(request.getTeamName().trim());
            teamRepository.save(team);
        }

        teamMember = teamMemberRepository.save(teamMember);

        return MemberRosterDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(teamMember.getRole())
                .serialNumber(teamMember.getSerialNumber() != null ? teamMember.getSerialNumber() : ("JVM-00" + user.getId()))
                .position(teamMember.getPosition())
                .teamName(team.getName())
                .status("ON_TRACK")
                .statusReason("Member profile updated by Team Lead")
                .build();
    }
}
