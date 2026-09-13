package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpDto {
    private Long id;
    private Long userId;
    private String userName;
    private Long leadId;
    private String leadName;
    private String note;
    private String status; // PENDING, COMPLETED
    private LocalDate dueDate;
    private Instant createdAt;
    private Instant completedAt;
}
