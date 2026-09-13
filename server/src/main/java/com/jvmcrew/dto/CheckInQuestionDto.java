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
public class CheckInQuestionDto {
    private String id;
    private String category; // PROGRESS, CURRENT_WORK, LEARNING, DIFFICULTY, BLOCKER, HELP, QUESTION_FOR_LEAD, NEXT_STEP, REFLECTION, CONFIDENCE
    private String questionText;
    private String questionType; // TEXTAREA, YES_NO, CONFIDENCE_TIERS, SINGLE_SELECT
    private String placeholder;
    private String subtitle;
    private boolean required;
    private List<String> options;
    private String dependsOnQuestionId;
    private String showIfValue; // e.g. "YES"
}
