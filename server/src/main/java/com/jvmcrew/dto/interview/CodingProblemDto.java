package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class CodingProblemDto {
    private Long id;
    private Long sessionId;
    private String title;
    private String problemStatement;
    private InterviewDifficulty difficulty;
    private String questionType;
    private String language;
    private List<CodingExampleDto> examples;
    private List<String> constraints;
    private String starterCode;
    private String hint;
    private List<String> hints;
    private CodingSolutionDto solution;
    private Instant createdAt;
    private CodeReviewDto latestAttempt;
}
