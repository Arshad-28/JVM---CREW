package com.jvmcrew.dto;

import com.jvmcrew.model.enums.LearningStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningTopicDto {
    private Long id;
    private String subject;
    private Long parentId;
    private String title;
    private Integer orderIndex;
    private LearningStatus status; // Per-user status
    private Instant completedAt;
}
