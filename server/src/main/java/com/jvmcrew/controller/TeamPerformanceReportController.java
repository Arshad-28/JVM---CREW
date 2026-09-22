package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.report.MemberPerformanceReportDto;
import com.jvmcrew.dto.report.TeamPerformanceReportDto;
import com.jvmcrew.service.TeamPerformanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TeamPerformanceReportController {

    private final TeamPerformanceReportService reportService;

    @GetMapping({"/team/performance", "/reports/performance"})
    public ResponseEntity<TeamPerformanceReportDto> getTeamPerformanceReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        TeamPerformanceReportDto report = reportService.getTeamPerformanceReport(principal, period, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping({"/team/performance/member/{userId}", "/reports/performance/member/{userId}"})
    public ResponseEntity<MemberPerformanceReportDto> getMemberPerformanceReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        MemberPerformanceReportDto report = reportService.getMemberPerformanceReport(principal, userId, period, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping({"/team/performance/pdf", "/reports/performance/pdf"})
    public ResponseEntity<byte[]> downloadTeamPerformanceReportPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        byte[] pdfBytes = reportService.generateTeamPerformanceReportPdf(principal, period, startDate, endDate);
        String filename = "EngineerSpace_Team_Performance_Report.pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }

    @GetMapping({"/team/performance/csv", "/reports/performance/csv"})
    public ResponseEntity<byte[]> exportTeamPerformanceReportCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "THIS_MONTH") String period,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        byte[] csvBytes = reportService.exportTeamPerformanceReportCsv(principal, period, startDate, endDate);
        String filename = "EngineerSpace_Team_Performance_Report.csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(csvBytes);
    }
}
