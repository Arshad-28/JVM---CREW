package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MockInterviewReportDto {
    private Integer overallScore; // 0-100
    private String readinessLevel; // NOT_READY, DEVELOPING, INTERVIEW_READY, EXCEPTIONAL
    private String executiveSummary;
    private Map<String, Integer> rubricScores; // Technical Understanding, Accuracy, Problem Solving, Conceptual Depth, Communication
    private List<String> strongAreas;
    private List<String> weakAreas;
    private List<String> questionsStruggledWith;
    private List<String> whatToRevise;
    private String recommendedNextTopic;
}
