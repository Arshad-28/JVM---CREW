package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStreakDto {
    private Long userId;
    private String userName;
    private String serialNumber;
    private int currentStreak;
    private int longestStreak;
    private boolean hasActivityToday;
    private int todayActivityCount;
    private LocalDate lastActiveDate;
    private List<String> todayActivities;
    private List<LocalDate> recentActiveDates;
    private String statusMessage;
}
