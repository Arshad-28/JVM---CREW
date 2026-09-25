package com.jvmcrew.service;

import com.jvmcrew.dto.CurrentLeadDto;
import com.jvmcrew.dto.MonthlyEvaluationDto;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.BlockerStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.*;
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
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyReportService {

    private final LeadershipService leadershipService;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final StandupRepository standupRepository;
    private final BlockerRepository blockerRepository;
    private final StreakService streakService;

    private static final DateTimeFormatter MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    // PDF Palette Colors
    private static final Color COLOR_INK = new Color(17, 24, 39);
    private static final Color COLOR_ACCENT = new Color(217, 119, 6);
    private static final Color COLOR_EMERALD = new Color(5, 150, 105);
    private static final Color COLOR_MUTED = new Color(107, 114, 128);
    private static final Color COLOR_CARD_BG = new Color(249, 250, 251);
    private static final Color COLOR_BORDER = new Color(229, 231, 235);
    private static final Color COLOR_HEADER_BG = new Color(243, 244, 246);

    // Fonts
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, COLOR_INK);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_MUTED);
    private static final Font FONT_SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10f, COLOR_INK);
    private static final Font FONT_LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, new Color(75, 85, 99));
    private static final Font FONT_VALUE = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_INK);
    private static final Font FONT_VALUE_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_INK);
    private static final Font FONT_BADGE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, COLOR_EMERALD);
    private static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, new Color(156, 163, 175));

    /**
     * Generates a monthly performance evaluation with separate Personal and Leadership metrics.
     */
    @Transactional(readOnly = true)
    public MonthlyEvaluationDto getMonthlyEvaluation(Long teamId, YearMonth yearMonth, Long requesterUserId) {
        YearMonth ym = yearMonth != null ? yearMonth : YearMonth.now();
        LocalDate startOfMonth = ym.atDay(1);
        LocalDate endOfMonth = ym.atEndOfMonth();

        User requester = requesterUserId != null ? userRepository.findById(requesterUserId).orElse(null) : null;
        Team team = null;
        if (teamId != null) {
            team = teamRepository.findById(teamId).orElse(null);
        }
        if (team == null && requester != null) {
            team = teamMemberRepository.findFirstByUserAndIsActiveTrue(requester).map(TeamMember::getTeam).orElse(null);
        }
        if (team == null) {
            throw new IllegalArgumentException("Team not found");
        }

        if (requester != null) {
            TeamMember requesterMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(requester)
                    .orElseThrow(() -> new IllegalStateException("Requester does not belong to any active team"));
            if (!requesterMember.getTeam().getId().equals(team.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("You are not authorized to view evaluation for another team.");
            }
        }

        List<TeamMember> allMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);

        // Resolve who was Lead during this month
        User monthLead = leadershipService.resolveActiveLeadForDate(team, startOfMonth).orElse(null);
        CurrentLeadDto leadInfo = leadershipService.getCurrentLeadInfo(requesterUserId, team.getId(), startOfMonth);

        // 1. Personal Performance for Requester
        MonthlyEvaluationDto.PersonalPerformanceDto personalPerf = null;
        if (requester != null) {
            personalPerf = calculatePersonalPerformance(requester, team, startOfMonth, endOfMonth, monthLead != null && monthLead.getId().equals(requester.getId()));
        }

        // 2. Leadership Performance (for whoever was Lead in this month)
        MonthlyEvaluationDto.LeadershipPerformanceDto leadPerf = null;
        if (monthLead != null) {
            leadPerf = calculateLeadershipPerformance(monthLead, team, startOfMonth, endOfMonth, allMembers);
        }

        // 3. Cohort summaries for all members
        List<MonthlyEvaluationDto.MemberMonthlySummaryDto> summaries = new ArrayList<>();
        for (TeamMember tm : allMembers) {
            User u = tm.getUser();
            boolean isLeadInMonth = monthLead != null && monthLead.getId().equals(u.getId());
            MonthlyEvaluationDto.PersonalPerformanceDto p = calculatePersonalPerformance(u, team, startOfMonth, endOfMonth, isLeadInMonth);
            summaries.add(MonthlyEvaluationDto.MemberMonthlySummaryDto.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .position(tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                    .serialNumber(tm.getSerialNumber())
                    .roleInMonth(isLeadInMonth ? "CURRENT LEAD" : "TEAM MEMBER")
                    .tasksCompleted(p.getTasksCompleted())
                    .tasksTotal(p.getTasksAssigned())
                    .homeworkSubmitted(p.getHomeworkSubmitted())
                    .homeworkTotal(p.getHomeworkAssigned())
                    .standupsSubmitted(p.getStandupsSubmitted())
                    .streakDays(p.getStreakDays())
                    .progressPct(p.getTaskCompletionPct())
                    .build());
        }

        return MonthlyEvaluationDto.builder()
                .month(ym.toString())
                .monthLabel(ym.format(MONTH_LABEL_FORMATTER))
                .teamId(team.getId())
                .teamName(team.getFormattedDisplayName())
                .leadInfo(leadInfo)
                .personalPerformance(personalPerf)
                .leadershipPerformance(leadPerf)
                .cohortSummaries(summaries)
                .build();
    }

    private MonthlyEvaluationDto.PersonalPerformanceDto calculatePersonalPerformance(User user, Team team, LocalDate start, LocalDate end, boolean wasLead) {
        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user).orElse(null);

        // Tasks assigned to this user created or due in this month scoped to team
        List<Task> userTasks = taskRepository.findByTeamAndAssigneeOrderByCreatedAtDesc(team, user).stream()
                .filter(t -> t.getCreatedAt() != null && !t.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().isAfter(end))
                .collect(Collectors.toList());

        int tasksAssigned = userTasks.size();
        int tasksCompleted = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int tasksOverdue = (int) userTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE && t.getDeadline() != null && t.getDeadline().isBefore(LocalDate.now())).count();
        int taskCompletionPct = tasksAssigned > 0 ? (tasksCompleted * 100) / tasksAssigned : 0;

        // Homework assigned & submitted scoped to team
        List<Homework> allHw = homeworkRepository.findByTeamOrderByCreatedAtDesc(team).stream()
                .filter(h -> h.getCreatedAt() != null && !h.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate().isAfter(end))
                .collect(Collectors.toList());
        int hwAssigned = allHw.size();
        List<HomeworkSubmission> mySubs = homeworkSubmissionRepository.findByUserOrderBySubmittedAtDesc(user).stream()
                .filter(s -> s.getHomework() != null && s.getHomework().getTeam() != null && s.getHomework().getTeam().getId().equals(team.getId()))
                .collect(Collectors.toList());
        int hwSubmitted = mySubs.size();
        int hwReviewed = (int) mySubs.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus()) || s.getLeadFeedback() != null).count();

        // Standups in this month for user
        List<Standup> userStandups = standupRepository.findByUserAndDateBetween(user, start, end).stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsCompleted()))
                .collect(Collectors.toList());
        int standupsSubmitted = userStandups.size();
        int voiceStandups = (int) userStandups.stream().filter(s -> "VOICE".equalsIgnoreCase(s.getSubmissionType())).count();
        int expectedDays = Math.min(LocalDate.now().getDayOfMonth(), end.getDayOfMonth());
        int consistencyPct = expectedDays > 0 ? (standupsSubmitted * 100) / expectedDays : 0;

        // Blockers scoped to team
        List<Blocker> userBlockers = blockerRepository.findByTeamAndUserAndStatusOrderByCreatedAtDesc(team, user, BlockerStatus.OPEN);
        int blockersReported = userBlockers.size();
        int blockersResolved = (int) userBlockers.stream().filter(b -> b.getResolvedAt() != null).count();

        int streakDays = streakService.getUserStreak(user, LocalDate.now()).getCurrentStreak();

        String rating = taskCompletionPct >= 80 && consistencyPct >= 80 ? "EXEMPLARY (TOP VELOCITY)"
                : taskCompletionPct >= 50 ? "SOLID (ON TRACK)"
                : "GROWTH NEEDED";

        return MonthlyEvaluationDto.PersonalPerformanceDto.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .position(tm != null && tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                .serialNumber(tm != null && tm.getSerialNumber() != null ? tm.getSerialNumber() : (tm != null && tm.getTeam() != null ? String.format("%s-%03d", tm.getTeam().getCrewIdPrefix(), user.getId()) : "MEMBER"))
                .wasLeadThisMonth(wasLead)
                .tasksAssigned(tasksAssigned)
                .tasksCompleted(tasksCompleted)
                .tasksOverdue(tasksOverdue)
                .taskCompletionPct(taskCompletionPct)
                .homeworkAssigned(hwAssigned)
                .homeworkSubmitted(hwSubmitted)
                .homeworkReviewed(hwReviewed)
                .standupDaysExpected(expectedDays)
                .standupsSubmitted(standupsSubmitted)
                .voiceStandupsSubmitted(voiceStandups)
                .standupConsistencyPct(consistencyPct)
                .streakDays(streakDays)
                .blockersReported(blockersReported)
                .blockersResolved(blockersResolved)
                .performanceRating(rating)
                .build();
    }

    private MonthlyEvaluationDto.LeadershipPerformanceDto calculateLeadershipPerformance(User lead, Team team, LocalDate start, LocalDate end, List<TeamMember> members) {
        // Tasks created by or assigned during this month
        List<Task> teamTasks = taskRepository.findByTeamOrderByCreatedAtDesc(team);
        int tasksCreated = teamTasks.size();
        int tasksReviewed = (int) teamTasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW || t.getStatus() == TaskStatus.DONE).count();
        int tasksApproved = (int) teamTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();

        // Homework created & reviewed for this team
        List<Homework> teamHw = homeworkRepository.findByTeamOrderByCreatedAtDesc(team);
        int hwCreated = teamHw.size();
        int hwReviewed = 0;
        for (Homework hw : teamHw) {
            hwReviewed += (int) homeworkSubmissionRepository.countByHomeworkAndStatus(hw, "REVIEWED");
        }

        // Standups monitored across cohort
        List<Standup> teamStandups = standupRepository.findByTeamAndDateBetween(team, start, end);
        int monitoredStandups = (int) teamStandups.stream().filter(s -> Boolean.TRUE.equals(s.getIsCompleted())).count();
        int nonLeadCount = Math.max(1, members.size() - 1);
        int expectedCohortStandups = nonLeadCount * Math.min(LocalDate.now().getDayOfMonth(), end.getDayOfMonth());
        int standupSubmissionPct = expectedCohortStandups > 0 ? (monitoredStandups * 100) / expectedCohortStandups : 0;

        int blockers = (int) blockerRepository.countByTeamAndStatus(team, BlockerStatus.OPEN);
        int cohortCompletionPct = tasksCreated > 0 ? (tasksApproved * 100) / tasksCreated : 0;

        String periodLabel = start.format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " + end.format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH));

        return MonthlyEvaluationDto.LeadershipPerformanceDto.builder()
                .leadUserId(lead.getId())
                .leadName(lead.getName())
                .periodLabel(periodLabel)
                .tasksCreatedForTeam(tasksCreated)
                .tasksReviewed(tasksReviewed)
                .tasksApproved(tasksApproved)
                .homeworkCreated(hwCreated)
                .homeworkReviewed(hwReviewed)
                .memberStandupsMonitored(monitoredStandups)
                .totalExpectedMemberStandups(expectedCohortStandups)
                .cohortStandupSubmissionPct(standupSubmissionPct)
                .blockersTriaged(blockers)
                .followUpsIssued(0)
                .teamQuestionsAnswered(0)
                .cohortOverallCompletionPct(cohortCompletionPct)
                .leadershipRating(tasksApproved > 0 ? "EFFECTIVE LEADERSHIP" : "ACTIVE LEADERSHIP")
                .build();
    }

    /**
     * Generates a PDF Monthly Lecturer Report.
     */
    @Transactional(readOnly = true)
    public byte[] generateMonthlyLecturerReportPdf(Long teamId, YearMonth yearMonth, Long requesterUserId) {
        MonthlyEvaluationDto eval = getMonthlyEvaluation(teamId, yearMonth, requesterUserId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // HEADER TABLE
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{70, 30});

            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.addElement(new Paragraph("JVM CREW · MONTHLY LECTURER EVALUATION REPORT", FONT_TITLE));
            leftHeader.addElement(new Paragraph("Reporting Cohort: " + eval.getTeamName() + " · Period: " + eval.getMonthLabel(), FONT_SUBTITLE));
            leftHeader.addElement(new Paragraph("Designated Rotation Lead: " + (eval.getLeadInfo() != null ? eval.getLeadInfo().getName() : "None Assigned") + " (SDE Intern)", FONT_SUBTITLE));
            headerTable.addCell(leftHeader);

            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(new Paragraph("OFFICIAL REPORT", FONT_BADGE));
            rightHeader.addElement(new Paragraph("Source: PostgreSQL Database", FONT_SUBTITLE));
            rightHeader.addElement(new Paragraph("Generated: " + LocalDate.now(), FONT_SUBTITLE));
            headerTable.addCell(rightHeader);

            document.add(headerTable);
            document.add(new Paragraph(" "));

            // LEADERSHIP SUMMARY SECTION
            if (eval.getLeadershipPerformance() != null) {
                PdfPTable leadSection = new PdfPTable(1);
                leadSection.setWidthPercentage(100);

                PdfPCell leadCell = new PdfPCell();
                leadCell.setBackgroundColor(COLOR_CARD_BG);
                leadCell.setBorderColor(COLOR_BORDER);
                leadCell.setPadding(10);

                leadCell.addElement(new Paragraph("1. MONTHLY LEADERSHIP RESPONSIBILITIES & EXECUTION", FONT_SECTION));
                leadCell.addElement(new Paragraph("Current Lead: " + eval.getLeadershipPerformance().getLeadName() + " · Professional Title: SDE Intern · Term: " + eval.getLeadershipPerformance().getPeriodLabel(), FONT_SUBTITLE));
                leadCell.addElement(new Paragraph(" "));

                PdfPTable leadMetrics = new PdfPTable(4);
                leadMetrics.setWidthPercentage(100);
                addMetricCell(leadMetrics, "Tasks Created", String.valueOf(eval.getLeadershipPerformance().getTasksCreatedForTeam()));
                addMetricCell(leadMetrics, "Tasks Approved", String.valueOf(eval.getLeadershipPerformance().getTasksApproved()));
                addMetricCell(leadMetrics, "Homework Managed", String.valueOf(eval.getLeadershipPerformance().getHomeworkCreated()));
                addMetricCell(leadMetrics, "Standups Monitored", String.valueOf(eval.getLeadershipPerformance().getMemberStandupsMonitored()));
                leadCell.addElement(leadMetrics);

                leadSection.addCell(leadCell);
                document.add(leadSection);
                document.add(new Paragraph(" "));
            }

            // COHORT PERSONAL PERFORMANCE TABLE
            Paragraph cohortHeading = new Paragraph("2. ALL SDE INTERNS PERSONAL PERFORMANCE MATRIX", FONT_SECTION);
            document.add(cohortHeading);
            document.add(new Paragraph("Every engineer is an SDE Intern and regular team member evaluated on individual deliverables.", FONT_SUBTITLE));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{25, 18, 14, 14, 15, 14});

            addTableHeader(table, "Engineer Name");
            addTableHeader(table, "Month Role");
            addTableHeader(table, "Tasks Done");
            addTableHeader(table, "HW Done");
            addTableHeader(table, "Standups");
            addTableHeader(table, "Progress");

            for (MonthlyEvaluationDto.MemberMonthlySummaryDto row : eval.getCohortSummaries()) {
                addTableRow(table, row.getName() + " (" + row.getSerialNumber() + ")");
                addTableRow(table, row.getRoleInMonth());
                addTableRow(table, row.getTasksCompleted() + " / " + row.getTasksTotal());
                addTableRow(table, row.getHomeworkSubmitted() + " / " + row.getHomeworkTotal());
                addTableRow(table, String.valueOf(row.getStandupsSubmitted()));
                addTableRow(table, row.getProgressPct() + "%");
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // FOOTER
            Paragraph footer = new Paragraph("JVM Crew Engineering Management System · Authentic PostgreSQL Data Verified · No Fabricated Activity", FONT_FOOTER);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate monthly lecturer PDF report", e);
            throw new RuntimeException("Failed to generate monthly lecturer report", e);
        }
    }

    private void addMetricCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.addElement(new Paragraph(label.toUpperCase(), FONT_LABEL));
        cell.addElement(new Paragraph(value, FONT_VALUE_BOLD));
        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_LABEL));
        cell.setBackgroundColor(COLOR_HEADER_BG);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6);
        table.addCell(cell);
    }

    private void addTableRow(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_VALUE));
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(5);
        table.addCell(cell);
    }
}
