package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class SessionSummaryDto {
    private Long id;
    private String topic;
    private String technology;
    private String userInput;
    private InterviewDifficulty difficulty;
    private String summary;
    private Instant createdAt;
    private Instant completedAt;
    private int practiceQuestionsCount;
    private int codingProblemsCount;
}
