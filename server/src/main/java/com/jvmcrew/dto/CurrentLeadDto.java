package com.jvmcrew.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentLeadDto {
    private Long userId;
    private String name;
    private String email;
    private String position;
    private String serialNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String periodLabel;
    private String monthName;
    @JsonProperty("isUserCurrentLead")
    private Boolean isUserCurrentLead;
    private String phoneNumber;
    private String college;
    private String organization;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
}
