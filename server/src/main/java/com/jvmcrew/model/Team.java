package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "custom_name", length = 100)
    private String customName;

    @Column(length = 100)
    @Builder.Default
    private String cohort = "Internship Cohort 2026";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public String getFormattedDisplayName() {
        if (name != null && !name.isBlank()) {
            String stripped = name.replaceAll("(?i)^JVM\\s*CREW\\s+", "").trim();
            return stripped.isEmpty() ? name.trim() : stripped;
        }
        if (customName != null && !customName.isBlank()) {
            String stripped = customName.replaceAll("(?i)^JVM\\s*CREW\\s+", "").trim();
            return stripped.isEmpty() ? customName.trim() : stripped;
        }
        return "";
    }

    public String getCrewIdPrefix() {
        String base = getFormattedDisplayName();
        if (base == null || base.isBlank()) {
            return "CREW";
        }
        String clean = base.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        return clean.isEmpty() ? "CREW" : clean;
    }
}
