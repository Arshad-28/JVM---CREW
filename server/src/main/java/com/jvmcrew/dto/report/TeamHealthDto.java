package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamHealthDto {

    // 1. Task Execution Velocity
    private int taskExecutionPct;
    private String taskExecutionFormula; // e.g. "5 completed / 8 assigned in period (62%)"

    // 2. Daily Standup Participation
    private int standupParticipationPct;
    private String standupParticipationFormula; // e.g. "18 submitted / 20 expected member-days (90%)"

    // 3. Homework Participation
    private int homeworkSubmissionPct;
    private String homeworkSubmissionFormula; // e.g. "4 submitted / 5 assigned (80%)"

    // 4. Review Queue Backlog
    private int reviewQueueCount;
    private String reviewQueueStatus; // e.g. "2 tasks awaiting lead review"

    // 5. Active Blockers
    private int activeBlockersCount;
    private String activeBlockersStatus; // e.g. "1 technical blocker recorded"

    // 6. Active Participation Rate
    private int membersActiveCount;
    private int totalEnrolledMembers;
    private String activeParticipationFormula; // e.g. "5 of 5 enrolled members active"

    // Human-readable summary without arbitrary scores
    private String healthSummary;
}
