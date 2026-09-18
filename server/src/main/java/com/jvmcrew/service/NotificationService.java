package com.jvmcrew.service;

import com.jvmcrew.dto.NotificationPreferenceDto;
import com.jvmcrew.dto.NotificationResponse;
import com.jvmcrew.dto.PushSubscriptionRequest;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.NotificationType;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final LeadershipService leadershipService;
    private final WebPushService webPushService;

    // ==========================================
    // CORE PERSISTENCE & PUSH DISPATCH
    // ==========================================

    @Transactional
    public Notification createAndSend(
            User recipient,
            Team team,
            NotificationType type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String actionUrl
    ) {
        if (recipient == null || team == null || type == null || !StringUtils.hasText(title)) {
            return null;
        }

        // Idempotency: Prevent duplicate notifications triggered within 3 seconds
        Instant debounceWindow = Instant.now().minus(3, ChronoUnit.SECONDS);
        if (entityId != null && notificationRepository.existsByRecipientAndTypeAndEntityIdAndCreatedAtAfter(recipient, type, entityId, debounceWindow)) {
            log.debug("Suppressing duplicate notification for recipient {} type {} entityId {}", recipient.getId(), type, entityId);
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .team(team)
                .type(type)
                .title(title.trim())
                .message(message.trim())
                .entityType(entityType)
                .entityId(entityId)
                .actionUrl(actionUrl)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        notification = notificationRepository.save(notification);

        // Check if user preferences allow push delivery for this category
        if (isPushAllowedForType(recipient, type)) {
            List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUserAndActiveTrue(recipient);
            if (!subscriptions.isEmpty()) {
                for (PushSubscription sub : subscriptions) {
                    webPushService.sendPushAsync(sub, title, message, actionUrl, type, entityId);
                }
            }
        }

        return notification;
    }

    private boolean isPushAllowedForType(User user, NotificationType type) {
        NotificationPreference pref = preferenceRepository.findByUser(user).orElse(null);
        if (pref == null) {
            return true; // Default enabled
        }

        if (!Boolean.TRUE.equals(pref.getPushEnabled())) {
            return false;
        }

        return switch (type) {
            case TASK_ASSIGNED, TASK_REASSIGNED -> Boolean.TRUE.equals(pref.getTaskAssigned());
            case TASK_SUBMITTED, TASK_APPROVED, TASK_CHANGES_REQUESTED -> Boolean.TRUE.equals(pref.getTaskReviews());
            case HOMEWORK_PUBLISHED, HOMEWORK_DEADLINE_CHANGED -> Boolean.TRUE.equals(pref.getHomeworkPublished());
            case HOMEWORK_REVIEWED, HOMEWORK_SOLUTION_PUBLISHED -> Boolean.TRUE.equals(pref.getHomeworkReviews());
            case STANDUP_REMINDER -> Boolean.TRUE.equals(pref.getStandupReminders());
            case STANDUP_SUBMITTED, STANDUP_ANSWERED, TEAM_UPDATE -> Boolean.TRUE.equals(pref.getTeamUpdates());
        };
    }

    // ==========================================
    // BUSINESS DOMAIN EVENT DISPATCHERS
    // ==========================================

    public void notifyTaskAssigned(Task task, User creator) {
        if (task == null || task.getAssignee() == null || task.getTeam() == null) return;
        User assignee = task.getAssignee();
        if (creator != null && Objects.equals(creator.getId(), assignee.getId())) return; // Avoid self-notification

        createAndSend(
                assignee,
                task.getTeam(),
                NotificationType.TASK_ASSIGNED,
                "New Task Assigned",
                "\"" + task.getTitle() + "\" was assigned to you.",
                "TASK",
                task.getId(),
                "/tasks?taskId=" + task.getId()
        );
    }

    public void notifyTaskReassigned(Task task, User oldAssignee, User newAssignee, User changer) {
        if (task == null || newAssignee == null || task.getTeam() == null) return;
        if (changer != null && Objects.equals(changer.getId(), newAssignee.getId())) return;

        createAndSend(
                newAssignee,
                task.getTeam(),
                NotificationType.TASK_REASSIGNED,
                "Task Assigned to You",
                "\"" + task.getTitle() + "\" was reassigned to you.",
                "TASK",
                task.getId(),
                "/tasks?taskId=" + task.getId()
        );
    }

    public void notifyTaskSubmittedForReview(Task task, User submitter) {
        if (task == null || task.getTeam() == null) return;
        Optional<User> activeLeadOpt = leadershipService.resolveActiveLeadForDate(task.getTeam(), LocalDate.now());
        if (activeLeadOpt.isEmpty()) return;
        User lead = activeLeadOpt.get();
        if (submitter != null && Objects.equals(lead.getId(), submitter.getId())) return;

        String submitterName = submitter != null ? submitter.getName() : "Team Member";
        createAndSend(
                lead,
                task.getTeam(),
                NotificationType.TASK_SUBMITTED,
                "Task Submitted for Review",
                submitterName + " submitted \"" + task.getTitle() + "\" for review.",
                "TASK",
                task.getId(),
                "/tasks?taskId=" + task.getId()
        );
    }

    public void notifyTaskApproved(Task task, User reviewer) {
        if (task == null || task.getAssignee() == null || task.getTeam() == null) return;
        User assignee = task.getAssignee();
        if (reviewer != null && Objects.equals(reviewer.getId(), assignee.getId())) return;

        createAndSend(
                assignee,
                task.getTeam(),
                NotificationType.TASK_APPROVED,
                "Task Approved",
                "Your task \"" + task.getTitle() + "\" was approved.",
                "TASK",
                task.getId(),
                "/tasks?taskId=" + task.getId()
        );
    }

    public void notifyTaskChangesRequested(Task task, User reviewer) {
        if (task == null || task.getAssignee() == null || task.getTeam() == null) return;
        User assignee = task.getAssignee();
        if (reviewer != null && Objects.equals(reviewer.getId(), assignee.getId())) return;

        String reviewerName = reviewer != null ? reviewer.getName() : "Your Lead";
        createAndSend(
                assignee,
                task.getTeam(),
                NotificationType.TASK_CHANGES_REQUESTED,
                "Changes Requested on Task",
                reviewerName + " requested changes on \"" + task.getTitle() + "\".",
                "TASK",
                task.getId(),
                "/tasks?taskId=" + task.getId()
        );
    }

    public void notifyHomeworkPublished(Homework homework, User creator) {
        if (homework == null || homework.getTeam() == null) return;
        List<TeamMember> members = teamMemberRepository.findByTeam(homework.getTeam());

        for (TeamMember tm : members) {
            if (tm.getUser() == null || !Boolean.TRUE.equals(tm.getIsActive())) continue;
            if (creator != null && Objects.equals(tm.getUser().getId(), creator.getId())) continue;
            if (tm.getRole() == Role.LEAD) continue;

            createAndSend(
                    tm.getUser(),
                    homework.getTeam(),
                    NotificationType.HOMEWORK_PUBLISHED,
                    "New Homework Published",
                    "\"" + homework.getTitle() + "\" has been published for your team.",
                    "HOMEWORK",
                    homework.getId(),
                    "/homework?homeworkId=" + homework.getId()
            );
        }
    }

    public void notifyHomeworkDeadlineChanged(Homework homework, LocalDate oldDeadline) {
        if (homework == null || homework.getTeam() == null) return;
        List<TeamMember> members = teamMemberRepository.findByTeam(homework.getTeam());

        for (TeamMember tm : members) {
            if (tm.getUser() == null || !Boolean.TRUE.equals(tm.getIsActive())) continue;
            if (tm.getRole() == Role.LEAD) continue;

            createAndSend(
                    tm.getUser(),
                    homework.getTeam(),
                    NotificationType.HOMEWORK_DEADLINE_CHANGED,
                    "Homework Deadline Updated",
                    "\"" + homework.getTitle() + "\" deadline is now " + homework.getDueDate() + ".",
                    "HOMEWORK",
                    homework.getId(),
                    "/homework?homeworkId=" + homework.getId()
            );
        }
    }

    public void notifyHomeworkReviewed(HomeworkSubmission submission, User reviewer) {
        if (submission == null || submission.getUser() == null || submission.getHomework() == null) return;
        User recipient = submission.getUser();
        if (reviewer != null && Objects.equals(reviewer.getId(), recipient.getId())) return;

        createAndSend(
                recipient,
                submission.getHomework().getTeam(),
                NotificationType.HOMEWORK_REVIEWED,
                "Homework Submission Reviewed",
                "Your submission for \"" + submission.getHomework().getTitle() + "\" has been reviewed.",
                "HOMEWORK",
                submission.getHomework().getId(),
                "/homework?homeworkId=" + submission.getHomework().getId()
        );
    }

    public void notifyHomeworkSolutionPublished(Homework homework) {
        if (homework == null || homework.getTeam() == null) return;
        List<TeamMember> members = teamMemberRepository.findByTeam(homework.getTeam());

        for (TeamMember tm : members) {
            if (tm.getUser() == null || !Boolean.TRUE.equals(tm.getIsActive())) continue;
            if (tm.getRole() == Role.LEAD) continue;

            createAndSend(
                    tm.getUser(),
                    homework.getTeam(),
                    NotificationType.HOMEWORK_SOLUTION_PUBLISHED,
                    "Homework Solution Published",
                    "The official solution for \"" + homework.getTitle() + "\" is now available.",
                    "HOMEWORK",
                    homework.getId(),
                    "/homework?homeworkId=" + homework.getId()
            );
        }
    }

    public void notifyStandupSubmitted(Standup standup, User submitter) {
        if (standup == null || standup.getTeam() == null) return;
        Optional<User> activeLeadOpt = leadershipService.resolveActiveLeadForDate(standup.getTeam(), LocalDate.now());
        if (activeLeadOpt.isEmpty()) return;
        User lead = activeLeadOpt.get();
        if (submitter != null && Objects.equals(lead.getId(), submitter.getId())) return;

        String name = submitter != null ? submitter.getName() : "Team Member";
        createAndSend(
                lead,
                standup.getTeam(),
                NotificationType.STANDUP_SUBMITTED,
                "Daily Standup Submitted",
                name + " submitted today's standup.",
                "STANDUP",
                standup.getId(),
                "/team"
        );
    }

    public void notifyStandupAnswered(Standup standup) {
        if (standup == null || standup.getUser() == null || standup.getTeam() == null) return;

        createAndSend(
                standup.getUser(),
                standup.getTeam(),
                NotificationType.STANDUP_ANSWERED,
                "Lead Answered Your Standup",
                "Your Lead replied to your question in today's standup.",
                "STANDUP",
                standup.getId(),
                "/home"
        );
    }

    // ==========================================
    // NOTIFICATION USER API OPERATIONS
    // ==========================================

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(User user, Pageable pageable) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user, pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findByIdAndRecipient(notificationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found or access denied"));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }

        return mapToResponse(notification);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForUser(user, Instant.now());
    }

    // ==========================================
    // PUSH SUBSCRIPTION MANAGEMENT
    // ==========================================

    @Transactional
    public void registerPushSubscription(User user, PushSubscriptionRequest request) {
        if (user == null || request == null || !StringUtils.hasText(request.getEndpoint())) {
            throw new IllegalArgumentException("Invalid subscription payload");
        }

        String endpoint = request.getEndpoint().trim();
        String p256dh = request.getKeys() != null ? request.getKeys().getP256dh() : "";
        String auth = request.getKeys() != null ? request.getKeys().getAuth() : "";

        Optional<PushSubscription> existing = pushSubscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            PushSubscription sub = existing.get();
            sub.setUser(user);
            sub.setP256dh(p256dh);
            sub.setAuth(auth);
            sub.setUserAgent(request.getUserAgent());
            sub.setActive(true);
            sub.setUpdatedAt(Instant.now());
            pushSubscriptionRepository.save(sub);
        } else {
            PushSubscription sub = PushSubscription.builder()
                    .user(user)
                    .endpoint(endpoint)
                    .p256dh(p256dh)
                    .auth(auth)
                    .userAgent(request.getUserAgent())
                    .active(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            pushSubscriptionRepository.save(sub);
        }
    }

    @Transactional
    public void deletePushSubscription(User user, String endpoint) {
        if (StringUtils.hasText(endpoint)) {
            pushSubscriptionRepository.deactivateEndpoint(endpoint.trim(), Instant.now());
        }
    }

    // ==========================================
    // NOTIFICATION PREFERENCES
    // ==========================================

    @Transactional(readOnly = true)
    public NotificationPreferenceDto getUserPreferences(User user) {
        NotificationPreference pref = preferenceRepository.findByUser(user)
                .orElseGet(() -> NotificationPreference.builder().user(user).build());

        return NotificationPreferenceDto.builder()
                .pushEnabled(pref.getPushEnabled())
                .taskAssigned(pref.getTaskAssigned())
                .taskReviews(pref.getTaskReviews())
                .homeworkPublished(pref.getHomeworkPublished())
                .homeworkReviews(pref.getHomeworkReviews())
                .standupReminders(pref.getStandupReminders())
                .teamUpdates(pref.getTeamUpdates())
                .build();
    }

    @Transactional
    public NotificationPreferenceDto updateUserPreferences(User user, NotificationPreferenceDto dto) {
        NotificationPreference pref = preferenceRepository.findByUser(user)
                .orElseGet(() -> NotificationPreference.builder().user(user).build());

        if (dto.getPushEnabled() != null) pref.setPushEnabled(dto.getPushEnabled());
        if (dto.getTaskAssigned() != null) pref.setTaskAssigned(dto.getTaskAssigned());
        if (dto.getTaskReviews() != null) pref.setTaskReviews(dto.getTaskReviews());
        if (dto.getHomeworkPublished() != null) pref.setHomeworkPublished(dto.getHomeworkPublished());
        if (dto.getHomeworkReviews() != null) pref.setHomeworkReviews(dto.getHomeworkReviews());
        if (dto.getStandupReminders() != null) pref.setStandupReminders(dto.getStandupReminders());
        if (dto.getTeamUpdates() != null) pref.setTeamUpdates(dto.getTeamUpdates());

        pref.setUpdatedAt(Instant.now());
        pref = preferenceRepository.save(pref);

        return getUserPreferences(user);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientUserId(n.getRecipient() != null ? n.getRecipient().getId() : null)
                .teamId(n.getTeam() != null ? n.getTeam().getId() : null)
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .entityType(n.getEntityType())
                .entityId(n.getEntityId())
                .actionUrl(n.getActionUrl())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }
}
