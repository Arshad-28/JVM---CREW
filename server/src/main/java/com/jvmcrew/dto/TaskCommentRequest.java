package com.jvmcrew.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentRequest {
    @NotBlank(message = "Comment body cannot be blank")
    private String body;
}
