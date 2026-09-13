package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttentionItemDto {
    private Long userId;
    private String memberName;
    private String memberEmail;
    private String issueType; // "PENDING_STANDUP", "OPEN_BLOCKER", "PENDING_HOMEWORK", "OVERDUE_TASK"
    private String description;
    private String severity; // "HIGH", "MEDIUM", "LOW"
}
