package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingHintResponseDto {
    private String hint;
    private Integer hintIndex;
    private Integer totalHints;
    private Boolean hasMoreHints;
}
