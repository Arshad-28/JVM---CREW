package com.jvmcrew.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "standup_pdfs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandupPdf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "standup_id")
    private Standup standup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "report_type", nullable = false, length = 20)
    private String reportType; // 'INDIVIDUAL' or 'TEAM'

    @Column(nullable = false)
    private String filename;

    @Column(name = "content_type", nullable = false)
    @Builder.Default
    private String contentType = "application/pdf";

    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARBINARY)
    @Column(name = "pdf_data", nullable = false)
    private byte[] pdfData;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}

