package com.jvmcrew.dto.interview;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmitCodeReviewRequest {
    @NotBlank(message = "Code cannot be empty")
    private String code;
    private String language;
}
