package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.model.TaskComment;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) TaskStatus status) {
        Long effectiveAssigneeId = principal.getRole() == Role.MEMBER ? principal.getId() : assigneeId;
        return ResponseEntity.ok(taskService.getTasks(principal.getTeamId(), effectiveAssigneeId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getTaskById(id, principal.getId(), principal.getTeamId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<TaskResponse> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(principal.getId(), principal.getTeamId(), request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, principal.getId(), principal.getTeamId(), request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TaskStatusUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, principal.getId(), principal.getTeamId(), request));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TaskComment> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TaskCommentRequest request) {
        return ResponseEntity.ok(taskService.addComment(id, principal.getId(), principal.getTeamId(), request.getBody()));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TaskComment>> getComments(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getTaskComments(id, principal.getTeamId()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TaskHistoryResponse>> getTaskHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getTaskHistory(id, principal.getTeamId()));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<TaskHistoryResponse>> getRecentActivity(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getRecentActivity(principal.getTeamId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('LEAD')")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        taskService.deleteTask(id, principal.getId(), principal.getTeamId());
        return ResponseEntity.noContent().build();
    }
}
