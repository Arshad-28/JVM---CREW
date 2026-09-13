package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.LeadMessageAnswerRequest;
import com.jvmcrew.dto.LeadMessageRequest;
import com.jvmcrew.dto.LeadMessageResponseDto;
import com.jvmcrew.service.LeadMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lead-messages")
@RequiredArgsConstructor
public class LeadMessageController {

    private final LeadMessageService leadMessageService;

    @PostMapping
    public ResponseEntity<LeadMessageResponseDto> createMessage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LeadMessageRequest request) {
        LeadMessageResponseDto response = leadMessageService.createMessage(principal.getId(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-messages")
    public ResponseEntity<List<LeadMessageResponseDto>> getMyMessages(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<LeadMessageResponseDto> list = leadMessageService.getMemberMessages(principal.getId());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<List<LeadMessageResponseDto>> getTeamMessages(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<LeadMessageResponseDto> list = leadMessageService.getTeamMessages(principal.getId());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/respond")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LeadMessageResponseDto> respondToMessage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LeadMessageAnswerRequest request) {
        LeadMessageResponseDto response = leadMessageService.respondToMessage(id, principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
