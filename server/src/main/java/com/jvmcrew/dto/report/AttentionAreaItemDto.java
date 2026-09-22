package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttentionAreaItemDto {
    private String type; // "OVERDUE_TASK", "BLOCKED_WORK", "REVIEW_BACKLOG", "MISSING_STANDUP", "PENDING_HOMEWORK", "INACTIVE_MEMBER"
    private String severity; // "HIGH", "MEDIUM", "LOW"
    private String title;
    private String description;
    private String entityType; // "TASK", "HOMEWORK", "STANDUP", "MEMBER"
    private Long entityId;
    private String memberName;
    private Long memberUserId;
    private String actionPrompt; // e.g. "Review submitted task", "Follow up on blocker"
}
