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
public class TeamMeetingsAnalysisDto {
    private int totalMeetingsScheduled;
    private int totalMeetingsConducted;
    private int upcomingMeetingsCount;

    @Builder.Default
    private List<MeetingSummaryDto> meetingsList = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MeetingSummaryDto {
        private Long id;
        private String title;
        private String platform;
        private String scheduledDate;
        private String startTime;
        private String endTime;
        private String createdByName;
        private boolean isUpcoming;
    }
}
