package com.jvmcrew.dto;

import com.jvmcrew.model.enums.TaskPriority;
import com.jvmcrew.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskRequest {
    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    private Long assigneeId;

    @Builder.Default
    private TaskPriority priority = TaskPriority.MED;

    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    private LocalDate deadline;

    @Builder.Default
    private Integer progressPct = 0;

    private Double estHours;

    private Double actualHours;

    private List<String> labels;
}
