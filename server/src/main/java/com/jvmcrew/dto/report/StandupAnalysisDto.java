package com.jvmcrew.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandupAnalysisDto {
    private int totalEligibleWorkdays;
    private int totalExpectedSubmissions;
    private int totalActualSubmissions;
    private int participationRatePct;
    private int textSubmissionsCount;
    private int voiceSubmissionsCount;
    private int uniqueMembersReportingBlockers;
    private Double averageConfidenceScore; // 1-5

    // Confidence level distribution (1 to 5)
    private int confidenceLevel1Count;
    private int confidenceLevel2Count;
    private int confidenceLevel3Count;
    private int confidenceLevel4Count;
    private int confidenceLevel5Count;

    @Builder.Default
    private List<MemberStandupSummaryDto> memberStandupRates = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberStandupSummaryDto {
        private Long userId;
        private String name;
        private int expected;
        private int submitted;
        private int missed;
        private int compliancePct;
        private int streakDays;
        private Double avgConfidence;
    }
}
