package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandupRequest {
    // Primary / core fields
    private java.time.LocalDate date; // Explicit calendar date (optional, defaults to today)
    private String yesterday; // Progress / accomplishments
    private String today; // Current focus / in-progress
    private String blockers; // Blocker description
    private String learned; // Learning summary
    private Integer confidence; // 1 to 5

    // Adaptive & conversational check-in extensions
    private String difficulty; // What slowed you down
    private Boolean hasBlockers;
    private String blockerCategory;
    private String blockerDuration;
    private Boolean needsHelp;
    private String helpDescription;
    private String questionForLead;
    private String nextStep;
    private String confidenceLabel; // e.g. "Comfortable", "Very confident"
    private String answersJson; // Serialized Q&A list
    private String questionsJson; // Serialized questions list

    // Input method & draft tracking
    private String inputMethodsJson; // Serialized mapping of questionId -> "text"|"voice"
    private String primaryInputMethod; // "text" or "voice"
    private Boolean isCompleted; // true = submitted, false = in progress draft

    public StandupRequest(String yesterday, String today, String blockers, String learned, Integer confidence) {
        this.yesterday = yesterday;
        this.today = today;
        this.blockers = blockers;
        this.learned = learned;
        this.confidence = confidence;
        this.isCompleted = true;
        this.primaryInputMethod = "text";
    }
}
