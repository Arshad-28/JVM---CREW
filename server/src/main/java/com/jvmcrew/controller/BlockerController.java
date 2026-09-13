package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.BlockerResponse;
import com.jvmcrew.dto.BlockerStatusRequest;
import com.jvmcrew.service.BlockerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blockers")
@RequiredArgsConstructor
public class BlockerController {

    private final BlockerService blockerService;

    @GetMapping("/open")
    public ResponseEntity<List<BlockerResponse>> getOpenBlockers(
            @AuthenticationPrincipal UserPrincipal principal) {
        Long teamId = principal != null ? principal.getTeamId() : null;
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(blockerService.getOpenBlockers(teamId, userId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BlockerResponse> updateBlockerStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BlockerStatusRequest request) {
        return ResponseEntity.ok(blockerService.updateBlockerStatus(id, request.getStatus(), principal.getId()));
    }
}
