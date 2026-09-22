package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PeriodComparisonDto {
    private String metricName; // e.g. "Tasks Completed", "Standup Compliance"
    private double currentValue;
    private double previousValue;
    private double absoluteChange;
    private Double percentageChange; // null if previousValue is 0 to prevent division by zero
    private String changeDirection; // "INCREASED", "DECREASED", "UNCHANGED", "NOT_APPLICABLE"
    private String unit; // "tasks", "%", "submissions", etc.
    private String explanation; // e.g. "+3 tasks compared to prior matching period"
}
