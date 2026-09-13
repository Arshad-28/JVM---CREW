package com.jvmcrew.dto;

import com.jvmcrew.model.enums.TaskPriority;
import com.jvmcrew.model.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
    private Long id;
    private Long teamId;
    private String title;
    private String description;
    private Long assigneeId;
    private String assigneeName;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate deadline;
    private Integer progressPct;
    private Double estHours;
    private Double actualHours;
    private Instant createdAt;
    private List<String> labels;
    private int commentsCount;
}
