package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyActivityItemDto {
    private String date; // "2026-09-22"
    private String dayOfWeek; // "MON", "TUE", etc.
    private String dayLabel; // "Mon, Sep 22"
    private boolean isWorkday; // Mon-Fri
    private boolean isToday;

    private int tasksCompleted;
    private int tasksAssigned;
    private int standupsSubmitted;
    private int standupsExpected;
    private int homeworkSubmitted;
    private int interviewSessions;
    private int meetingsConducted;
    private int activeBlockersReported;

    private boolean hasActivity;
}
