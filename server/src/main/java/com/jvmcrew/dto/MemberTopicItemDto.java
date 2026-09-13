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
public class MemberTopicItemDto {
    private Long topicId;
    private String subject;
    private String title;
    private int orderIndex;
    private String status; // "DONE", "IN_PROGRESS", "NOT_STARTED"
    private Instant completedAt;
}
