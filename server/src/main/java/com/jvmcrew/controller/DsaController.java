package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.DsaTopicStatsDto;
import com.jvmcrew.dto.ProblemAttemptRequest;
import com.jvmcrew.dto.ProblemDto;
import com.jvmcrew.service.DsaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dsa")
@RequiredArgsConstructor
public class DsaController {

    private final DsaService dsaService;

    @GetMapping("/stats")
    public ResponseEntity<List<DsaTopicStatsDto>> getDsaStats(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dsaService.getDsaStats(principal.getId()));
    }

    @PostMapping("/attempts")
    public ResponseEntity<ProblemDto> recordAttempt(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ProblemAttemptRequest request) {
        return ResponseEntity.ok(dsaService.recordAttempt(principal.getId(), request));
    }
}
