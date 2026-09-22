package com.jvmcrew.dto;

import com.jvmcrew.model.enums.MeetingPlatform;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMeetingDto {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long createdById;
    private String createdByName;
    private String title;
    private MeetingPlatform platform;
    private String meetingUrl;
    private LocalDate scheduledDate;
    private String startTime;
    private String endTime;
    private String description;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    private Boolean isUpcoming;
}
