package com.jvmcrew.model.interview;

import com.jvmcrew.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "interview_practice_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewPracticeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private InterviewPracticeQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewLearningSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "what_you_got_right", columnDefinition = "TEXT")
    private String whatYouGotRight;

    @Column(name = "what_is_missing", columnDefinition = "TEXT")
    private String whatIsMissing;

    @Column(name = "technical_correction", columnDefinition = "TEXT")
    private String technicalCorrection;

    @Column(name = "better_interview_answer", columnDefinition = "TEXT")
    private String betterInterviewAnswer;

    @Column(name = "interview_tip", columnDefinition = "TEXT")
    private String interviewTip;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
