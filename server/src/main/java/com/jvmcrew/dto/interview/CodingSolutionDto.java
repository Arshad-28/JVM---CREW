package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingSolutionDto {
    private String code;
    private String explanation;
    private String approach;
    private String timeComplexity;
    private String spaceComplexity;
    private String syntaxNotes;
    private String whyItWorks;
    private String exampleWalkthrough;
    private List<String> edgeCases;
}
