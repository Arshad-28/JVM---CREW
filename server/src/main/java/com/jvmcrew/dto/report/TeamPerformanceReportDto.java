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
public class TeamPerformanceReportDto {

    private String reportId;
    private String periodType; // "DAY", "WEEK", "MONTH", "CUSTOM"
    private String periodLabel; // e.g. "This Week (Sep 15 – Sep 21, 2026)"
    private String startDate;
    private String endDate;
    private String generatedAt;
    private Long teamId;
    private String teamName;
    private String teamCohort;
    private String currentLeadName;
    private String currentLeadEmail;
    private String currentLeadSerialNumber;

    @Builder.Default
    private ExecutiveSummaryDto executiveSummary = new ExecutiveSummaryDto();

    @Builder.Default
    private TeamHealthDto teamHealth = new TeamHealthDto();

    @Builder.Default
    private WorkflowPipelineDto workflowPipeline = new WorkflowPipelineDto();

    @Builder.Default
    private List<DailyActivityItemDto> dailyActivity = new ArrayList<>();

    @Builder.Default
    private List<WeeklyTrendDto> weeklyTrends = new ArrayList<>();

    @Builder.Default
    private List<PeriodComparisonDto> periodComparisons = new ArrayList<>();

    @Builder.Default
    private List<MemberPerformanceSummaryDto> memberSummaries = new ArrayList<>();

    @Builder.Default
    private BlockerAnalysisDto blockerAnalysis = new BlockerAnalysisDto();

    @Builder.Default
    private HomeworkAnalysisDto homeworkAnalysis = new HomeworkAnalysisDto();

    @Builder.Default
    private CurriculumAnalysisDto curriculumAnalysis = new CurriculumAnalysisDto();

    @Builder.Default
    private StandupAnalysisDto standupAnalysis = new StandupAnalysisDto();

    @Builder.Default
    private TeamMeetingsAnalysisDto meetingAnalysis = new TeamMeetingsAnalysisDto();

    @Builder.Default
    private InterviewLabAnalyticsDto interviewLabAnalytics = new InterviewLabAnalyticsDto();

    @Builder.Default
    private List<DataDerivedInsightDto> insights = new ArrayList<>();

    @Builder.Default
    private List<AttentionAreaItemDto> attentionAreas = new ArrayList<>();

    @Builder.Default
    private List<NotableAchievementDto> notableAchievements = new ArrayList<>();

    @Builder.Default
    private ReportMethodologyDto methodology = new ReportMethodologyDto();

    private boolean hasSufficientData;
    private String emptyDataMessage;
}
