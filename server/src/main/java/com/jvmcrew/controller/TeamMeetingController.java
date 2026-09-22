package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.CreateTeamMeetingRequest;
import com.jvmcrew.dto.TeamMeetingDto;
import com.jvmcrew.dto.UpdateTeamMeetingRequest;
import com.jvmcrew.service.TeamMeetingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class TeamMeetingController {

    private final TeamMeetingService meetingService;

    @GetMapping
    public ResponseEntity<List<TeamMeetingDto>> getTeamMeetings(@AuthenticationPrincipal UserPrincipal principal) {
        List<TeamMeetingDto> meetings = meetingService.getTeamMeetings(principal);
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<TeamMeetingDto> getUpcomingMeeting(@AuthenticationPrincipal UserPrincipal principal) {
        return meetingService.getNextUpcomingMeeting(principal)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<TeamMeetingDto> createMeeting(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTeamMeetingRequest request
    ) {
        TeamMeetingDto created = meetingService.createMeeting(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamMeetingDto> updateMeeting(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTeamMeetingRequest request
    ) {
        TeamMeetingDto updated = meetingService.updateMeeting(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeeting(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        meetingService.deleteMeeting(principal, id);
        return ResponseEntity.noContent().build();
    }
}
