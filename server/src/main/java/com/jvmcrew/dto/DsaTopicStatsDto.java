package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DsaTopicStatsDto {
    private String topic;
    private int targetCount;
    private int solvedCount;
    private int attemptedCount;
    private int completionPct; // Derived: (solvedCount * 100) / targetCount
    private List<ProblemDto> problems;
}
