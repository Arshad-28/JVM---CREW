package com.jvmcrew.dto.interview;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class HistoryItemDto {
    private Long id;
    private String type; // LEARNING_SESSION or MOCK_INTERVIEW
    private String topic;
    private String technology;
    private String difficulty;
    private Integer score; // optional score
    private String status;
    private Instant timestamp;
}
