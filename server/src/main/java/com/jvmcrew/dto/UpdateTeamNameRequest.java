package com.jvmcrew.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamNameRequest {
    @NotBlank(message = "Team custom name cannot be blank")
    private String customName;
}
