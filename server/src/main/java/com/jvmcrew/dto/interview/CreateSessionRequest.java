package com.jvmcrew.dto.interview;

import com.jvmcrew.model.interview.InterviewDifficulty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSessionRequest {
    @NotBlank(message = "User input topic cannot be empty")
    private String userInput;
    private String technology;
    private InterviewDifficulty difficulty;
}
