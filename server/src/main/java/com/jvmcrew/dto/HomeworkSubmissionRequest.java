package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeworkSubmissionRequest {
    private String answerText;
    private String attachmentName;
    private String attachmentData;
    private String attachmentType;
    private String notes;
}
