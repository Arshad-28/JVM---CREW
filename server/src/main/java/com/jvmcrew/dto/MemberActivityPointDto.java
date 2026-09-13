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
public class MemberActivityPointDto {
    private String type; // "STANDUP", "TASK", "HOMEWORK", "DSA"
    private String title;
    private String description;
    private Instant timestamp;
    private Long standupId;
    private String submissionType;
    private Boolean hasVoiceRecording;
    private Integer audioDurationSeconds;
    private String audioUrl;
}
