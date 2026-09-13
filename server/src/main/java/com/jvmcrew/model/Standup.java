package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "standups", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Standup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private LocalDate date;

    // Core progress
    @Column(columnDefinition = "TEXT")
    private String yesterday; // Progress / completed work

    @Column(columnDefinition = "TEXT")
    private String today; // Current focus / in-progress work

    @Column(columnDefinition = "TEXT")
    private String blockers; // Blocker description if any

    @Column(columnDefinition = "TEXT")
    private String learned; // Learning summary

    @Column
    private Integer confidence; // 1 to 5

    // Voice submission metadata
    @Column(name = "submission_type", length = 20)
    @Builder.Default
    private String submissionType = "TEXT"; // "TEXT", "VOICE", "TEXT_AND_VOICE"

    @Column(name = "audio_file_name")
    private String audioFileName;

    @Column(name = "audio_storage_path", length = 500)
    private String audioStoragePath;

    @Column(name = "audio_content_type", length = 100)
    private String audioContentType;

    @Column(name = "audio_file_size")
    private Long audioFileSize;

    @Column(name = "audio_duration_seconds")
    private Integer audioDurationSeconds;

    // Extended adaptive check-in fields
    @Column(columnDefinition = "TEXT")
    private String difficulty; // What slowed you down / difficult concept

    @Column(name = "has_blockers")
    @Builder.Default
    private Boolean hasBlockers = false;

    @Column(name = "blocker_category")
    private String blockerCategory;

    @Column(name = "blocker_duration")
    private String blockerDuration;

    @Column(name = "needs_help")
    @Builder.Default
    private Boolean needsHelp = false;

    @Column(name = "help_description", columnDefinition = "TEXT")
    private String helpDescription;

    @Column(name = "question_for_lead", columnDefinition = "TEXT")
    private String questionForLead;

    @Column(name = "lead_answer", columnDefinition = "TEXT")
    private String leadAnswer;

    @Column(name = "lead_answered_at")
    private Instant leadAnsweredAt;

    @Column(name = "next_step", columnDefinition = "TEXT")
    private String nextStep;

    @Column(name = "confidence_label")
    private String confidenceLabel; // e.g. "Comfortable", "Very Confident"

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson; // Full structured Q&A payload

    @Column(name = "questions_json", columnDefinition = "TEXT")
    private String questionsJson; // Exact questionnaire presented on this date

    // Input method tracking for Voice vs Typed
    @Column(name = "input_methods_json", columnDefinition = "TEXT")
    private String inputMethodsJson; // e.g. {"q_progress": "text", "q_learning": "voice"}

    @Column(name = "primary_input_method")
    @Builder.Default
    private String primaryInputMethod = "text"; // "text" or "voice"

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = true;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant submittedAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;
}
