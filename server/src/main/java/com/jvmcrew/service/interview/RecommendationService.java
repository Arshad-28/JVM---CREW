package com.jvmcrew.service.interview;

import com.jvmcrew.dto.interview.LearningInsightsDto;
import com.jvmcrew.dto.interview.UserRecommendationDto;
import com.jvmcrew.dto.interview.UserWeaknessDto;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.model.interview.InterviewMockSession;
import com.jvmcrew.model.interview.InterviewUserWeakness;
import com.jvmcrew.repository.interview.InterviewLearningSessionRepository;
import com.jvmcrew.repository.interview.InterviewMockSessionRepository;
import com.jvmcrew.repository.interview.InterviewPracticeAttemptRepository;
import com.jvmcrew.repository.interview.InterviewUserWeaknessRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final InterviewUserWeaknessRepository userWeaknessRepository;
    private final InterviewLearningSessionRepository sessionRepository;
    private final InterviewMockSessionRepository mockSessionRepository;
    private final InterviewPracticeAttemptRepository practiceAttemptRepository;

    @Transactional(readOnly = true)
    public LearningInsightsDto getPersonalInsights(User user) {
        List<InterviewUserWeakness> weaknesses = userWeaknessRepository.findByUserIdOrderByAverageScoreAsc(user.getId());
        List<InterviewLearningSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<InterviewMockSession> mockSessions = mockSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId());

        List<UserWeaknessDto> weaknessDtos = new ArrayList<>();
        for (InterviewUserWeakness w : weaknesses) {
            String rating = "MODERATE";
            if (w.getAverageScore() < 50) rating = "CRITICAL";
            else if (w.getAverageScore() < 70) rating = "WEAK";
            else if (w.getAverageScore() >= 85) rating = "STRONG";

            weaknessDtos.add(UserWeaknessDto.builder()
                    .id(w.getId())
                    .topic(w.getTopic())
                    .weakConcept(w.getWeakConcept())
                    .totalAttempts(w.getTotalAttempts())
                    .averageScore(Math.round(w.getAverageScore() * 10.0) / 10.0)
                    .performanceRating(rating)
                    .lastAttemptedAt(w.getLastAttemptedAt())
                    .build());
        }

        UserRecommendationDto recommendation;
        if (!weaknessDtos.isEmpty()) {
            UserWeaknessDto topWeakness = weaknessDtos.get(0);
            recommendation = UserRecommendationDto.builder()
                    .suggestedTopic(topWeakness.getTopic())
                    .technology("Java")
                    .reason(String.format("You scored %d%% on %s in your recent practice. Review this concept to build interview readiness.",
                            Math.round(topWeakness.getAverageScore()), topWeakness.getWeakConcept()))
                    .actionPrompt(String.format("I want to master %s in %s.", topWeakness.getWeakConcept(), topWeakness.getTopic()))
                    .build();
        } else if (!sessions.isEmpty()) {
            InterviewLearningSession recentSession = sessions.get(0);
            recommendation = UserRecommendationDto.builder()
                    .suggestedTopic(recentSession.getTopic())
                    .technology(recentSession.getTechnology())
                    .reason(String.format("You recently studied %s. Take a Mock Interview to test your depth under interview conditions.", recentSession.getTopic()))
                    .actionPrompt(String.format("I want to do a technical mock interview on %s.", recentSession.getTopic()))
                    .build();
        } else {
            recommendation = UserRecommendationDto.builder()
                    .suggestedTopic("Java Variables & Data Types")
                    .technology("Java")
                    .reason("Start your first structured interview preparation session today.")
                    .actionPrompt("I learned variables and data types in Java.")
                    .build();
        }

        int completedMocks = (int) mockSessions.stream().filter(m -> m.getOverallScore() != null).count();
        double mockAvg = completedMocks > 0
                ? mockSessions.stream().filter(m -> m.getOverallScore() != null).mapToInt(InterviewMockSession::getOverallScore).average().orElse(0.0)
                : 0.0;

        return LearningInsightsDto.builder()
                .totalSessionsCount(sessions.size())
                .totalPracticeQuestionsAttempted(sessions.size() * 3)
                .totalMockInterviewsCompleted(completedMocks)
                .overallPracticeAverage(mockAvg > 0 ? mockAvg : null)
                .overallMockAverage(mockAvg > 0 ? Math.round(mockAvg * 10.0) / 10.0 : null)
                .weakAreas(weaknessDtos)
                .recommendation(recommendation)
                .build();
    }
}
