package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.LearningTopicDto;
import com.jvmcrew.dto.SubjectProgressDto;
import com.jvmcrew.model.enums.LearningStatus;
import com.jvmcrew.service.LearningService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @GetMapping("/tree")
    public ResponseEntity<List<SubjectProgressDto>> getCurriculum(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(learningService.getCurriculumProgress(principal.getId()));
    }

    @PostMapping("/progress")
    public ResponseEntity<LearningTopicDto> updateProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok(learningService.updateProgress(principal.getId(), request.getTopicId(), request.getStatus()));
    }

    @PostMapping("/topics")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LearningTopicDto> createTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateTopicRequest request) {
        return ResponseEntity.ok(learningService.createTopic(principal.getId(), request.getSubject(), request.getTitle(), request.getOrderIndex()));
    }

    @PutMapping("/topics/{id}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LearningTopicDto> updateTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody UpdateTopicRequest request) {
        return ResponseEntity.ok(learningService.updateTopic(principal.getId(), id, request.getSubject(), request.getTitle(), request.getOrderIndex()));
    }

    @DeleteMapping("/topics/{id}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<Void> deleteTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        learningService.deleteTopic(principal.getId(), id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/subjects")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<LearningTopicDto> createSubject(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.ok(learningService.createSubject(principal.getId(), request.getSubject(), request.getInitialTopicTitle()));
    }

    @Data
    public static class ProgressUpdateRequest {
        private Long topicId;
        private LearningStatus status;
    }

    @Data
    public static class CreateTopicRequest {
        private String subject;
        private String title;
        private Integer orderIndex;
    }

    @Data
    public static class UpdateTopicRequest {
        private String subject;
        private String title;
        private Integer orderIndex;
    }

    @Data
    public static class CreateSubjectRequest {
        private String subject;
        private String initialTopicTitle;
    }
}
