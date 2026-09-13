package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberStreakDto {
    private Long userId;
    private String name;
    private String serialNumber;
    private String role;
    private String position;
    private int currentStreak;
    private int longestStreak;
    private boolean hasActivityToday;
    private int todayActivityCount;
    private LocalDate lastActiveDate;
    private String statusMessage;
}
