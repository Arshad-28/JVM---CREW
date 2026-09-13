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
public class MemberHomeworkStatusDto {
    private Long userId;
    private String name;
    private String email;
    private String status; // "Pending", "Submitted", "Reviewed", "Overdue"
    private Boolean isSubmitted;
    private Boolean isReviewed;
    private Instant submittedAt;
    private Long submissionId;
    private String answerText;
    private String attachmentName;
    private String attachmentData;
    private String attachmentType;
    private String notes;
    private String leadFeedback;
    private Boolean isReminded;
}
