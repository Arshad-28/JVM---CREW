package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreferenceDto {
    private Boolean pushEnabled;
    private Boolean taskAssigned;
    private Boolean taskReviews;
    private Boolean homeworkPublished;
    private Boolean homeworkReviews;
    private Boolean standupReminders;
    private Boolean teamUpdates;
}
