package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "homework")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false)
    private String title;

    @Column(name = "subject_topic", nullable = false)
    private String subjectTopic;

    @Column(name = "questions_json", columnDefinition = "TEXT", nullable = false)
    private String questionsJson; // JSON array of questions or text

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "attachment_name")
    private String attachmentName;

    @Column(name = "attachment_data", columnDefinition = "LONGTEXT")
    private String attachmentData;

    @Column(name = "attachment_type")
    private String attachmentType;

    @Column(name = "solution_text", columnDefinition = "LONGTEXT")
    private String solutionText;

    @Column(name = "solution_attachment_name")
    private String solutionAttachmentName;

    @Column(name = "solution_attachment_data", columnDefinition = "LONGTEXT")
    private String solutionAttachmentData;

    @Column(name = "solution_attachment_type")
    private String solutionAttachmentType;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private Boolean isPublished = false;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "is_solution_published", nullable = false)
    @Builder.Default
    private Boolean isSolutionPublished = false;

    @Column(name = "solution_published_at")
    private Instant solutionPublishedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
