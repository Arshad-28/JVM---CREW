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
public class OrganizationTeamSummaryDto {
    private Long id;
    private String parentBrand;
    private String customName;
    private String displayName;
    private String cohort;
    private int memberCount;
    private Long currentLeadUserId;
    private String currentLeadName;
    private String currentLeadEmail;
    private String currentLeadPeriod;
    @JsonProperty("isActive")
    private Boolean isActive;
    private Instant createdAt;
}
