package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotableAchievementDto {
    private String category; // "TASK_DELIVERY", "STANDUP_STREAK", "HOMEWORK_EXCELLENCE", "CURRICULUM_MILESTONE"
    private String title;
    private String description;
    private String memberName;
    private String timestamp;
}
