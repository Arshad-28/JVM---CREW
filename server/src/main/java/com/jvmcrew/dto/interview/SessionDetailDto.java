package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class SessionDetailDto {
    private Long id;
    private String topic;
    private String technology;
    private String userInput;
    private InterviewDifficulty difficulty;
    private String summary;
    private List<String> keyConcepts;
    private List<CodeExampleDto> examples;
    private List<String> commonMistakes;
    private String interviewRelevance;
    private Instant createdAt;
    private Instant completedAt;
    private List<PracticeQuestionDto> practiceQuestions;
    private List<CodingProblemDto> codingProblems;
    private List<CoachChatMessageDto> coachMessages;
}
