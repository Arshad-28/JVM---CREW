package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.MockInterviewStatus;
import com.jvmcrew.model.interview.MockInterviewType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class MockInterviewStateDto {
    private Long id;
    private String technology;
    private String topic;
    private InterviewDifficulty difficulty;
    private MockInterviewType interviewType;
    private MockInterviewStatus status;
    private Integer targetQuestions;
    private Integer currentQuestionIndex;
    private Integer overallScore;
    private String performanceRating;
    private Instant startedAt;
    private Instant completedAt;
    private MockQuestionDto currentQuestion;
    private List<MockQuestionDto> questions;
    private MockInterviewReportDto report;
}
