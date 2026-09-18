package com.jvmcrew.dto;

import com.jvmcrew.model.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long recipientUserId;
    private Long teamId;
    private NotificationType type;
    private String title;
    private String message;
    private String entityType;
    private Long entityId;
    private String actionUrl;
    private Boolean isRead;
    private Instant createdAt;
    private Instant readAt;
}
