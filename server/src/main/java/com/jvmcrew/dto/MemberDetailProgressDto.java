package com.jvmcrew.dto;

import com.jvmcrew.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberDetailProgressDto {
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String teamName;
    private String status; // "ON_TRACK", "NEEDS_ATTENTION", "AT_RISK"
    private String statusReason;
    private int overallProgressPct;

    // Current Focus Summary
    private String currentCurriculumTopic;
    private String currentTask;
    private String currentHomework;
    private String currentFocus;

    // Curriculum details
    private int curriculumCompletedCount;
    private int curriculumTotalCount;
    private int curriculumProgressPct;
    private List<MemberTopicItemDto> curriculumTopics;

    // Task details
    private int tasksCompletedCount;
    private int tasksInProgressCount;
    private int tasksPendingCount;
    private int tasksOverdueCount;
    private List<TaskResponse> taskList;

    // Homework details
    private int homeworkSubmittedCount;
    private int homeworkPendingCount;
    private int homeworkReviewedCount;
    private List<MemberHomeworkSummaryItemDto> homeworkList;

    // Standup details
    private boolean standupSubmittedToday;
    private StandupResponse todayStandup;
    private List<StandupResponse> recentStandupHistory;

    // Blockers
    private List<BlockerResponse> openBlockers;

    // Progress over time (real historical points)
    private List<MemberActivityPointDto> activityPoints;
}
