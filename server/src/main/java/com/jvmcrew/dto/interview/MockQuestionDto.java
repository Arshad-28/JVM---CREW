package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MockQuestionDto {
    private Long id;
    private Integer sequenceNumber;
    private String questionText;
    private String category;
    private InterviewDifficulty difficulty;
    private Instant createdAt;
    private MockAnswerDto answer;
}
