package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PracticeEvaluationDto {
    private Long attemptId;
    private Long questionId;
    private String answerText;
    private Integer score; // 0-10
    private String whatYouGotRight;
    private String whatIsMissing;
    private String technicalCorrection;
    private String betterInterviewAnswer;
    private String interviewTip;
    private Instant createdAt;
}
