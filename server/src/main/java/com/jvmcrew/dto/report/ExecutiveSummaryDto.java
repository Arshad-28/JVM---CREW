package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutiveSummaryDto {
    private int totalActiveMembers;
    private int totalTasksAssigned;
    private int totalTasksCompleted;
    private int totalTasksInProgress;
    private int totalTasksReview;
    private int totalTasksBlocked;
    private int totalTasksOverdue;
    private int taskCompletionRatePct;

    private int totalHomeworkAssigned;
    private int totalHomeworkSubmitted;
    private int totalHomeworkReviewed;
    private int homeworkSubmissionRatePct;

    private int totalStandupsExpected;
    private int totalStandupsSubmitted;
    private int standupComplianceRatePct;

    private int curriculumTopicsCompleted;
    private int teamMeetingsConducted;
    private int interviewLabSessionsConducted;
    private int totalActiveBlockers;

    private String executiveSummaryText;
}
