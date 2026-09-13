package com.jvmcrew.dto;

import com.jvmcrew.model.enums.AttemptStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProblemAttemptRequest {
    @NotNull
    private Long problemId;

    @NotNull
    private AttemptStatus status;

    private Integer timeTakenMin;
}
