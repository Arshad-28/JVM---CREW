package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.MockInterviewType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StartMockInterviewRequest {
    @NotBlank(message = "Technology cannot be empty")
    private String technology;
    @NotBlank(message = "Topic cannot be empty")
    private String topic;
    private InterviewDifficulty difficulty;
    private MockInterviewType interviewType;
    private Integer targetQuestions;
}
