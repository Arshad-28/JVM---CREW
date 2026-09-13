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
public class MemberDashboardDto {
    private String userName;
    private String serialNumber;
    private String position;
    private String role;
    private String teamName;
    private int currentWeek;
    private int totalWeeks;
    private int timelinePct; // e.g. (11 * 100) / 26 = 42%
    private long openTasksCount;
    private long lifetimeCompletedTasks;
    private long completedTasksTodayCount;
    private long overdueTasksCount;
    private long tasksDueTodayCount;
    private long pendingHomeworkCount;
    private long totalHomeworkCount;
    private long openBlockersCount;
    private int curriculumProgressPct;
    private long completedTopicsCount;
    private long totalTopicsCount;
    private int streakDays;
    private UserStreakDto streakInfo;

    private boolean standupDoneToday;
    private boolean checkInInProgress;
    private StandupResponse todayStandup;

    // Team Lead Standup visibility for members
    private CurrentLeadDto teamLead;
    private StandupResponse teamLeadStandup;

    // Real collections
    private List<FocusItemDto> focusItems;
    private List<TaskResponse> myTasks;
    private List<BlockerResponse> myBlockers;
    private List<ChecklistItemDto> todayChecklist;
    private List<FollowUpDto> leadFollowUps; // Follow-up notes from the Lead for this member
    private List<LeadMessageResponseDto> directMessages; // Messages to/from Lead
}
