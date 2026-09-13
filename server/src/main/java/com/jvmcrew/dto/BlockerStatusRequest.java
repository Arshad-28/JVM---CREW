package com.jvmcrew.dto;

import com.jvmcrew.model.enums.BlockerStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockerStatusRequest {
    @NotNull
    private BlockerStatus status;
}
