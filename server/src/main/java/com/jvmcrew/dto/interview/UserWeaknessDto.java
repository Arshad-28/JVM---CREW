package com.jvmcrew.dto.interview;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserWeaknessDto {
    private Long id;
    private String topic;
    private String weakConcept;
    private Integer totalAttempts;
    private Double averageScore; // e.g. 54.0 %
    private String performanceRating; // CRITICAL, WEAK, MODERATE, STRONG
    private Instant lastAttemptedAt;
}
