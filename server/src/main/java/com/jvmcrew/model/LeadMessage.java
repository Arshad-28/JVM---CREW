package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "lead_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "input_method", nullable = false)
    @Builder.Default
    private String inputMethod = "text"; // "text" or "voice"

    @Column(name = "related_topic")
    private String relatedTopic;

    @Column(name = "is_urgent", nullable = false)
    @Builder.Default
    private Boolean isUrgent = false;

    @Column(nullable = false)
    @Builder.Default
    private String status = "OPEN"; // "OPEN" or "ANSWERED"

    @Column(name = "lead_response", columnDefinition = "TEXT")
    private String leadResponse;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
