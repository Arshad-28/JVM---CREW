package com.jvmcrew.dto;

import com.jvmcrew.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long id;
    private String name;
    private String email;
    private Role role;
    private Long teamId;
    private String teamName;
    private TeamSummary team;
    private String serialNumber;
    private String position;
    private Boolean isCurrentLead;
    private String leadPeriod;
    private String phoneNumber;
    private String college;
    private String organization;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String photoUrl;
    private String avatarUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamSummary {
        private Long id;
        private String name;
        private String displayName;
    }
}
