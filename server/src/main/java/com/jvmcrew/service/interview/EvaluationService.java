package com.jvmcrew.service.interview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.interview.PracticeEvaluationDto;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.model.interview.InterviewPracticeAttempt;
import com.jvmcrew.model.interview.InterviewPracticeQuestion;
import com.jvmcrew.model.interview.InterviewUserWeakness;
import com.jvmcrew.repository.interview.InterviewPracticeAttemptRepository;
import com.jvmcrew.repository.interview.InterviewUserWeaknessRepository;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationService {

    private final AiService aiService;
    private final InterviewPracticeAttemptRepository practiceAttemptRepository;
    private final InterviewUserWeaknessRepository userWeaknessRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public PracticeEvaluationDto evaluatePracticeAnswer(User user, InterviewLearningSession session, InterviewPracticeQuestion question, String candidateAnswer) {
        aiService.checkRateLimit(user.getId());

        String systemPrompt = """
            You are a Principal Software Engineering Interviewer and encouraging mentor at JVM CREW.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            Evaluate the candidate's answer with constructive, beginner-friendly clarity:
            1. Recognize and reward correct fundamental concepts and clear explanations.
            2. For beginner questions, evaluate based on whether the candidate understands the core concept rather than demanding obscure low-level internals.
            3. In `betterInterviewAnswer`, provide a crisp, simple, articulate answer that sounds natural and professional (not overly verbose or filled with unnecessary jargon).
            4. In `technicalCorrection` and `whatIsMissing`, be direct, kind, and educational.
            
            Provide a fair score from 0 to 10:
            - 9-10: Accurate, clear, good conceptual understanding.
            - 7-8: Solid answer with minor omissions or slight phrasing fuzziness.
            - 5-6: Partially correct on basics, but missing a key point.
            - 3-4: Confused or largely incomplete.
            - 0-2: Incorrect or completely off-topic.
            
            Strict JSON Schema required:
            {
              "score": 8, // Integer 0 to 10
              "whatYouGotRight": "Concise summary of correct points made by the candidate.",
              "whatIsMissing": "Key points or simple mechanics omitted.",
              "technicalCorrection": "Direct, helpful technical correction if there were errors.",
              "betterInterviewAnswer": "Clear, professional, beginner-friendly model interview answer.",
              "interviewTip": "A practical tip for explaining this clearly in an interview.",
              "identifiedWeakConcept": "A short 2-4 word concept name if the candidate struggled (e.g. 'Modulo Arithmetic', 'Variable Scope', 'Loops') or null if mastered"
            }
            """;

        String userPrompt = String.format("""
            Topic: "%s" (%s)
            Question: "%s"
            Expected Sample Answer: "%s"
            Candidate's Submitted Answer:
            "%s"
            """,
                session.getTopic(),
                session.getTechnology(),
                question.getQuestionText(),
                question.getSampleAnswer() != null ? question.getSampleAnswer() : "",
                candidateAnswer
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);

        int score = root.path("score").asInt(5);
        if (score < 0) score = 0;
        if (score > 10) score = 10;

        String whatYouGotRight = root.path("whatYouGotRight").asText("Good attempt covering the basics.");
        String whatIsMissing = root.path("whatIsMissing").asText("");
        String technicalCorrection = root.path("technicalCorrection").asText("");
        String betterInterviewAnswer = root.path("betterInterviewAnswer").asText("");
        String interviewTip = root.path("interviewTip").asText("");
        String weakConcept = root.path("identifiedWeakConcept").asText("");

        InterviewPracticeAttempt attempt = InterviewPracticeAttempt.builder()
                .question(question)
                .session(session)
                .user(user)
                .answerText(candidateAnswer)
                .score(score)
                .whatYouGotRight(whatYouGotRight)
                .whatIsMissing(whatIsMissing)
                .technicalCorrection(technicalCorrection)
                .betterInterviewAnswer(betterInterviewAnswer)
                .interviewTip(interviewTip)
                .createdAt(Instant.now())
                .build();

        attempt = practiceAttemptRepository.save(attempt);

        // Record or update user weakness if score is below 80% (score <= 7) or concept identified
        if (weakConcept != null && !weakConcept.isBlank() && !weakConcept.equalsIgnoreCase("null") && score <= 7) {
            updateUserWeakness(user, session.getTopic(), weakConcept.trim(), score * 10);
        }

        return PracticeEvaluationDto.builder()
                .attemptId(attempt.getId())
                .questionId(question.getId())
                .answerText(attempt.getAnswerText())
                .score(score)
                .whatYouGotRight(whatYouGotRight)
                .whatIsMissing(whatIsMissing)
                .technicalCorrection(technicalCorrection)
                .betterInterviewAnswer(betterInterviewAnswer)
                .interviewTip(interviewTip)
                .createdAt(attempt.getCreatedAt())
                .build();
    }

    private void updateUserWeakness(User user, String topic, String concept, int scorePct) {
        try {
            var existingOpt = userWeaknessRepository.findByUserIdAndTopicAndWeakConcept(user.getId(), topic, concept);
            if (existingOpt.isPresent()) {
                var weakness = existingOpt.get();
                weakness.setTotalAttempts(weakness.getTotalAttempts() + 1);
                weakness.setTotalScore(weakness.getTotalScore() + scorePct);
                weakness.setAverageScore((double) weakness.getTotalScore() / weakness.getTotalAttempts());
                weakness.setLastAttemptedAt(Instant.now());
                userWeaknessRepository.save(weakness);
            } else {
                var weakness = InterviewUserWeakness.builder()
                        .user(user)
                        .topic(topic)
                        .weakConcept(concept)
                        .totalAttempts(1)
                        .totalScore(scorePct)
                        .averageScore((double) scorePct)
                        .lastAttemptedAt(Instant.now())
                        .build();
                userWeaknessRepository.save(weakness);
            }
        } catch (Exception e) {
            log.error("Failed to update user weakness: {}", e.getMessage());
        }
    }
}
