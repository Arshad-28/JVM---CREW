package com.jvmcrew.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectProgressDto {
    private String subject;
    private int totalTopics;
    private int doneTopics;
    private int inProgressTopics;
    private int notStartedTopics;
    private int completionPct; // Derived: (doneTopics * 100) / totalTopics
    private List<LearningTopicDto> topics;
}
