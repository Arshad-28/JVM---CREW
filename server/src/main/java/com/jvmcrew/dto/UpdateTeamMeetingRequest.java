package com.jvmcrew.dto;

import com.jvmcrew.model.enums.MeetingPlatform;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamMeetingRequest {

    @Size(max = 255, message = "Meeting title must be at most 255 characters")
    private String title;

    private MeetingPlatform platform;

    @Pattern(regexp = "^https://.*", message = "Meeting URL must be a valid HTTPS URL starting with https://")
    @Size(max = 1024, message = "Meeting URL must be at most 1024 characters")
    private String meetingUrl;

    private LocalDate scheduledDate;

    @Size(max = 20, message = "Start time must be at most 20 characters")
    private String startTime;

    @Size(max = 20, message = "End time must be at most 20 characters")
    private String endTime;

    private String description;

    private Boolean isActive;
}
