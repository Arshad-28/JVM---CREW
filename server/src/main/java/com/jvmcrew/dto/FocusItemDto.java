package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FocusItemDto {
    private String id;
    private String type; // OVERDUE_TASK, TASK_DUE_TODAY, HIGH_PRIORITY_TASK, IN_PROGRESS_TASK, HOMEWORK_DUE, BLOCKER
    private Long entityId;
    private String title;
    private String category;
    private String status;
    private String priority;
    private String dueInfo;
    private String actionLabel;
}