package com.jvmcrew.model.interview;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_coding_problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewCodingProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewLearningSession session;

    @Column(nullable = false)
    private String title;

    @Column(name = "problem_statement", nullable = false, columnDefinition = "TEXT")
    private String problemStatement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private InterviewDifficulty difficulty;

    @Column(name = "question_type", length = 50)
    @Builder.Default
    private String questionType = "PROGRAM";

    @Column(name = "language", length = 50)
    @Builder.Default
    private String language = "JAVA";

    @Column(name = "examples_json", columnDefinition = "TEXT")
    private String examplesJson;

    @Column(name = "constraints_json", columnDefinition = "TEXT")
    private String constraintsJson;

    @Column(name = "starter_code", columnDefinition = "TEXT")
    private String starterCode;

    @Column(name = "solution_approach", columnDefinition = "TEXT")
    private String solutionApproach;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(name = "hints_json", columnDefinition = "TEXT")
    private String hintsJson;

    @Column(name = "solution_json", columnDefinition = "TEXT")
    private String solutionJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewCodingAttempt> attempts = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
