package com.jvmcrew.dto.interview;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitMockAnswerRequest {
    @NotBlank(message = "Answer cannot be empty")
    private String answer;
}
