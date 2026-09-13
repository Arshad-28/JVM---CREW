package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyEvaluationDto {
    private String month;
    private String monthLabel;
    private Long teamId;
    private String teamName;
    private CurrentLeadDto leadInfo;

    // Personal Performance for requester (even if Lead!)
    private PersonalPerformanceDto personalPerformance;

    // Leadership Performance for whoever was Lead during this month
    private LeadershipPerformanceDto leadershipPerformance;

    // Cohort Summary Rows
    private List<MemberMonthlySummaryDto> cohortSummaries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalPerformanceDto {
        private Long userId;
        private String name;
        private String email;
        private String position;
        private String serialNumber;
        private boolean wasLeadThisMonth;

        private int tasksAssigned;
        private int tasksCompleted;
        private int tasksOverdue;
        private int taskCompletionPct;

        private int homeworkAssigned;
        private int homeworkSubmitted;
        private int homeworkReviewed;

        private int standupDaysExpected;
        private int standupsSubmitted;
        private int voiceStandupsSubmitted;
        private int standupConsistencyPct;

        private int streakDays;
        private int blockersReported;
        private int blockersResolved;
        private String performanceRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LeadershipPerformanceDto {
        private Long leadUserId;
        private String leadName;
        private String periodLabel;

        private int tasksCreatedForTeam;
        private int tasksReviewed;
        private int tasksApproved;

        private int homeworkCreated;
        private int homeworkReviewed;

        private int memberStandupsMonitored;
        private int totalExpectedMemberStandups;
        private int cohortStandupSubmissionPct;

        private int blockersTriaged;
        private int followUpsIssued;
        private int teamQuestionsAnswered;

        private int cohortOverallCompletionPct;
        private String leadershipRating;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberMonthlySummaryDto {
        private Long userId;
        private String name;
        private String position;
        private String serialNumber;
        private String roleInMonth;
        private int tasksCompleted;
        private int tasksTotal;
        private int homeworkSubmitted;
        private int homeworkTotal;
        private int standupsSubmitted;
        private int streakDays;
        private int progressPct;
    }
}
