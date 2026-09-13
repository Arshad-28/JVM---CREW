package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamDayProgressDto {
    private LocalDate date;
    private String dayLabel;
    private int standupsCount;
    private int tasksCompletedCount;
    private int homeworkSubmittedCount;
}
