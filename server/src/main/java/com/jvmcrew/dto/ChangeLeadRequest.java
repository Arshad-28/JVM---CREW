package com.jvmcrew.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeLeadRequest {
    @NotNull(message = "New lead user ID is required")
    private Long newLeadUserId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
}
