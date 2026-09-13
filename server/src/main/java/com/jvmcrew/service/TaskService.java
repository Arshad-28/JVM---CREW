package com.jvmcrew.service;

import com.jvmcrew.dto.*;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long teamId, Long assigneeId, TaskStatus status) {
        if (teamId == null) {
            return Collections.emptyList();
        }

        List<Task> tasks;
        if (assigneeId != null) {
            tasks = taskRepository.findByTeamIdAndAssigneeIdOrderByCreatedAtDesc(teamId, assigneeId);
        } else {
            tasks = taskRepository.findByTeamIdOrderByCreatedAtDesc(teamId);
        }

        if (status != null) {
            tasks = tasks.stream().filter(t -> t.getStatus() == status).collect(Collectors.toList());
        }

        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId, Long currentUserId, Long teamId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        
        verifyTaskTeam(task, teamId);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse createTask(Long currentUserId, Long teamId, TaskRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Team team = teamId != null ? teamRepository.findById(teamId).orElse(null) : null;
        if (team == null) {
            var member = teamMemberRepository.findFirstByUserAndIsActiveTrue(currentUser)
                    .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
            team = member.getTeam();
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            if (assignee != null) {
                boolean assigneeInTeam = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, assignee).isPresent();
                if (!assigneeInTeam) {
                    throw new IllegalArgumentException("Cannot assign task to a user outside of team " + team.getFormattedDisplayName());
                }
            }
        }

        Task task = Task.builder()
                .team(team)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .assignee(assignee)
                .priority(request.getPriority())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .deadline(request.getDeadline())
                .progressPct(request.getProgressPct() != null ? request.getProgressPct() : 0)
                .estHours(request.getEstHours())
                .actualHours(request.getActualHours())
                .labels(request.getLabels() != null ? request.getLabels() : new ArrayList<>())
                .build();

        task = taskRepository.save(task);

        // Audit Trail entry
        recordHistory(task, "created", null, task.getStatus().name(), currentUser);

        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, Long currentUserId, Long teamId, TaskRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        verifyTaskTeam(task, teamId);

        // Track changes
        if (!Objects.equals(task.getTitle(), request.getTitle())) {
            recordHistory(task, "title", task.getTitle(), request.getTitle(), currentUser);
            task.setTitle(request.getTitle());
        }

        if (request.getStatus() != null && task.getStatus() != request.getStatus()) {
            recordHistory(task, "status", task.getStatus().name(), request.getStatus().name(), currentUser);
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.DONE) {
                task.setProgressPct(100);
            }
        }

        if (request.getProgressPct() != null && !Objects.equals(task.getProgressPct(), request.getProgressPct())) {
            recordHistory(task, "progress_pct", String.valueOf(task.getProgressPct()), String.valueOf(request.getProgressPct()), currentUser);
            task.setProgressPct(request.getProgressPct());
        }

        if (request.getAssigneeId() != null) {
            User newAssignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            if (newAssignee != null && !teamMemberRepository.findByTeamAndUserAndIsActiveTrue(task.getTeam(), newAssignee).isPresent()) {
                throw new IllegalArgumentException("Cannot assign task to a user outside of team " + task.getTeam().getFormattedDisplayName());
            }
            Long oldAssigneeId = task.getAssignee() != null ? task.getAssignee().getId() : null;
            if (!Objects.equals(oldAssigneeId, request.getAssigneeId())) {
                recordHistory(task, "assignee",
                        task.getAssignee() != null ? task.getAssignee().getName() : "Unassigned",
                        newAssignee != null ? newAssignee.getName() : "Unassigned",
                        currentUser);
                task.setAssignee(newAssignee);
            }
        }

        if (request.getPriority() != null && task.getPriority() != request.getPriority()) {
            recordHistory(task, "priority", task.getPriority().name(), request.getPriority().name(), currentUser);
            task.setPriority(request.getPriority());
        }

        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        task.setEstHours(request.getEstHours());
        task.setActualHours(request.getActualHours());
        if (request.getLabels() != null) {
            task.setLabels(request.getLabels());
        }

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, Long currentUserId, Long teamId, TaskStatusUpdateRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        verifyTaskTeam(task, teamId);

        if (request.getStatus() != null && task.getStatus() != request.getStatus()) {
            recordHistory(task, "status", task.getStatus().name(), request.getStatus().name(), currentUser);
            task.setStatus(request.getStatus());

            if (request.getStatus() == TaskStatus.DONE) {
                task.setProgressPct(100);
            }
        }

        if (request.getProgressPct() != null && !Objects.equals(task.getProgressPct(), request.getProgressPct())) {
            recordHistory(task, "progress_pct", String.valueOf(task.getProgressPct()), String.valueOf(request.getProgressPct()), currentUser);
            task.setProgressPct(request.getProgressPct());
        }

        if (request.getActualHours() != null) {
            task.setActualHours(request.getActualHours());
        }

        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public TaskComment addComment(Long taskId, Long currentUserId, Long teamId, String body) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        verifyTaskTeam(task, teamId);

        TaskComment comment = TaskComment.builder()
                .task(task)
                .team(task.getTeam())
                .user(user)
                .body(body.trim())
                .build();

        return taskCommentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<TaskComment> getTaskComments(Long taskId, Long teamId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        verifyTaskTeam(task, teamId);
        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional(readOnly = true)
    public List<TaskHistoryResponse> getTaskHistory(Long taskId, Long teamId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
        verifyTaskTeam(task, teamId);
        return taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId).stream()
                .map(this::mapHistoryToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskHistoryResponse> getRecentActivity(Long teamId) {
        if (teamId == null) return Collections.emptyList();
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return Collections.emptyList();
        return taskHistoryRepository.findTop20ByTaskTeamOrderByChangedAtDesc(team).stream()
                .map(this::mapHistoryToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteTask(Long id, Long currentUserId, Long teamId) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + id));
        verifyTaskTeam(task, teamId);
        taskHistoryRepository.deleteAll(taskHistoryRepository.findByTaskOrderByChangedAtDesc(task));
        taskCommentRepository.deleteAll(taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(id));
        taskRepository.delete(task);
    }

    private void verifyTaskTeam(Task task, Long teamId) {
        if (teamId == null || task.getTeam() == null || !task.getTeam().getId().equals(teamId)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to access tasks from another team.");
        }
    }

    private void recordHistory(Task task, String fieldChanged, String oldValue, String newValue, User changedBy) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .team(task.getTeam())
                .fieldChanged(fieldChanged)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(changedBy)
                .changedAt(Instant.now())
                .build();
        taskHistoryRepository.save(history);
    }

    public TaskResponse mapToResponse(Task task) {
        List<TaskComment> comments = taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        return TaskResponse.builder()
                .id(task.getId())
                .teamId(task.getTeam().getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
                .assigneeName(task.getAssignee() != null ? task.getAssignee().getName() : "Unassigned")
                .priority(task.getPriority())
                .status(task.getStatus())
                .deadline(task.getDeadline())
                .progressPct(task.getProgressPct())
                .estHours(task.getEstHours())
                .actualHours(task.getActualHours())
                .createdAt(task.getCreatedAt())
                .labels(task.getLabels())
                .commentsCount(comments != null ? comments.size() : 0)
                .build();
    }

    private TaskHistoryResponse mapHistoryToResponse(TaskHistory history) {
        return TaskHistoryResponse.builder()
                .id(history.getId())
                .taskId(history.getTask().getId())
                .taskTitle(history.getTask().getTitle())
                .fieldChanged(history.getFieldChanged())
                .oldValue(history.getOldValue())
                .newValue(history.getNewValue())
                .changedById(history.getChangedBy() != null ? history.getChangedBy().getId() : null)
                .changedByName(history.getChangedBy() != null ? history.getChangedBy().getName() : "System")
                .changedAt(history.getChangedAt())
                .build();
    }
}
