package com.jvmcrew.dto;

import com.jvmcrew.model.enums.BlockerPriority;
import com.jvmcrew.model.enums.BlockerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockerResponse {
    private Long id;
    private Long standupId;
    private Long userId;
    private String userName;
    private String title;
    private String category;
    private BlockerPriority priority;
    private String description;
    private BlockerStatus status;
    private Long assignedToId;
    private String assignedToName;
    private Instant createdAt;
    private Instant resolvedAt;
}
