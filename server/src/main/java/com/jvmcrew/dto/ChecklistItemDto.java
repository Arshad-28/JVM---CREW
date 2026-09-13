package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistItemDto {
    private String id;
    private String type; // "TASK" or "TOPIC"
    private Long entityId;
    private String title;
    private String subtitle;
    private String status;
    private boolean completed;
    private String badge;
}
