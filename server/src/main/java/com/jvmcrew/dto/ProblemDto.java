package com.jvmcrew.dto;

import com.jvmcrew.model.enums.AttemptStatus;
import com.jvmcrew.model.enums.ProblemDifficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemDto {
    private Long id;
    private String name;
    private String platform;
    private String topic;
    private ProblemDifficulty difficulty;
    private AttemptStatus userStatus;
    private Integer attempts;
    private Integer timeTakenMin;
    private Instant solvedAt;
}
