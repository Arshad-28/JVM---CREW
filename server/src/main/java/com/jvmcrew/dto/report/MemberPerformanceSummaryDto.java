package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberPerformanceSummaryDto {
    private Long userId;
    private String name;
    private String email;
    private String position;
    private String serialNumber;
    private String role;
    private boolean isCurrentLead;
    private String avatarUrl;

    // Task metrics
    private int tasksAssigned;
    private int tasksCompleted;
    private int tasksInProgress;
    private int tasksReview;
    private int tasksBlocked;
    private int tasksOverdue;
    private int taskCompletionPct;

    // Homework metrics
    private int homeworkAssigned;
    private int homeworkSubmitted;
    private int homeworkReviewed;
    private int homeworkPending;
    private int homeworkSubmissionPct;

    // Standup metrics
    private int standupsExpected;
    private int standupsSubmitted;
    private int standupConsistencyPct;
    private int streakDays;

    // Curriculum & Interview Lab
    private int curriculumCompleted;
    private int interviewSessionsCount;

    // Last recorded activity
    private String lastRecordedActivity;
    private String lastRecordedActivityAt;

    // Workload & status summary
    private int activeWorkloadCount;
    private String workloadStatus; // e.g. "Optimal", "Above Team Median"
    private String factualSummary; // e.g. "Completed 4 of 6 tasks with 95% standup consistency."
}
