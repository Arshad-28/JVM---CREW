package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkSubmissionResponse {
    private Long id;
    private Long homeworkId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String answerText;
    private String attachmentName;
    private String attachmentData;
    private String attachmentType;
    private String notes;
    private String status; // "SUBMITTED", "REVIEWED"
    private String leadFeedback;
    private Instant submittedAt;
    private Instant reviewedAt;
}
