package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.model.StandupPdf;
import com.jvmcrew.model.User;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.service.DashboardService;
import com.jvmcrew.service.StandupPdfService;
import com.jvmcrew.service.StandupService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/standups")
@RequiredArgsConstructor
public class StandupController {

    private final StandupService standupService;
    private final DashboardService dashboardService;
    private final StandupPdfService standupPdfService;
    private final UserRepository userRepository;

    @GetMapping("/checkin-template")
    public ResponseEntity<CheckInTemplateDto> getCheckInTemplate(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(standupService.getTodayCheckInTemplate(principal.getId(), targetDate));
    }

    @GetMapping("/today")
    public ResponseEntity<StandupResponse> getTodayStandup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return standupService.getTodayStandup(principal.getId(), targetDate)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/lead/today")
    public ResponseEntity<StandupResponse> getTodayLeadStandup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return standupService.getTodayLeadStandup(principal.getId(), targetDate)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StandupResponse> getStandupById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(standupService.getStandupById(id, principal.getId()));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadStandupPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        StandupPdf pdf = standupPdfService.getOrGenerateIndividualStandupPdf(id, user);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.getFilename() + "\"")
                .body(pdf.getPdfData());
    }

    @GetMapping("/team/{date}/pdf")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<byte[]> downloadTeamStandupPdf(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal principal) {
        StandupPdf pdf = standupPdfService.getOrGenerateTeamStandupPdf(date, principal.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pdf.getFilename() + "\"")
                .body(pdf.getPdfData());
    }

    @PostMapping({"", "/submit"})
    public ResponseEntity<StandupResponse> submitStandup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody StandupRequest request) {
        return ResponseEntity.ok(standupService.submitStandup(principal.getId(), request));
    }

    @PostMapping(value = {"/submit-voice", "/voice"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StandupResponse> submitVoiceStandup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "audio", required = false) org.springframework.web.multipart.MultipartFile audioFile,
            @RequestParam(value = "voice", required = false) org.springframework.web.multipart.MultipartFile voiceFile,
            @RequestParam(value = "durationSeconds", required = false) Integer durationSeconds,
            @RequestParam(value = "date", required = false) String dateStr,
            @RequestParam(value = "questionForLead", required = false) String questionForLead,
            @RequestParam(value = "confidence", required = false) Integer confidence,
            @RequestParam(value = "confidenceLabel", required = false) String confidenceLabel) {
        org.springframework.web.multipart.MultipartFile file = audioFile != null ? audioFile : voiceFile;
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Voice recording file is required");
        }
        LocalDate date = null;
        if (org.springframework.util.StringUtils.hasText(dateStr)) {
            try {
                date = LocalDate.parse(dateStr.trim());
            } catch (Exception ignored) {
                date = LocalDate.now();
            }
        }
        return ResponseEntity.ok(standupService.submitVoiceStandup(
                principal.getId(), file, durationSeconds, date, questionForLead, confidence, confidenceLabel));
    }

    @GetMapping({"/{id}/voice", "/{id}/audio"})
    public ResponseEntity<org.springframework.core.io.Resource> streamVoiceRecording(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        StandupService.VoiceRecordingData data = standupService.getVoiceRecording(id, principal.getId());
        var builder = ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(data.getContentType() != null ? data.getContentType() : "audio/webm"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + data.getFilename() + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600");
        if (data.getFileSize() != null && data.getFileSize() > 0) {
            builder.contentLength(data.getFileSize());
        }
        return builder.body(data.getResource());
    }

    @PostMapping("/{id}/answer")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<StandupResponse> answerQuestion(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AnswerQuestionRequest request) {
        return ResponseEntity.ok(standupService.answerQuestionForLead(id, principal.getId(), request.getAnswer()));
    }

    @PostMapping("/followups")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<FollowUpDto> createFollowUp(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateFollowUpRequest request) {
        return ResponseEntity.ok(dashboardService.createFollowUp(principal.getId(), request));
    }

    @PatchMapping("/followups/{id}/complete")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<FollowUpDto> completeFollowUp(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.completeFollowUp(id, principal != null ? principal.getId() : null));
    }

    @GetMapping("/team/history")
    public ResponseEntity<List<StandupResponse>> getTeamStandupHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(standupService.getTeamStandupHistory(principal.getId()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<StandupResponse>> getStandupHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long memberId) {
        if (memberId != null) {
            return ResponseEntity.ok(standupService.getStandupHistoryForLead(principal.getId(), memberId));
        }
        return ResponseEntity.ok(standupService.getStandupHistory(principal.getId()));
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<List<StandupResponse>> getTeamStandupsToday(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(standupService.getTeamStandupsToday(principal.getTeamId(), targetDate));
    }
}
