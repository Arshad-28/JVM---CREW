package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkRequest {
    private String title;
    private String subjectTopic;
    private List<String> questions;
    private String instructions;
    private LocalDate dueDate;
    private String attachmentName;
    private String attachmentData;
    private String attachmentType;
    private String solutionText;
    private String solutionAttachmentName;
    private String solutionAttachmentData;
    private String solutionAttachmentType;
    private Boolean publishNow;
    private Boolean isPublished;
}
