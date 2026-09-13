package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberHomeworkSummaryItemDto {
    private Long homeworkId;
    private String title;
    private String subject;
    private LocalDate dueDate;
    private String submissionStatus; // "SUBMITTED", "REVIEWED", "PENDING"
    private Instant submittedAt;
    private Integer score;
    private Integer maxScore;
    private String feedback;
}
