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
public class InterviewLabAnalyticsDto {
    private boolean activityRecorded;
    private String statusMessage; // e.g. "AI coach sessions and practice attempts recorded in PostgreSQL."

    private int totalLearningSessions;
    private int totalPracticeQuestionsAttempted;
    private int totalCodingProblemsAttempted;
    private int totalMockInterviewsCompleted;
    private Double averageMockScore;
    private int uniqueMembersActive;

    @Builder.Default
    private List<MemberLabActivityDto> memberLabActivity = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberLabActivityDto {
        private Long userId;
        private String memberName;
        private int sessionsCount;
        private int practiceAttempts;
        private int codingAttempts;
        private int mockInterviews;
        private Double avgScore;
    }
}
