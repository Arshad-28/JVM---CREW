package com.jvmcrew.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRecommendationDto {
    private String suggestedTopic;
    private String technology;
    private String reason;
    private String actionPrompt;
}
