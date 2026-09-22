package com.jvmcrew.dto;

import com.jvmcrew.model.enums.MeetingPlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamMeetingRequest {

    @NotBlank(message = "Meeting title is required")
    @Size(max = 255, message = "Meeting title must be at most 255 characters")
    private String title;

    @NotNull(message = "Meeting platform is required")
    private MeetingPlatform platform;

    @NotBlank(message = "Meeting URL is required")
    @Pattern(regexp = "^https://.*", message = "Meeting URL must be a valid HTTPS URL starting with https://")
    @Size(max = 1024, message = "Meeting URL must be at most 1024 characters")
    private String meetingUrl;

    @NotNull(message = "Scheduled date is required")
    private LocalDate scheduledDate;

    @NotBlank(message = "Start time is required")
    @Size(max = 20, message = "Start time must be at most 20 characters")
    private String startTime;

    @Size(max = 20, message = "End time must be at most 20 characters")
    private String endTime;

    private String description;
}
