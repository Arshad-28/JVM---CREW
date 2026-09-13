package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.service.TeamManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamManagementController {

    private final TeamManagementService teamManagementService;

    @GetMapping("/me")
    public ResponseEntity<TeamManagementDto> getMyTeam(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(teamManagementService.getMyTeam(principal));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamManagementDto> getTeamById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long requesterId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(teamManagementService.getTeamById(id, requesterId));
    }

    @PutMapping("/me/name")
    @PreAuthorize("hasAnyRole('LEAD', 'ADMIN')")
    public ResponseEntity<TeamManagementDto> updateTeamName(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateTeamNameRequest request) {
        return ResponseEntity.ok(teamManagementService.updateCustomTeamName(principal, request));
    }

    @PostMapping({"/me/members", "/members"})
    @PreAuthorize("hasAnyRole('LEAD', 'ADMIN')")
    public ResponseEntity<TeamManagementDto> addTeamMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddTeamMemberRequest request) {
        return ResponseEntity.ok(teamManagementService.addMemberToTeam(principal, request));
    }

    @PutMapping({"/me/members/{userId}", "/members/{userId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TeamManagementDto> updateTeamMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId,
            @Valid @RequestBody LeadUpdateMemberRequest request) {
        return ResponseEntity.ok(teamManagementService.updateMember(principal, userId, request));
    }

    @DeleteMapping({"/me/members/{userId}", "/members/{userId}"})
    @PreAuthorize("hasAnyRole('LEAD', 'ADMIN')")
    public ResponseEntity<TeamManagementDto> removeTeamMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        return ResponseEntity.ok(teamManagementService.removeMemberFromTeam(principal, userId));
    }

    @PostMapping("/me/change-lead")
    @PreAuthorize("hasAnyRole('LEAD', 'ADMIN')")
    public ResponseEntity<TeamManagementDto> changeCurrentLead(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangeLeadRequest request) {
        return ResponseEntity.ok(teamManagementService.changeCurrentLead(principal, request));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationTeamSummaryDto>> getAllTeams() {
        return ResponseEntity.ok(teamManagementService.getAllTeams());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('LEAD', 'ADMIN')")
    public ResponseEntity<TeamManagementDto> createTeam(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.ok(teamManagementService.createTeam(principal, request));
    }
}
