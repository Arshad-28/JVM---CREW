package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.MonthlyEvaluationDto;
import com.jvmcrew.service.MonthlyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MonthlyReportController {

    private final MonthlyReportService monthlyReportService;

    @GetMapping("/evaluations/monthly")
    public ResponseEntity<MonthlyEvaluationDto> getMonthlyEvaluation(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        YearMonth ym = month != null && !month.isBlank() ? YearMonth.parse(month) : YearMonth.now();
        Long requesterId = principal != null ? principal.getId() : null;
        Long teamId = principal != null ? principal.getTeamId() : null;
        return ResponseEntity.ok(monthlyReportService.getMonthlyEvaluation(teamId, ym, requesterId));
    }

    @GetMapping("/reports/monthly")
    public ResponseEntity<MonthlyEvaluationDto> getMonthlyReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        YearMonth ym = month != null && !month.isBlank() ? YearMonth.parse(month) : YearMonth.now();
        Long requesterId = principal != null ? principal.getId() : null;
        Long teamId = principal != null ? principal.getTeamId() : null;
        return ResponseEntity.ok(monthlyReportService.getMonthlyEvaluation(teamId, ym, requesterId));
    }

    @GetMapping("/reports/monthly/pdf")
    public ResponseEntity<byte[]> downloadMonthlyLecturerReportPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        YearMonth ym = month != null && !month.isBlank() ? YearMonth.parse(month) : YearMonth.now();
        Long requesterId = principal != null ? principal.getId() : null;
        Long teamId = principal != null ? principal.getTeamId() : null;

        byte[] pdfBytes = monthlyReportService.generateMonthlyLecturerReportPdf(teamId, ym, requesterId);
        String filename = "JVM_Crew_Monthly_Lecturer_Report_" + ym + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }
}
