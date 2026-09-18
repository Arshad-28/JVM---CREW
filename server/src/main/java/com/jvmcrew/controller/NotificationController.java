package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.service.NotificationService;
import com.jvmcrew.service.WebPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final WebPushService webPushService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getUserNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int boundedSize = Math.min(Math.max(1, size), 50);
        int boundedPage = Math.max(0, page);
        PageRequest pageRequest = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(notificationService.getUserNotifications(principal.getId(), pageRequest));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, principal.getId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/push-config")
    public ResponseEntity<PushConfigResponse> getPushConfig() {
        return ResponseEntity.ok(PushConfigResponse.builder()
                .vapidPublicKey(webPushService.getVapidPublicKey())
                .pushEnabled(webPushService.isPushReady())
                .build());
    }

    @PostMapping("/push-subscription")
    public ResponseEntity<Map<String, Object>> registerPushSubscription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PushSubscriptionRequest request
    ) {
        notificationService.registerPushSubscription(principal.getId(), request);
        return ResponseEntity.ok(Map.of("status", "SUBSCRIBED"));
    }

    @DeleteMapping("/push-subscription")
    public ResponseEntity<Map<String, Object>> deletePushSubscription(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String endpoint
    ) {
        notificationService.deletePushSubscription(principal.getId(), endpoint);
        return ResponseEntity.ok(Map.of("status", "DELETED"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(notificationService.getUserPreferences(principal.getId()));
    }

    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDto> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody NotificationPreferenceDto dto
    ) {
        return ResponseEntity.ok(notificationService.updateUserPreferences(principal.getId(), dto));
    }
}
