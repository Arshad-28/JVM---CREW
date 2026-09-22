package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowPipelineDto {
    private int backlogCount;
    private int todoCount;
    private int inProgressCount;
    private int blockedCount;
    private int reviewCount;
    private int doneCount;
    private int totalCount;

    private int backlogPct;
    private int todoPct;
    private int inProgressPct;
    private int blockedPct;
    private int reviewPct;
    private int donePct;
}
