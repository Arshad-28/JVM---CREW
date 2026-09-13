package com.jvmcrew.dto;

import com.jvmcrew.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatusUpdateRequest {
    private TaskStatus status;
    private Integer progressPct;
    private Double actualHours;
}
