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
public class BlockerAnalysisDto {
    private int totalActiveBlockers;
    private int totalResolvedBlockers;
    private int uniqueMembersAffected;

    @Builder.Default
    private List<BlockerItemDto> activeBlockersList = new ArrayList<>();

    @Builder.Default
    private List<BlockerItemDto> resolvedBlockersList = new ArrayList<>();

    private String statusSummary; // e.g. "No blockers reported during this period."

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BlockerItemDto {
        private Long id;
        private Long userId;
        private String memberName;
        private String title;
        private String description;
        private String category;
        private String priority;
        private String status;
        private String createdAt;
        private String resolvedAt;
        private long daysOpen;
    }
}
