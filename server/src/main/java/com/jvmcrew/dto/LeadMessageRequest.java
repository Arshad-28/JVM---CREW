package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMessageRequest {
    private String message;
    private String inputMethod; // "text" or "voice"
    private String relatedTopic;
    private Boolean isUrgent;
}
