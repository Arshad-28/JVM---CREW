package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyTrendDto {
    private String weekLabel; // "Week 1", "Sep 1 - Sep 7"
    private String startDate;
    private String endDate;
    private int tasksCompleted;
    private int tasksAssigned;
    private int standupsSubmitted;
    private int homeworkSubmitted;
    private int interviewSessions;
    private int activeMembers;
}
