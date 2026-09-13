package com.jvmcrew.dto;

import com.jvmcrew.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRosterDto {
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String serialNumber;
    private String position;
    private String teamName;
    private String status; // "ON_TRACK", "NEEDS_ATTENTION", "AT_RISK"
    private String statusReason;
    private int overallProgressPct;

    // Tasks summary
    private int taskCompletionPct;
    private long openTasks;
    private long completedTasks;
    private long totalTasks;
    private long inProgressTasks;
    private String activeTaskTitle;

    // Standup summary
    private boolean standupSubmittedToday;
    private Integer standupConfidence;
    private String standupConfidenceLabel;

    // Curriculum summary
    private long curriculumCompletedTopics;
    private long curriculumTotalTopics;
    private int curriculumProgressPct;
    private String currentLearningSubject;
    private String currentTopicTitle;

    // Homework summary
    private long homeworkSubmittedCount;
    private long homeworkTotalCount;
    private long homeworkPendingCount;
    private String latestHomeworkTitle;
    private String latestHomeworkStatus;

    // Blockers
    private long openBlockersCount;
}
