package com.jvmcrew.model.interview;

import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_mock_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewMockSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false, length = 100)
    private String technology;

    @Column(nullable = false)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private InterviewDifficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false, length = 50)
    private MockInterviewType interviewType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private MockInterviewStatus status;

    @Column(name = "target_questions", nullable = false)
    @Builder.Default
    private Integer targetQuestions = 5;

    @Column(name = "current_question_index", nullable = false)
    @Builder.Default
    private Integer currentQuestionIndex = 0;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "performance_rating", length = 50)
    private String performanceRating;

    @Column(name = "report_json", columnDefinition = "TEXT")
    private String reportJson;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "mockSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequenceNumber ASC")
    @Builder.Default
    private List<InterviewMockQuestion> questions = new ArrayList<>();

    @OneToMany(mappedBy = "mockSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewMockAnswer> answers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
        if (status == null) {
            status = MockInterviewStatus.IN_PROGRESS;
        }
    }
}
