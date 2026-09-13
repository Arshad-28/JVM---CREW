package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/member")
    public ResponseEntity<MemberDashboardDto> getMemberDashboard(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(dashboardService.getMemberDashboard(principal.getId(), targetDate));
    }

    @GetMapping("/lead-daily-brief")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LeadDailyBriefDto> getLeadDailyBrief(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(dashboardService.getLeadDailyBrief(principal.getTeamId(), principal.getId(), targetDate));
    }

    @GetMapping("/lead")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LeadDashboardDto> getLeadDashboard(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(dashboardService.getLeadDashboard(principal.getTeamId(), targetDate));
    }

    @GetMapping({"/member/{memberId}/detail", "/members/{memberId}", "/member/{memberId}"})
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<MemberDetailProgressDto> getMemberDetailProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long memberId) {
        return ResponseEntity.ok(dashboardService.getMemberDetailProgress(memberId, principal.getId()));
    }

    @PutMapping("/members/{memberId}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<MemberRosterDto> updateTeamMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long memberId,
            @jakarta.validation.Valid @RequestBody com.jvmcrew.dto.LeadUpdateMemberRequest request) {
        return ResponseEntity.ok(dashboardService.updateTeamMember(principal.getTeamId(), memberId, principal.getId(), request));
    }
}
