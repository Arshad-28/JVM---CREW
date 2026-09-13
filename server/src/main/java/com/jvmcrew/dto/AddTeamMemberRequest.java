package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddTeamMemberRequest {
    private Long userId;
    private String email;
    private String name;
    private String password;
    private String phoneNumber;
    private String college;
    private String organization;
    private String serialNumber;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String notes;
    private Boolean transferIfAssigned;
}
