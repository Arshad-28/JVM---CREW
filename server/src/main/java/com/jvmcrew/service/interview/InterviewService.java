package com.jvmcrew.service.interview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.interview.*;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.*;
import com.jvmcrew.repository.interview.InterviewMockAnswerRepository;
import com.jvmcrew.repository.interview.InterviewMockQuestionRepository;
import com.jvmcrew.repository.interview.InterviewMockSessionRepository;
import com.jvmcrew.repository.interview.InterviewUserWeaknessRepository;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewService {

    private final AiService aiService;
    private final InterviewMockSessionRepository mockSessionRepository;
    private final InterviewMockQuestionRepository mockQuestionRepository;
    private final InterviewMockAnswerRepository mockAnswerRepository;
    private final InterviewUserWeaknessRepository userWeaknessRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public MockInterviewStateDto startMockInterview(User user, Team team, StartMockInterviewRequest request) {
        aiService.checkRateLimit(user.getId());

        int targetQuestions = request.getTargetQuestions() != null && request.getTargetQuestions() > 0 ? request.getTargetQuestions() : 5;
        if (targetQuestions > 10) targetQuestions = 10;

        InterviewDifficulty difficulty = request.getDifficulty() != null ? request.getDifficulty() : InterviewDifficulty.BEGINNER;
        MockInterviewType interviewType = request.getInterviewType() != null ? request.getInterviewType() : MockInterviewType.TECHNICAL;

        InterviewMockSession mockSession = InterviewMockSession.builder()
                .user(user)
                .team(team)
                .technology(request.getTechnology().trim())
                .topic(request.getTopic().trim())
                .difficulty(difficulty)
                .interviewType(interviewType)
                .status(MockInterviewStatus.IN_PROGRESS)
                .targetQuestions(targetQuestions)
                .currentQuestionIndex(0)
                .startedAt(Instant.now())
                .build();

        mockSession = mockSessionRepository.save(mockSession);

        String systemPrompt = """
            You are a Senior Technical Hiring Manager and supportive mentor at JVM CREW conducting a technical mock interview.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            Generate Question 1 of the interview tailored to the candidate's difficulty level to assess their fundamental understanding of the topic.
            For BEGINNER difficulty (the global default), start with a clean, clear foundational question.
            
            Strict JSON Schema required:
            {
              "questionText": "Direct, professional, beginner-friendly technical interview question",
              "category": "Core Concept / Fundamentals / Practical / Syntax & Basics"
            }
            """;

        String userPrompt = String.format("""
            Technology: %s
            Topic: %s
            Difficulty Level: %s
            Interview Type: %s
            Question Number: 1 of %d
            """,
                mockSession.getTechnology(),
                mockSession.getTopic(),
                mockSession.getDifficulty().name(),
                mockSession.getInterviewType().name(),
                targetQuestions
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);
        String questionText = root.path("questionText").asText("Can you explain the core architecture and purpose of " + mockSession.getTopic() + "?");
        String category = root.path("category").asText("Core Fundamentals");

        InterviewMockQuestion question1 = InterviewMockQuestion.builder()
                .mockSession(mockSession)
                .sequenceNumber(1)
                .questionText(questionText)
                .category(category)
                .difficulty(difficulty)
                .createdAt(Instant.now())
                .build();

        question1 = mockQuestionRepository.save(question1);

        return buildStateDto(mockSession, question1, List.of(question1), null);
    }

    @Transactional
    public MockInterviewStateDto submitMockAnswer(User user, Long mockSessionId, String answerText) {
        aiService.checkRateLimit(user.getId());

        InterviewMockSession session = mockSessionRepository.findByIdAndUserId(mockSessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Mock interview session not found or unauthorized"));

        if (session.getStatus() != MockInterviewStatus.IN_PROGRESS) {
            return getMockInterviewState(user, mockSessionId);
        }

        int currentSeq = session.getCurrentQuestionIndex() + 1;
        InterviewMockQuestion currentQuestion = mockQuestionRepository.findByMockSessionIdAndSequenceNumber(mockSessionId, currentSeq)
                .orElseThrow(() -> new IllegalStateException("Current question #" + currentSeq + " not found"));

        String evalSystemPrompt = """
            You are an expert Technical Interviewer and supportive mentor evaluating a candidate's answer in a mock interview.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            Evaluate the response with constructive clarity:
            1. Recognize sound foundational understanding.
            2. In `betterResponse`, provide a crisp, simple, beginner-friendly answer that sounds articulate and professional without unnecessary academic jargon or overly complex internals.
            
            Provide a score from 0 to 10.
            
            Strict JSON Schema required:
            {
              "score": 8, // 0 to 10
              "evaluationSummary": "Brief direct feedback on the candidate's answer.",
              "technicalFeedback": "Key nuances, omissions, or correct explanations.",
              "betterResponse": "How an articulate engineer would phrase this concisely and clearly.",
              "identifiedWeakConcept": "Short concept name if candidate struggled (or null if mastered)"
            }
            """;

        String evalUserPrompt = String.format("""
            Topic: %s (%s)
            Difficulty: %s
            Interview Question: "%s"
            Candidate's Answer:
            "%s"
            """,
                session.getTopic(),
                session.getTechnology(),
                currentQuestion.getDifficulty().name(),
                currentQuestion.getQuestionText(),
                answerText
        );

        JsonNode evalRoot = aiService.generateStructuredJson(evalSystemPrompt, evalUserPrompt);
        int score = evalRoot.path("score").asInt(5);
        if (score < 0) score = 0;
        if (score > 10) score = 10;

        String summary = evalRoot.path("evaluationSummary").asText("Answer evaluated.");
        String feedback = evalRoot.path("technicalFeedback").asText("");
        String betterResponse = evalRoot.path("betterResponse").asText("");
        String weakConcept = evalRoot.path("identifiedWeakConcept").asText("");

        MockAnswerDto answerDto = MockAnswerDto.builder()
                .mockQuestionId(currentQuestion.getId())
                .answerText(answerText)
                .score(score)
                .evaluationSummary(summary)
                .technicalFeedback(feedback)
                .betterResponse(betterResponse)
                .createdAt(Instant.now())
                .build();

        String feedbackJson = null;
        try {
            feedbackJson = objectMapper.writeValueAsString(answerDto);
        } catch (Exception e) {
            log.error("Failed to serialize mock answer JSON: {}", e.getMessage());
        }

        InterviewMockAnswer answer = InterviewMockAnswer.builder()
                .mockQuestion(currentQuestion)
                .mockSession(session)
                .user(user)
                .answerText(answerText)
                .score(score)
                .feedbackJson(feedbackJson)
                .createdAt(Instant.now())
                .build();

        mockAnswerRepository.save(answer);

        if (weakConcept != null && !weakConcept.isBlank() && !weakConcept.equalsIgnoreCase("null") && score <= 7) {
            updateUserWeakness(user, session.getTopic(), weakConcept.trim(), score * 10);
        }

        session.setCurrentQuestionIndex(currentSeq);

        if (currentSeq < session.getTargetQuestions()) {
            int nextSeq = currentSeq + 1;
            String nextPromptSystem = """
                You are a Technical Interviewer conducting an adaptive technical mock interview.
                
                CRITICAL CORE DIRECTIVE:
                DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
                DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
                
                Based on the candidate's previous response, generate the NEXT question (Question #%d of %d).
                Keep questions clear, practical, and aligned with the candidate's difficulty level.
                
                Adaptive Rules:
                - If previous score was high (8-10): ask a slightly deeper conceptual or practical follow-up.
                - If previous score was moderate (5-7): probe the missing concept or ask a related practical question.
                - If previous score was low (0-4): pivot to test foundational basics or a simpler aspect.
                
                Strict JSON Schema required:
                {
                  "questionText": "The next adaptive interview question",
                  "category": "Category name (e.g., Core Concept / Practical Application / Common Use Cases / Syntax & Basics)"
                }
                """;

            String nextPromptUser = String.format("""
                Topic: %s (%s)
                Difficulty: %s
                Previous Question: "%s"
                Candidate's Answer: "%s"
                Score: %d/10
                Question to generate: #%d of %d
                """,
                    session.getTopic(),
                    session.getTechnology(),
                    session.getDifficulty().name(),
                    currentQuestion.getQuestionText(),
                    answerText,
                    score,
                    nextSeq,
                    session.getTargetQuestions()
            );

            JsonNode nextRoot = aiService.generateStructuredJson(String.format(nextPromptSystem, nextSeq, session.getTargetQuestions()), nextPromptUser);
            String nextQText = nextRoot.path("questionText").asText("Can you describe how you would apply " + session.getTopic() + " in a production environment?");
            String nextCategory = nextRoot.path("category").asText("Practical Application");

            InterviewMockQuestion nextQuestion = InterviewMockQuestion.builder()
                    .mockSession(session)
                    .sequenceNumber(nextSeq)
                    .questionText(nextQText)
                    .category(nextCategory)
                    .difficulty(session.getDifficulty())
                    .createdAt(Instant.now())
                    .build();

            nextQuestion = mockQuestionRepository.save(nextQuestion);
            mockSessionRepository.save(session);

            List<InterviewMockQuestion> allQuestions = mockQuestionRepository.findByMockSessionIdOrderBySequenceNumberAsc(mockSessionId);
            return buildStateDto(session, nextQuestion, allQuestions, null);
        } else {
            return finalizeMockInterview(user, session);
        }
    }

    @Transactional
    public MockInterviewStateDto finalizeMockInterview(User user, InterviewMockSession session) {
        List<InterviewMockQuestion> allQuestions = mockQuestionRepository.findByMockSessionIdOrderBySequenceNumberAsc(session.getId());
        List<InterviewMockAnswer> allAnswers = mockAnswerRepository.findByMockSessionIdAndUserId(session.getId(), user.getId());

        StringBuilder historySummary = new StringBuilder();
        int totalScoreSum = 0;
        int count = 0;

        for (InterviewMockQuestion q : allQuestions) {
            historySummary.append(String.format("Q%d: %s\n", q.getSequenceNumber(), q.getQuestionText()));
            for (InterviewMockAnswer a : allAnswers) {
                if (a.getMockQuestion().getId().equals(q.getId())) {
                    historySummary.append(String.format("Candidate Answer: %s\nScore: %d/10\n\n", a.getAnswerText(), a.getScore()));
                    totalScoreSum += a.getScore() * 10;
                    count++;
                }
            }
        }

        int overallScore = count > 0 ? totalScoreSum / count : 0;

        String reportSystem = """
            You are a Senior Bar Raiser and VP of Engineering compiling a comprehensive, professional interview evaluation report.
            Analyze all questions and candidate answers from this session to generate a structured evaluation rubric.
            
            Strict JSON Schema required:
            {
              "overallScore": 85, // 0 to 100
              "readinessLevel": "INTERVIEW_READY", // One of: NOT_READY, DEVELOPING, INTERVIEW_READY, EXCEPTIONAL
              "executiveSummary": "2-3 sentence executive debrief on candidate's performance and readiness.",
              "rubricScores": {
                "Technical Understanding": 85,
                "Accuracy": 80,
                "Problem Solving": 90,
                "Conceptual Depth": 75,
                "Communication": 88
              },
              "strongAreas": [
                "Strong mastery of core principles",
                "Clear verbal articulation of concepts"
              ],
              "weakAreas": [
                "Omission of concurrency edge cases",
                "Superficial explanation of underlying mechanics"
              ],
              "questionsStruggledWith": [
                "Detailed internal mechanics questions"
              ],
              "whatToRevise": [
                "Review underlying framework / language runtime mechanics",
                "Practice edge-case handling"
              ],
              "recommendedNextTopic": "Advanced Deep Dive & Concurrency"
            }
            """;

        String reportUser = String.format("""
            Topic: %s (%s)
            Difficulty: %s
            Calculated Baseline Score: %d%%
            Interview Transcript:
            %s
            """,
                session.getTopic(),
                session.getTechnology(),
                session.getDifficulty().name(),
                overallScore,
                historySummary.toString()
        );

        JsonNode root = aiService.generateStructuredJson(reportSystem, reportUser);

        int finalScore = root.path("overallScore").asInt(overallScore);
        String readinessLevel = root.path("readinessLevel").asText("DEVELOPING");
        String executiveSummary = root.path("executiveSummary").asText("Mock interview completed.");
        String recommendedNextTopic = root.path("recommendedNextTopic").asText(session.getTopic() + " Advanced Practice");

        Map<String, Integer> rubricScores = new HashMap<>();
        JsonNode rubricNode = root.path("rubricScores");
        if (rubricNode.isObject()) {
            rubricNode.fieldNames().forEachRemaining(key -> rubricScores.put(key, rubricNode.path(key).asInt(finalScore)));
        } else {
            rubricScores.put("Technical Understanding", finalScore);
            rubricScores.put("Accuracy", finalScore);
            rubricScores.put("Problem Solving", finalScore);
            rubricScores.put("Conceptual Depth", finalScore);
            rubricScores.put("Communication", finalScore);
        }

        List<String> strongAreas = new ArrayList<>();
        JsonNode strongNode = root.path("strongAreas");
        if (strongNode.isArray()) {
            for (JsonNode s : strongNode) strongAreas.add(s.asText());
        }

        List<String> weakAreas = new ArrayList<>();
        JsonNode weakNode = root.path("weakAreas");
        if (weakNode.isArray()) {
            for (JsonNode w : weakNode) weakAreas.add(w.asText());
        }

        List<String> questionsStruggledWith = new ArrayList<>();
        JsonNode struggledNode = root.path("questionsStruggledWith");
        if (struggledNode.isArray()) {
            for (JsonNode q : struggledNode) questionsStruggledWith.add(q.asText());
        }

        List<String> whatToRevise = new ArrayList<>();
        JsonNode reviseNode = root.path("whatToRevise");
        if (reviseNode.isArray()) {
            for (JsonNode r : reviseNode) whatToRevise.add(r.asText());
        }

        MockInterviewReportDto reportDto = MockInterviewReportDto.builder()
                .overallScore(finalScore)
                .readinessLevel(readinessLevel)
                .executiveSummary(executiveSummary)
                .rubricScores(rubricScores)
                .strongAreas(strongAreas)
                .weakAreas(weakAreas)
                .questionsStruggledWith(questionsStruggledWith)
                .whatToRevise(whatToRevise)
                .recommendedNextTopic(recommendedNextTopic)
                .build();

        try {
            session.setOverallScore(finalScore);
            session.setPerformanceRating(readinessLevel);
            session.setReportJson(objectMapper.writeValueAsString(reportDto));
            session.setStatus(MockInterviewStatus.COMPLETED);
            session.setCompletedAt(Instant.now());
            mockSessionRepository.save(session);
        } catch (Exception e) {
            log.error("Failed to serialize mock report JSON: {}", e.getMessage());
        }

        return buildStateDto(session, null, allQuestions, reportDto);
    }

    @Transactional(readOnly = true)
    public MockInterviewStateDto getMockInterviewState(User user, Long mockSessionId) {
        InterviewMockSession session = mockSessionRepository.findByIdAndUserId(mockSessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Mock interview session not found or unauthorized"));

        List<InterviewMockQuestion> allQuestions = mockQuestionRepository.findByMockSessionIdOrderBySequenceNumberAsc(mockSessionId);

        InterviewMockQuestion currentQuestion = null;
        if (session.getStatus() == MockInterviewStatus.IN_PROGRESS) {
            int currentSeq = session.getCurrentQuestionIndex() + 1;
            currentQuestion = mockQuestionRepository.findByMockSessionIdAndSequenceNumber(mockSessionId, currentSeq).orElse(null);
        }

        MockInterviewReportDto report = null;
        if (session.getReportJson() != null && !session.getReportJson().isBlank()) {
            try {
                report = objectMapper.readValue(session.getReportJson(), MockInterviewReportDto.class);
            } catch (Exception e) {
                log.error("Failed to parse report JSON: {}", e.getMessage());
            }
        }

        return buildStateDto(session, currentQuestion, allQuestions, report);
    }

    private MockInterviewStateDto buildStateDto(InterviewMockSession session,
                                                InterviewMockQuestion currentQuestion,
                                                List<InterviewMockQuestion> questions,
                                                MockInterviewReportDto report) {
        List<MockQuestionDto> questionDtos = new ArrayList<>();
        List<InterviewMockAnswer> answers = mockAnswerRepository.findByMockSessionIdAndUserId(session.getId(), session.getUser().getId());

        for (InterviewMockQuestion q : questions) {
            MockAnswerDto answerDto = null;
            for (InterviewMockAnswer a : answers) {
                if (a.getMockQuestion().getId().equals(q.getId())) {
                    if (a.getFeedbackJson() != null) {
                        try {
                            answerDto = objectMapper.readValue(a.getFeedbackJson(), MockAnswerDto.class);
                        } catch (Exception ignored) {}
                    }
                    if (answerDto == null) {
                        answerDto = MockAnswerDto.builder()
                                .mockQuestionId(q.getId())
                                .answerText(a.getAnswerText())
                                .score(a.getScore())
                                .createdAt(a.getCreatedAt())
                                .build();
                    }
                }
            }

            questionDtos.add(MockQuestionDto.builder()
                    .id(q.getId())
                    .sequenceNumber(q.getSequenceNumber())
                    .questionText(q.getQuestionText())
                    .category(q.getCategory())
                    .difficulty(q.getDifficulty())
                    .createdAt(q.getCreatedAt())
                    .answer(answerDto)
                    .build());
        }

        MockQuestionDto curDto = null;
        if (currentQuestion != null) {
            curDto = MockQuestionDto.builder()
                    .id(currentQuestion.getId())
                    .sequenceNumber(currentQuestion.getSequenceNumber())
                    .questionText(currentQuestion.getQuestionText())
                    .category(currentQuestion.getCategory())
                    .difficulty(currentQuestion.getDifficulty())
                    .createdAt(currentQuestion.getCreatedAt())
                    .build();
        }

        return MockInterviewStateDto.builder()
                .id(session.getId())
                .technology(session.getTechnology())
                .topic(session.getTopic())
                .difficulty(session.getDifficulty())
                .interviewType(session.getInterviewType())
                .status(session.getStatus())
                .targetQuestions(session.getTargetQuestions())
                .currentQuestionIndex(session.getCurrentQuestionIndex())
                .overallScore(session.getOverallScore())
                .performanceRating(session.getPerformanceRating())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .currentQuestion(curDto)
                .questions(questionDtos)
                .report(report)
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
