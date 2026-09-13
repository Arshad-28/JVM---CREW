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
public class MockAnswerDto {
    private Long id;
    private Long mockQuestionId;
    private String answerText;
    private Integer score; // 0-10
    private String evaluationSummary;
    private String technicalFeedback;
    private String betterResponse;
    private Instant createdAt;
}
