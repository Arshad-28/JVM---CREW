package com.jvmcrew.service;

import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.StandupPdfRepository;
import com.jvmcrew.repository.StandupRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StandupPdfService {

    private final StandupPdfRepository standupPdfRepository;
    private final StandupRepository standupRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final LeadershipService leadershipService;

    // Palette Colors
    private static final Color COLOR_INK = new Color(17, 24, 39);
    private static final Color COLOR_EMERALD = new Color(5, 150, 105);
    private static final Color COLOR_MUTED = new Color(107, 114, 128);
    private static final Color COLOR_CARD_BG = new Color(249, 250, 251);
    private static final Color COLOR_BORDER = new Color(229, 231, 235);
    private static final Color COLOR_SUCCESS_TEXT = new Color(6, 95, 70);
    private static final Color COLOR_PENDING_TEXT = new Color(153, 27, 27);

    // Fonts
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, COLOR_INK);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 9, COLOR_MUTED);
    private static final Font FONT_SECTION_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10.5f, COLOR_INK);
    private static final Font FONT_LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, new Color(75, 85, 99));
    private static final Font FONT_VALUE = FontFactory.getFont(FontFactory.HELVETICA, 9f, COLOR_INK);
    private static final Font FONT_VALUE_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, COLOR_INK);
    private static final Font FONT_BADGE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, COLOR_SUCCESS_TEXT);
    private static final Font FONT_BADGE_PENDING = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, COLOR_PENDING_TEXT);
    private static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, new Color(156, 163, 175));

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a (z)", Locale.ENGLISH).withZone(ZoneId.of("Asia/Kolkata"));

    @Transactional
    public StandupPdf getOrGenerateIndividualStandupPdf(Long standupId, User requester) {
        Standup standup = standupRepository.findById(standupId)
                .orElseThrow(() -> new IllegalArgumentException("Standup not found: " + standupId));

        TeamMember requesterMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(requester)
                .orElseThrow(() -> new IllegalStateException("Requester does not belong to any active team"));

        boolean isLead = requesterMember.getRole() == Role.LEAD && requesterMember.getTeam().getId().equals(standup.getTeam().getId());
        boolean isOwner = standup.getUser().getId().equals(requester.getId());

        if (!isLead && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to download this standup report.");
        }

        User user = standup.getUser();
        Team team = standup.getTeam();
        TeamMember teamMember = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, user)
                .orElseGet(() -> teamMemberRepository.findFirstByUserAndIsActiveTrue(user).orElse(null));

        byte[] pdfBytes = generateIndividualStandupPdfBytes(standup, user, teamMember, team);

        String cleanName = user.getName().replaceAll("[^a-zA-Z0-9]", "_");
        String filename = String.format("JVM-CREW-Daily-Standup-%s-%s.pdf", cleanName, standup.getDate());

        // Check for existing record
        Optional<StandupPdf> existingOpt = standupPdfRepository.findFirstByReportTypeAndStandupOrderByIdDesc("INDIVIDUAL", standup);
        StandupPdf pdfEntity;
        if (existingOpt.isPresent()) {
            pdfEntity = existingOpt.get();
            pdfEntity.setPdfData(pdfBytes);
            pdfEntity.setFilename(filename);
            pdfEntity.setCreatedAt(Instant.now());
        } else {
            pdfEntity = StandupPdf.builder()
                    .standup(standup)
                    .user(user)
                    .team(team)
                    .reportDate(standup.getDate())
                    .reportType("INDIVIDUAL")
                    .filename(filename)
                    .contentType("application/pdf")
                    .pdfData(pdfBytes)
                    .createdAt(Instant.now())
                    .build();
        }

        return standupPdfRepository.save(pdfEntity);
    }

    @Transactional
    public StandupPdf getOrGenerateTeamStandupPdf(LocalDate date, Long leadUserId) {
        User lead = userRepository.findById(leadUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + leadUserId));

        TeamMember leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));

        if (leadMember.getRole() != Role.LEAD) {
            throw new org.springframework.security.access.AccessDeniedException("Only Team Leads can export daily team standup reports.");
        }

        Team team = leadMember.getTeam();
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<TeamMember> allMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        List<Standup> standups = standupRepository.findByTeamAndDateAndIsCompletedTrue(team, targetDate);

        byte[] pdfBytes = generateTeamDailyStandupPdfBytes(team, targetDate, allMembers, standups, lead);
        String filename = String.format("JVM-CREW-Team-Standup-%s-%s.pdf", team.getName().replaceAll("[^a-zA-Z0-9]", "_"), targetDate);

        Optional<StandupPdf> existingOpt = standupPdfRepository.findFirstByReportTypeAndTeamAndReportDateOrderByIdDesc("TEAM", team, targetDate);
        StandupPdf pdfEntity;
        if (existingOpt.isPresent()) {
            pdfEntity = existingOpt.get();
            pdfEntity.setPdfData(pdfBytes);
            pdfEntity.setFilename(filename);
            pdfEntity.setCreatedAt(Instant.now());
        } else {
            pdfEntity = StandupPdf.builder()
                    .user(lead)
                    .team(team)
                    .reportDate(targetDate)
                    .reportType("TEAM")
                    .filename(filename)
                    .contentType("application/pdf")
                    .pdfData(pdfBytes)
                    .createdAt(Instant.now())
                    .build();
        }

        return standupPdfRepository.save(pdfEntity);
    }

    public byte[] generateIndividualStandupPdfBytes(Standup standup, User user, TeamMember teamMember, Team team) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            boolean isVoice = "VOICE".equalsIgnoreCase(standup.getSubmissionType()) ||
                    (standup.getAudioStoragePath() != null && !standup.getAudioStoragePath().isBlank());

            // 1. BRAND HEADER TABLE
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{70, 30});
            headerTable.setSpacingAfter(12);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            Paragraph brandTitle = new Paragraph("JVM CREW", FONT_TITLE);
            String subTitle = isVoice
                    ? "DAILY STANDUP REPORT - PERSISTENT AUDIO AUDIT RECORD"
                    : "DAILY STANDUP REPORT - POSTGRESQL AUDIT RECORD";
            Paragraph brandSubtitle = new Paragraph(subTitle, FONT_SUBTITLE);
            titleCell.addElement(brandTitle);
            titleCell.addElement(brandSubtitle);
            headerTable.addCell(titleCell);

            PdfPCell badgeCell = new PdfPCell();
            badgeCell.setBorder(Rectangle.NO_BORDER);
            badgeCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph statusBadge = new Paragraph(isVoice ? "STATUS: SUBMITTED [VOICE] [OK]" : "STATUS: SUBMITTED [OK]", FONT_BADGE);
            statusBadge.setAlignment(Element.ALIGN_RIGHT);
            badgeCell.addElement(statusBadge);
            headerTable.addCell(badgeCell);

            document.add(headerTable);

            // 2. METADATA ROSTER BOX (Dynamic Lead Resolution)
            PdfPTable metaTable = new PdfPTable(4);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{25, 25, 25, 25});
            metaTable.setSpacingAfter(14);

            String serialId = teamMember != null && teamMember.getSerialNumber() != null ? teamMember.getSerialNumber() : ("JVM-00" + user.getId());
            String roleTitle = "SDE Intern (" + (teamMember != null && teamMember.getRole() == Role.LEAD ? "LEAD" : "MEMBER") + ")";
            String position = teamMember != null && teamMember.getPosition() != null ? teamMember.getPosition() : "Software Engineer Intern";

            Optional<User> activeLeadOpt = leadershipService != null ? leadershipService.resolveActiveLeadForDate(team, standup.getDate()) : Optional.empty();
            String leadName = activeLeadOpt.map(User::getName).orElse("Team Lead");

            // Row 1
            addMetaCell(metaTable, "MEMBER NAME", user.getName());
            addMetaCell(metaTable, "SERIAL ID", serialId);
            addMetaCell(metaTable, "TEAM / COHORT", team.getName());
            addMetaCell(metaTable, "CURRENT TEAM LEAD", leadName);

            // Row 2
            addMetaCell(metaTable, "DATE", standup.getDate().format(DATE_FORMATTER));
            addMetaCell(metaTable, "SUBMISSION TYPE", isVoice ? "VOICE RECORDING" : "WRITTEN STANDUP");
            addMetaCell(metaTable, "SUBMITTED AT", TIME_FORMATTER.format(standup.getSubmittedAt()));
            addMetaCell(metaTable, "CONFIDENCE RATING", (standup.getConfidenceLabel() != null ? standup.getConfidenceLabel() : (standup.getConfidence() + "/5")));

            document.add(metaTable);

            // 3. SECTION CARDS (Omit empty sections)
            if (isVoice) {
                String durStr = standup.getAudioDurationSeconds() != null && standup.getAudioDurationSeconds() > 0
                        ? (standup.getAudioDurationSeconds() + " seconds")
                        : "Recorded";
                String audioDetails = String.format(
                        "Voice standup recording submitted and securely archived in persistent storage.\n" +
                        "• Audio File: %s\n" +
                        "• Duration: %s\n" +
                        "• Media Format: %s\n" +
                        "• Storage Status: Archived securely in persistent storage under team vault.\n" +
                        "• Playback Access: Authenticated web application streaming verified.",
                        standup.getAudioFileName() != null ? standup.getAudioFileName() : "standup_voice_recording.webm",
                        durStr,
                        standup.getAudioContentType() != null ? standup.getAudioContentType() : "audio/webm"
                );
                addSectionCard(document, "1. Voice Standup Recording Details", audioDetails, COLOR_EMERALD);
            } else {
                if (standup.getYesterday() != null && !standup.getYesterday().isBlank()) {
                    addSectionCard(document, "1. What Did You Work On / Complete Today?", standup.getYesterday(), COLOR_EMERALD);
                }
                if (standup.getToday() != null && !standup.getToday().isBlank()) {
                    addSectionCard(document, "2. What Are You Working On Next / Current Focus?", standup.getToday(), COLOR_INK);
                }
                if (standup.getLearned() != null && !standup.getLearned().isBlank()) {
                    addSectionCard(document, "3. Technical Learning & Concept Mastery", standup.getLearned(), COLOR_INK);
                }
            }

            // Blocker section
            boolean hasBlocker = Boolean.TRUE.equals(standup.getHasBlockers()) || (standup.getBlockers() != null && !standup.getBlockers().isBlank());
            if (hasBlocker) {
                addSectionCard(document, isVoice ? "2. Roadblocks / Blockers" : "4. Roadblocks / Blockers", standup.getBlockers(), COLOR_PENDING_TEXT);
            } else {
                addSectionCard(document, isVoice ? "2. Roadblocks / Blockers" : "4. Roadblocks / Blockers", "No blockers reported. Progress is on track.", COLOR_MUTED);
            }

            // Lead question & notes
            if (standup.getQuestionForLead() != null && !standup.getQuestionForLead().isBlank()) {
                addSectionCard(document, isVoice ? "3. Questions / Notes for Team Lead" : "5. Questions / Notes for Team Lead", standup.getQuestionForLead(), COLOR_INK);
                if (standup.getLeadAnswer() != null && !standup.getLeadAnswer().isBlank()) {
                    addSectionCard(document, "   Feedback / Response from Team Lead:", standup.getLeadAnswer(), COLOR_EMERALD);
                }
            }

            // 4. FOOTER VERIFICATION BAR
            Paragraph footer = new Paragraph(
                    String.format("Official JVM CREW Standup Audit Record - Generated: %s - Validated by PostgreSQL Persistence Engine",
                            TIME_FORMATTER.format(Instant.now())),
                    FONT_FOOTER);
            footer.setSpacingBefore(16);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate individual standup PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating standup PDF: " + e.getMessage());
        }
    }

    public byte[] generateTeamDailyStandupPdfBytes(Team team, LocalDate date, List<TeamMember> teamMembers, List<Standup> standups, User lead) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. HEADER
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{70, 30});
            headerTable.setSpacingAfter(10);

            PdfPCell titleCell = new PdfPCell();
            titleCell.setBorder(Rectangle.NO_BORDER);
            Paragraph brandTitle = new Paragraph("JVM CREW", FONT_TITLE);
            Paragraph brandSubtitle = new Paragraph("DAILY TEAM STANDUP REPORT - COHORT ACCOUNTABILITY AUDIT", FONT_SUBTITLE);
            titleCell.addElement(brandTitle);
            titleCell.addElement(brandSubtitle);
            headerTable.addCell(titleCell);

            PdfPCell dateCell = new PdfPCell();
            dateCell.setBorder(Rectangle.NO_BORDER);
            dateCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph dateP = new Paragraph(date.format(DATE_FORMATTER), FONT_VALUE_BOLD);
            dateP.setAlignment(Element.ALIGN_RIGHT);
            Paragraph leadP = new Paragraph("Lead: " + lead.getName(), FONT_SUBTITLE);
            leadP.setAlignment(Element.ALIGN_RIGHT);
            dateCell.addElement(dateP);
            dateCell.addElement(leadP);
            headerTable.addCell(dateCell);

            document.add(headerTable);

            // 2. EXECUTIVE SUMMARY STATS TABLE
            int total = teamMembers.size();
            Map<Long, Standup> standupByUser = standups.stream()
                    .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (s1, s2) -> s1));

            int submitted = (int) teamMembers.stream().filter(tm -> standupByUser.containsKey(tm.getUser().getId())).count();
            int pending = total - submitted;
            long blockersCount = standups.stream().filter(s -> Boolean.TRUE.equals(s.getHasBlockers()) || (s.getBlockers() != null && !s.getBlockers().isBlank())).count();

            PdfPTable summaryTable = new PdfPTable(4);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{25, 25, 25, 25});
            summaryTable.setSpacingAfter(14);

            addMetaCell(summaryTable, "TOTAL MEMBERS", total + " Engineers");
            addMetaCell(summaryTable, "SUBMITTED TODAY", submitted + " / " + total + String.format(" (%.0f%%)", total > 0 ? (submitted * 100.0 / total) : 0));
            addMetaCell(summaryTable, "PENDING CHECK-INS", pending + " / " + total);
            addMetaCell(summaryTable, "OPEN BLOCKERS", blockersCount + " Reported");

            document.add(summaryTable);

            // 3. MEMBER BREAKDOWN CARDS
            Paragraph sectionTitle = new Paragraph("MEMBER SUBMISSION ROSTER & AUDIT", FONT_SECTION_HEADER);
            sectionTitle.setSpacingAfter(6);
            document.add(sectionTitle);

            for (TeamMember tm : teamMembers) {
                User u = tm.getUser();
                Standup s = standupByUser.get(u.getId());
                boolean isSubmitted = s != null;
                boolean isVoice = isSubmitted && ("VOICE".equalsIgnoreCase(s.getSubmissionType()) || (s.getAudioStoragePath() != null && !s.getAudioStoragePath().isBlank()));

                PdfPTable card = new PdfPTable(1);
                card.setWidthPercentage(100);
                card.setSpacingAfter(8);

                PdfPCell cell = new PdfPCell();
                cell.setBackgroundColor(isSubmitted ? COLOR_CARD_BG : new Color(255, 245, 245));
                cell.setBorderColor(isSubmitted ? COLOR_BORDER : new Color(254, 202, 202));
                cell.setPadding(8);

                // Member header line
                PdfPTable memHeader = new PdfPTable(2);
                memHeader.setWidthPercentage(100);
                memHeader.setWidths(new float[]{70, 30});

                String serial = tm.getSerialNumber() != null ? tm.getSerialNumber() : ("JVM-00" + u.getId());
                PdfPCell nameC = new PdfPCell(new Paragraph(serial + " - " + u.getName() + " (" + u.getEmail() + ")", FONT_VALUE_BOLD));
                nameC.setBorder(Rectangle.NO_BORDER);
                memHeader.addCell(nameC);

                PdfPCell statusC = new PdfPCell();
                statusC.setBorder(Rectangle.NO_BORDER);
                statusC.setHorizontalAlignment(Element.ALIGN_RIGHT);

                Paragraph badge;
                if (isSubmitted) {
                    if (isVoice) {
                        String durStr = s.getAudioDurationSeconds() != null && s.getAudioDurationSeconds() > 0 ? (s.getAudioDurationSeconds() + "s") : "VOICE";
                        badge = new Paragraph("SUBMITTED [VOICE: " + durStr + "] (" + TIME_FORMATTER.format(s.getSubmittedAt()) + ")", FONT_BADGE);
                    } else {
                        badge = new Paragraph("SUBMITTED [OK] (" + TIME_FORMATTER.format(s.getSubmittedAt()) + ")", FONT_BADGE);
                    }
                } else {
                    badge = new Paragraph("NOT SUBMITTED (PENDING)", FONT_BADGE_PENDING);
                }
                badge.setAlignment(Element.ALIGN_RIGHT);
                statusC.addElement(badge);
                memHeader.addCell(statusC);

                cell.addElement(memHeader);

                // Answers content
                if (isSubmitted) {
                    if (isVoice) {
                        String dur = s.getAudioDurationSeconds() != null && s.getAudioDurationSeconds() > 0 ? (s.getAudioDurationSeconds() + " seconds") : "Recorded";
                        Paragraph pVoice = new Paragraph("Submission: Voice Standup Recording (" + dur + ") - Archived in persistent storage.", FONT_VALUE);
                        pVoice.setSpacingBefore(3);
                        cell.addElement(pVoice);
                    } else {
                        Paragraph pWork = new Paragraph("Progress: " + s.getYesterday(), FONT_VALUE);
                        Paragraph pFocus = new Paragraph("Next Focus: " + s.getToday(), FONT_VALUE);
                        Paragraph pLearned = new Paragraph("Learned: " + s.getLearned(), FONT_VALUE);
                        pWork.setSpacingBefore(3);
                        cell.addElement(pWork);
                        cell.addElement(pFocus);
                        cell.addElement(pLearned);
                    }

                    if (Boolean.TRUE.equals(s.getHasBlockers()) || (s.getBlockers() != null && !s.getBlockers().isBlank())) {
                        Paragraph pBlock = new Paragraph("Blocker: " + s.getBlockers(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_PENDING_TEXT));
                        cell.addElement(pBlock);
                    }
                } else {
                    Paragraph pEmpty = new Paragraph("No standup update submitted for this calendar date.", FONT_SUBTITLE);
                    pEmpty.setSpacingBefore(3);
                    cell.addElement(pEmpty);
                }

                card.addCell(cell);
                document.add(card);
            }

            // 4. FOOTER
            Paragraph footer = new Paragraph(
                    String.format("Official JVM CREW Daily Standup Summary Report - Exported by %s - Generated at %s",
                            lead.getName(), TIME_FORMATTER.format(Instant.now())),
                    FONT_FOOTER);
            footer.setSpacingBefore(12);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate team standup PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating team standup PDF: " + e.getMessage());
        }
    }

    private void addMetaCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_CARD_BG);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6);

        Paragraph pLabel = new Paragraph(label, FONT_LABEL);
        Paragraph pVal = new Paragraph(value != null ? value : "-", FONT_VALUE_BOLD);
        pVal.setSpacingBefore(2);

        cell.addElement(pLabel);
        cell.addElement(pVal);
        table.addCell(cell);
    }

    private void addSectionCard(Document document, String title, String content, Color accentColor) throws DocumentException {
        PdfPTable card = new PdfPTable(1);
        card.setWidthPercentage(100);
        card.setSpacingAfter(8);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_CARD_BG);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(8);

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, accentColor);
        Paragraph pTitle = new Paragraph(title, titleFont);
        Paragraph pContent = new Paragraph(content != null && !content.isBlank() ? content : "No details entered.", FONT_VALUE);
        pContent.setSpacingBefore(4);

        cell.addElement(pTitle);
        cell.addElement(pContent);
        card.addCell(cell);

        document.add(card);
    }
}

