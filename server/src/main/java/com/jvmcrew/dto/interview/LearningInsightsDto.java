package com.jvmcrew.dto.interview;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LearningInsightsDto {
    private int totalSessionsCount;
    private int totalPracticeQuestionsAttempted;
    private int totalMockInterviewsCompleted;
    private Double overallPracticeAverage;
    private Double overallMockAverage;
    private List<UserWeaknessDto> weakAreas;
    private UserRecommendationDto recommendation;
}
