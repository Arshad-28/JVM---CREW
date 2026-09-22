package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataDerivedInsightDto {
    private String category; // "WHAT_HAPPENED", "WHAT_IS_HAPPENING", "WHAT_IS_CHANGING", "WHAT_NEEDS_ATTENTION"
    private String title;
    private String insightText;
    private String metricReference; // e.g. "tasksCompleted", "standupParticipationRate"
    private String supportingData; // e.g. "5 of 8 tasks completed (62%)"
}
