package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckInTemplateDto {
    private String dayName; // e.g. "Wednesday"
    private String focusTheme; // e.g. "Learning & Concept Clarity"
    private String greetingSubtitle; // e.g. "Quick Wednesday learning pulse — what clicked today?"
    private boolean alreadySubmitted;
    private StandupResponse todaySubmission;
    private List<CheckInQuestionDto> questions;
}
