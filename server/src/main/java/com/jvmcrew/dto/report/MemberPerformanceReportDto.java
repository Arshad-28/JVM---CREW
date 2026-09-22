package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberPerformanceReportDto {

    private String reportId;
    private Long userId;
    private String name;
    private String email;
    private String position;
    private String serialNumber;
    private String role;
    private boolean isCurrentLead;
    private String teamName;
    private Long teamId;
    private String avatarUrl;
    private String photoUrl;
    private String bio;
    private String college;
    private String organization;
    private String joinedAt;

    private String periodType;
    private String periodLabel;
    private String startDate;
    private String endDate;
    private String generatedAt;

    // Task metrics for this member
    private int tasksAssigned;
    private int tasksCompleted;
    private int tasksInProgress;
    private int tasksReview;
    private int tasksBlocked;
    private int tasksOverdue;
    private int taskCompletionPct;

    // Homework metrics for this member
    private int homeworkAssigned;
    private int homeworkSubmitted;
    private int homeworkReviewed;
    private int homeworkPending;
    private int homeworkOverdue;
    private int homeworkSubmissionPct;

    // Standup metrics for this member
    private int standupsExpected;
    private int standupsSubmitted;
    private int standupConsistencyPct;
    private int currentStreakDays;
    private Double averageConfidence;

    // Curriculum progress
    private int curriculumTopicsCompleted;
    private int curriculumTopicsActive;
    private String lastLearningActivityAt;

    // Interview Lab activity
    private int interviewSessionsCount;
    private int practiceQuestionsAttempted;
    private int codingProblemsSolved;
    private int mockInterviewsCompleted;
    private Double averageMockScore;

    // Workload comparison against team median
    private int activeWorkloadCount;
    private double teamMedianWorkload;
    private String workloadStatusMessage; // e.g. "Within standard team workload distribution"

    // Chronological Activity Timeline
    @Builder.Default
    private List<MemberTimelineEventDto> activityTimeline = new ArrayList<>();

    // Factual insights specific to this member
    @Builder.Default
    private List<DataDerivedInsightDto> memberInsights = new ArrayList<>();

    // Actionable attention items for this member
    @Builder.Default
    private List<AttentionAreaItemDto> memberAttentionAreas = new ArrayList<>();

    private boolean hasSufficientData;
    private String emptyDataMessage;
}
