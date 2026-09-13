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
public class StandupResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long teamId;
    private LocalDate date;
    private String yesterday;
    private String today;
    private String blockers;
    private String learned;
    private Integer confidence;
    private Instant submittedAt;
    private boolean blockerCreated;

    // Extended adaptive check-in fields
    private String difficulty;
    private Boolean hasBlockers;
    private String blockerCategory;
    private String blockerDuration;
    private Boolean needsHelp;
    private String helpDescription;
    private String questionForLead;
    private String leadAnswer;
    private Instant leadAnsweredAt;
    private String nextStep;
    private String confidenceLabel;
    private String answersJson;
    private String questionsJson;

    // Input method & completion tracking
    private String inputMethodsJson;
    private String primaryInputMethod;
    private Boolean isCompleted;

    // Voice submission metadata
    private String submissionType; // "TEXT", "VOICE", "TEXT_AND_VOICE"
    private Boolean hasVoiceRecording;
    private String audioFileName;
    private String audioContentType;
    private Long audioFileSize;
    private Integer audioDurationSeconds;
    private String audioUrl;
}
