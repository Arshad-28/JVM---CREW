package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkResponse {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long creatorId;
    private String creatorName;
    private String title;
    private String subjectTopic;
    private List<String> questions;
    private String instructions;
    private LocalDate dueDate;
    private Boolean isOverdue;
    private String attachmentName;
    private String attachmentData;
    private String attachmentType;
    private String solutionText;
    private String solutionAttachmentName;
    private String solutionAttachmentData;
    private String solutionAttachmentType;
    private Boolean isPublished;
    private Instant publishedAt;
    private Boolean isSolutionPublished;
    private Instant solutionPublishedAt;
    private Instant createdAt;

    // Computed Stats
    private Integer totalMembers;
    private Integer submittedCount;
    private Integer reviewedCount;
    private Integer pendingCount;

    // Member View Context
    private HomeworkSubmissionResponse mySubmission;
    private String myStatus; // "Pending", "Submitted", "Reviewed", "Overdue"
    private Boolean isReminded;

    // Lead View Context
    private List<MemberHomeworkStatusDto> memberSubmissions;
}
