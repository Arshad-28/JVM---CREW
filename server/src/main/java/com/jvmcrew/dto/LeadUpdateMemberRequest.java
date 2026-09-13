package com.jvmcrew.dto;

import com.jvmcrew.model.enums.Role;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadUpdateMemberRequest {
    @NotBlank(message = "Name cannot be empty")
    private String name;

    @NotBlank(message = "Email cannot be empty")
    private String email;

    private String serialNumber;
    private Role role;
    private String position;
    private String teamName;
    private String phoneNumber;
    private String college;
    private String organization;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String photoUrl;
    private String avatarUrl;
}