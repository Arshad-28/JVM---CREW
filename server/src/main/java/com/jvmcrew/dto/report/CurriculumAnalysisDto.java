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
public class CurriculumAnalysisDto {
    private boolean dataAvailable;
    private String statusMessage; // e.g. "Curriculum progress telemetry recorded from learning modules."

    private int totalTopicsAvailable;
    private int topicsCompletedInPeriod;
    private int topicsActiveInPeriod;
    private int uniqueMembersParticipating;

    @Builder.Default
    private List<CurriculumTopicProgressDto> topicProgress = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CurriculumTopicProgressDto {
        private Long topicId;
        private String subject;
        private String title;
        private int membersCompleted;
        private int membersInProgress;
        private String lastActivityAt;
    }
}
