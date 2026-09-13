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
public class LeadershipAssignmentDto {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long userId;
    private String userName;
    private String userEmail;
    private String serialNumber;
    private String position;
    private LocalDate startDate;
    private LocalDate endDate;
    private String monthLabel;
    private String notes;
    private String status;
    @JsonProperty("isCurrent")
    private Boolean isCurrent;
}
