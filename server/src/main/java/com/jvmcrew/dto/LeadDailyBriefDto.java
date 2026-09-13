package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadDailyBriefDto {
    private String teamName;
    private LocalDate date;
    private String dayName;
    private int totalMembers;
    private int updatesReceived;
    private int needsAttentionCount;
    private int openBlockersCount;
    private int questionsWaitingCount;
    private int openFollowUpsCount;
    private int urgentCount;
    private long leadOpenTasksCount;

    // Lead's personal tasks
    private List<TaskResponse> leadTasks;

    // 1. Needs Attention (auto-derived high-priority items: blockers, questions, urgent messages, unsubmitted updates)
    private List<AttentionItemDto> needsAttention;

    // 2. Team Summary / Updates (simple member cards with real data)
    private List<TeamSummaryRowDto> teamSummary;

    // 3. Meaningful accomplishments completed today
    private List<AccomplishmentDto> completedToday;

    // 4. Currently working on
    private List<WorkingOnDto> currentlyWorkingOn;

    // 5. Open blockers triage
    private List<BlockerResponse> openBlockers;

    // 6. Questions from team needing response
    private List<TeamQuestionDto> questionsFromTeam;

    // 7. Direct Messages & Urgent requests for Lead ("Ask Your Lead" permanent channel)
    private List<LeadMessageResponseDto> messagesForYou;

    // 8. Learning signals (positive & struggle indicators)
    private List<LearningSignalDto> learningSignals;

    // 9. Follow-ups
    private List<FollowUpDto> followUps;

    // 10. Recurring issue detection
    private List<RecurringIssueDto> recurringIssues;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttentionItemDto {
        private String id;
        private Long userId;
        private String userName;
        private String reason;
        private String type; // BLOCKER, QUESTION, URGENT_MESSAGE, PENDING_UPDATE
        private String actionLabel; // "Review Blocker", "Answer Question", "Respond", "Remind"
        private Long entityId; // standupId, blockerId, or messageId
        private String inputMethod; // "text" or "voice"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamSummaryRowDto {
        private Long userId;
        private String name;
        private String email;
        private String role;
        private int streakDays;
        private boolean hasActivityToday;
        private String progress; // What was completed
        private String currentFocus; // What they are currently building/learning
        private String learningSignal; // What clicked or feeling
        private String blockerStatus; // "None" or blocker title
        private boolean hasBlocker;
        private boolean needsHelp;
        private boolean questionWaiting;
        private String questionText;
        private String leadAnswer;
        private String status; // "SUBMITTED" or "PENDING"
        private Integer confidence;
        private String confidenceLabel;
        private Instant submittedAt;
        private Long standupId;

        // Structured update details & input method indicators
        private String yesterday;
        private String today;
        private String learned;
        private String difficulty;
        private String blockers;
        private String nextStep;
        private String primaryInputMethod; // "text" or "voice"
        private String inputMethodsJson;

        // Voice standup metadata
        private String submissionType; // "TEXT", "VOICE", "TEXT_AND_VOICE"
        private Boolean hasVoiceRecording;
        private Integer audioDurationSeconds;
        private String audioFileName;
        private String audioUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccomplishmentDto {
        private Long userId;
        private String userName;
        private String title;
        private String type; // TASK, CURRICULUM, CHECKIN
        private String completedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkingOnDto {
        private Long userId;
        private String userName;
        private String focus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamQuestionDto {
        private Long standupId;
        private Long userId;
        private String userName;
        private String question;
        private String leadAnswer;
        private boolean answered;
        private String inputMethod; // "text" or "voice"
        private Instant submittedAt;
        private Instant answeredAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LearningSignalDto {
        private Long userId;
        private String userName;
        private String signalType; // CONFIDENT, STRUGGLING
        private String concept;
        private String detail;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecurringIssueDto {
        private Long userId;
        private String userName;
        private String issueType; // LEARNING, TECHNICAL
        private String description;
        private int occurrenceCount;
    }
}
