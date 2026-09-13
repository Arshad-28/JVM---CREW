package com.jvmcrew.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberSummaryDto {
    private Long membershipId;
    private Long userId;
    private String name;
    private String email;
    private String serialNumber;
    private String position;
    private String role;
    @JsonProperty("isCurrentLead")
    private Boolean isCurrentLead;
    private int streakDays;
    private Instant joinedAt;
    @JsonProperty("isActive")
    private Boolean isActive;
    private String phoneNumber;
    private String college;
    private String organization;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String photoUrl;
    private String avatarUrl;
}
