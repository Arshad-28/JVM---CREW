package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeReviewDto {
    private Long attemptId;
    private Long problemId;
    private Integer score; // 0-100
    private String status;
    private String summary;
    private String correctnessAnalysis;
    private String timeComplexity;
    private String spaceComplexity;
    private List<String> edgeCases;
    private List<String> suggestedImprovements;
    private String optimizedSolution;
    private Instant createdAt;
}
