package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.TeamMemberStreakDto;
import com.jvmcrew.dto.UserStreakDto;
import com.jvmcrew.model.User;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.service.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/streaks")
@RequiredArgsConstructor
public class StreakController {

    private final StreakService streakService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<UserStreakDto> getMyStreak(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        return ResponseEntity.ok(streakService.getUserStreak(user, date));
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<List<TeamMemberStreakDto>> getTeamStreaks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(streakService.getTeamStreaksForLead(principal.getId(), date));
    }
}
