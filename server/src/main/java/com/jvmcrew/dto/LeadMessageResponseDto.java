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
public class LeadMessageResponseDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long teamId;
    private String message;
    private String inputMethod; // "text" or "voice"
    private String relatedTopic;
    private Boolean isUrgent;
    private String status; // "OPEN" or "ANSWERED"
    private String leadResponse;
    private Instant respondedAt;
    private Instant createdAt;
}
