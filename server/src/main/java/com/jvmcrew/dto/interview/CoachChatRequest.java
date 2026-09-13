package com.jvmcrew.dto.interview;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CoachChatRequest {
    @NotBlank(message = "Message cannot be empty")
    private String message;
}
