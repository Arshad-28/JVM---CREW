package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskHistoryResponse {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private String fieldChanged;
    private String oldValue;
    private String newValue;
    private Long changedById;
    private String changedByName;
    private Instant changedAt;
}
