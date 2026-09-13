package com.jvmcrew.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamManagementDto {
    private Long id;
    private String parentBrand;
    private String customName;
    private String displayName;
    private String cohort;
    @JsonProperty("isActive")
    private Boolean isActive;
    private Instant createdAt;
    private CurrentLeadDto currentLead;
    private List<TeamMemberSummaryDto> members;
    private int memberCount;
    @JsonProperty("isUserAuthorizedToManage")
    private Boolean isUserAuthorizedToManage;
}
