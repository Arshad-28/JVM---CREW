package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadDashboardDto {
    private String teamName;
    private int totalMembers;
    private int activeTodayCount;
    private int standupsSubmittedToday;
    private int standupRatePct;

    // Team overview metrics (real values)
    private long tasksCompleted;
    private long totalTasks;
    private int teamTaskCompletionPct;

    private long homeworkSubmittedCount;
    private long totalHomework;

    private long openBlockersCount;
    private int curriculumProgressPct;
    private int attendancePct;

    // Actionable attention list (real issues only)
    private List<AttentionItemDto> needsAttention;

    // Team members summary cards
    private List<MemberRosterDto> memberRoster;

    // Real progress trend points
    private List<TeamDayProgressDto> teamProgressTrend;

    // Recent activity & blockers
    private List<BlockerResponse> openBlockers;
    private List<TaskHistoryResponse> recentActivity;
}
