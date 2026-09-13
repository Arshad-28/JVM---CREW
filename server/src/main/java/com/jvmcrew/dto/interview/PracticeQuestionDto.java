package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.PracticeQuestionType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class PracticeQuestionDto {
    private Long id;
    private Long sessionId;
    private String questionText;
    private PracticeQuestionType questionType;
    private InterviewDifficulty difficulty;
    private List<String> options;
    private String hint;
    private String sampleAnswer;
    private String explanation;
    private Integer sequenceOrder;
    private Instant createdAt;
    private PracticeEvaluationDto latestAttempt;
}
