package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.CreateLeadershipAssignmentRequest;
import com.jvmcrew.dto.CurrentLeadDto;
import com.jvmcrew.dto.LeadershipAssignmentDto;
import com.jvmcrew.service.LeadershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leadership")
@RequiredArgsConstructor
public class LeadershipController {

    private final LeadershipService leadershipService;

    @GetMapping("/current")
    public ResponseEntity<CurrentLeadDto> getCurrentLead(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = principal != null ? principal.getId() : null;
        Long teamId = principal != null ? principal.getTeamId() : null;
        return ResponseEntity.ok(leadershipService.getCurrentLeadInfo(userId, teamId, date));
    }

    @GetMapping("/history")
    public ResponseEntity<List<LeadershipAssignmentDto>> getLeadershipHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long teamId = principal != null ? principal.getTeamId() : null;
        return ResponseEntity.ok(leadershipService.getLeadershipHistory(teamId));
    }

    @PostMapping("/assignments")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LeadershipAssignmentDto> createAssignment(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateLeadershipAssignmentRequest request) {
        return ResponseEntity.ok(leadershipService.createLeadershipAssignment(principal.getId(), request));
    }
}
