package com.jvmcrew.model;

import com.jvmcrew.model.enums.AttemptStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "problem_attempts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "problem_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AttemptStatus status = AttemptStatus.ATTEMPTED;

    @Column(name = "time_taken_min")
    private Integer timeTakenMin;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempts = 1;

    @Column(name = "solved_at")
    private Instant solvedAt;
}
