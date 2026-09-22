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
public class HomeworkAnalysisDto {
    private int totalAssignments;
    private int totalExpectedSubmissions;
    private int totalActualSubmissions;
    private int totalReviewedSubmissions;
    private int totalPendingReviews;
    private int submissionRatePct;
    private int reviewRatePct;

    @Builder.Default
    private List<HomeworkItemDto> assignments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HomeworkItemDto {
        private Long id;
        private String title;
        private String subjectTopic;
        private String dueDate;
        private boolean isPublished;
        private int assignedMembersCount;
        private int submittedCount;
        private int reviewedCount;
        private int pendingCount;
        private int submissionRatePct;
    }
}
