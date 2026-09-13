package com.jvmcrew.model.interview;

import com.jvmcrew.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "interview_user_weaknesses", uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_topic_weakness", columnNames = {"user_id", "topic", "weak_concept"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewUserWeakness {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String topic;

    @Column(name = "weak_concept", nullable = false)
    private String weakConcept;

    @Column(name = "total_attempts", nullable = false)
    @Builder.Default
    private Integer totalAttempts = 1;

    @Column(name = "total_score", nullable = false)
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "average_score", nullable = false)
    @Builder.Default
    private Double averageScore = 0.0;

    @Column(name = "last_attempted_at", nullable = false)
    private Instant lastAttemptedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (lastAttemptedAt == null) {
            lastAttemptedAt = Instant.now();
        }
        if (totalAttempts != null && totalAttempts > 0 && totalScore != null) {
            this.averageScore = (double) totalScore / totalAttempts;
        }
    }
}
