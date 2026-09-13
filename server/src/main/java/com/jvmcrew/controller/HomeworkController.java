package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.service.HomeworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;

    @GetMapping
    public ResponseEntity<List<HomeworkResponse>> getHomeworkList(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(homeworkService.getHomeworkList(principal.getId(), date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HomeworkResponse> getHomeworkById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(homeworkService.getHomeworkById(id, principal.getId(), date));
    }

    @PostMapping
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<HomeworkResponse> createHomework(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody HomeworkRequest request) {
        return ResponseEntity.ok(homeworkService.createHomework(principal.getId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<HomeworkResponse> updateHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody HomeworkRequest request) {
        return ResponseEntity.ok(homeworkService.updateHomework(id, principal.getId(), request));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<HomeworkResponse> publishHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(homeworkService.publishHomework(id, principal.getId()));
    }

    @PostMapping("/{id}/solution")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<HomeworkResponse> publishSolution(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) PublishSolutionRequest request) {
        return ResponseEntity.ok(homeworkService.publishSolution(id, principal.getId(), request));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<HomeworkSubmissionResponse> submitHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody HomeworkSubmissionRequest request) {
        return ResponseEntity.ok(homeworkService.submitHomework(id, principal.getId(), request));
    }

    @PostMapping("/submissions/{submissionId}/review")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<HomeworkSubmissionResponse> reviewSubmission(
            @PathVariable Long submissionId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) ReviewSubmissionRequest request) {
        return ResponseEntity.ok(homeworkService.reviewSubmission(submissionId, principal.getId(), request));
    }

    @PostMapping("/{id}/remind/{userId}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<Void> remindMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        homeworkService.remindMember(id, principal.getId(), userId);
        return ResponseEntity.ok().build();
    }
}
