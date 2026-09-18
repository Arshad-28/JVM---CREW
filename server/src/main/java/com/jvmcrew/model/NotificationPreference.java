package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "notification_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "push_enabled", nullable = false)
    @Builder.Default
    private Boolean pushEnabled = true;

    @Column(name = "task_assigned", nullable = false)
    @Builder.Default
    private Boolean taskAssigned = true;

    @Column(name = "task_reviews", nullable = false)
    @Builder.Default
    private Boolean taskReviews = true;

    @Column(name = "homework_published", nullable = false)
    @Builder.Default
    private Boolean homeworkPublished = true;

    @Column(name = "homework_reviews", nullable = false)
    @Builder.Default
    private Boolean homeworkReviews = true;

    @Column(name = "standup_reminders", nullable = false)
    @Builder.Default
    private Boolean standupReminders = true;

    @Column(name = "team_updates", nullable = false)
    @Builder.Default
    private Boolean teamUpdates = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
