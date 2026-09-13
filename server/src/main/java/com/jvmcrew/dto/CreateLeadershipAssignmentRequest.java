package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadershipAssignmentRequest {
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
}
