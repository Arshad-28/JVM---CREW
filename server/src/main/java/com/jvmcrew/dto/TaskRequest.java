package com.jvmcrew.dto;

import com.jvmcrew.model.enums.TaskPriority;
import com.jvmcrew.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {
    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    private Long assigneeId;

    private TaskPriority priority = TaskPriority.MED;

    private TaskStatus status = TaskStatus.TODO;

    private LocalDate deadline;

    private Integer progressPct = 0;

    private Double estHours;

    private Double actualHours;

    private List<String> labels;
}
