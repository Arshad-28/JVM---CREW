package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberTimelineEventDto {
    private String eventType; // "TASK_COMPLETED", "TASK_SUBMITTED", "STANDUP_LOGGED", "HOMEWORK_SUBMITTED", "INTERVIEW_SESSION", "BLOCKER_REPORTED"
    private String title;
    private String description;
    private String timestamp; // ISO 8601
    private String formattedDate; // "Sep 22, 2026"
    private String formattedTime; // "09:42 AM"
    private String entityId;
    private String statusBadge;
}
