package com.jvmcrew.service.interview;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.interview.*;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.*;
import com.jvmcrew.repository.interview.*;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InterviewLabService {

    private final AiService aiService;
    private final InterviewLearningSessionRepository sessionRepository;
    private final InterviewPracticeQuestionRepository practiceQuestionRepository;
    private final InterviewPracticeAttemptRepository practiceAttemptRepository;
    private final InterviewCodingProblemRepository codingProblemRepository;
    private final InterviewCodingAttemptRepository codingAttemptRepository;
    private final InterviewCoachMessageRepository coachMessageRepository;
    private final InterviewMockSessionRepository mockSessionRepository;
    private final LearningGenerationService learningGenerationService;
    private final PracticeService practiceService;
    private final CodingPracticeService codingPracticeService;
    private final ObjectMapper objectMapper;

    @Transactional
    public SessionDetailDto createSession(User user, Team team, CreateSessionRequest request) {
        aiService.checkRateLimit(user.getId());

        InterviewDifficulty difficulty = request.getDifficulty() != null ? request.getDifficulty() : InterviewDifficulty.BEGINNER;

        InterviewLearningSession session = InterviewLearningSession.builder()
                .user(user)
                .team(team)
                .topic("Learning Session")
                .technology(request.getTechnology() != null && !request.getTechnology().isBlank() ? request.getTechnology().trim() : "Java")
                .userInput(request.getUserInput().trim())
                .difficulty(difficulty)
                .createdAt(Instant.now())
                .build();

        // 1. Generate structured learning overview
        learningGenerationService.generateLearningContent(session);
        session = sessionRepository.save(session);

        return getSessionDetail(user, session.getId());
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryDto> getUserSessions(User user, int limit) {
        var pageable = PageRequest.of(0, Math.max(1, limit));
        List<InterviewLearningSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        List<SessionSummaryDto> dtos = new ArrayList<>();

        for (InterviewLearningSession s : sessions) {
            dtos.add(SessionSummaryDto.builder()
                    .id(s.getId())
                    .topic(s.getTopic())
                    .technology(s.getTechnology())
                    .userInput(s.getUserInput())
                    .difficulty(s.getDifficulty())
                    .summary(s.getSummary())
                    .createdAt(s.getCreatedAt())
                    .completedAt(s.getCompletedAt())
                    .practiceQuestionsCount(s.getPracticeQuestions() != null ? s.getPracticeQuestions().size() : 0)
                    .codingProblemsCount(s.getCodingProblems() != null ? s.getCodingProblems().size() : 0)
                    .build());
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public SessionDetailDto getSessionDetail(User user, Long sessionId) {
        InterviewLearningSession session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Learning session not found or unauthorized"));

        List<String> keyConcepts = parseJsonList(session.getKeyConceptsJson());
        List<CodeExampleDto> examples = parseCodeExamples(session.getExamplesJson());
        List<String> commonMistakes = parseJsonList(session.getCommonMistakesJson());

        // Practice Questions
        List<InterviewPracticeQuestion> questions = practiceQuestionRepository.findBySessionIdOrderBySequenceOrderAsc(sessionId);
        List<PracticeQuestionDto> questionDtos = new ArrayList<>();

        for (InterviewPracticeQuestion q : questions) {
            List<String> options = parseJsonList(q.getOptionsJson());
            PracticeEvaluationDto latestAttempt = null;

            var attemptOpt = practiceAttemptRepository.findTopByQuestionIdAndUserIdOrderByCreatedAtDesc(q.getId(), user.getId());
            if (attemptOpt.isPresent()) {
                var att = attemptOpt.get();
                latestAttempt = PracticeEvaluationDto.builder()
                        .attemptId(att.getId())
                        .questionId(q.getId())
                        .answerText(att.getAnswerText())
                        .score(att.getScore())
                        .whatYouGotRight(att.getWhatYouGotRight())
                        .whatIsMissing(att.getWhatIsMissing())
                        .technicalCorrection(att.getTechnicalCorrection())
                        .betterInterviewAnswer(att.getBetterInterviewAnswer())
                        .interviewTip(att.getInterviewTip())
                        .createdAt(att.getCreatedAt())
                        .build();
            }

            questionDtos.add(PracticeQuestionDto.builder()
                    .id(q.getId())
                    .sessionId(sessionId)
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType())
                    .difficulty(q.getDifficulty())
                    .options(options)
                    .hint(q.getHint())
                    .sampleAnswer(q.getSampleAnswer())
                    .explanation(q.getExplanation())
                    .sequenceOrder(q.getSequenceOrder())
                    .createdAt(q.getCreatedAt())
                    .latestAttempt(latestAttempt)
                    .build());
        }

        // Coding Problems
        List<InterviewCodingProblem> problems = codingProblemRepository.findBySessionId(sessionId);
        List<CodingProblemDto> problemDtos = new ArrayList<>();

        for (InterviewCodingProblem p : problems) {
            List<CodingExampleDto> codingExamples = parseCodingExamples(p.getExamplesJson());
            List<String> constraints = parseJsonList(p.getConstraintsJson());
            List<String> hints = parseJsonList(p.getHintsJson());
            if (hints.isEmpty() && p.getHint() != null && !p.getHint().isBlank()) {
                hints = List.of(p.getHint());
            }

            CodeReviewDto latestReview = null;
            var attempts = codingAttemptRepository.findByProblemIdAndUserId(p.getId(), user.getId());
            if (!attempts.isEmpty()) {
                var lastAtt = attempts.get(attempts.size() - 1);
                if (lastAtt.getReviewFeedbackJson() != null) {
                    try {
                        latestReview = objectMapper.readValue(lastAtt.getReviewFeedbackJson(), CodeReviewDto.class);
                    } catch (Exception ignored) {}
                }
            }

            problemDtos.add(CodingProblemDto.builder()
                    .id(p.getId())
                    .sessionId(sessionId)
                    .title(p.getTitle())
                    .problemStatement(p.getProblemStatement())
                    .difficulty(p.getDifficulty())
                    .questionType(p.getQuestionType() != null ? p.getQuestionType() : "PROGRAM")
                    .language(p.getLanguage() != null ? p.getLanguage() : "JAVA")
                    .examples(codingExamples)
                    .constraints(constraints)
                    .starterCode(p.getStarterCode())
                    .hint(p.getHint())
                    .hints(hints)
                    .solution(null) // Hidden by default, loaded only on explicit View Solution request
                    .createdAt(p.getCreatedAt())
                    .latestAttempt(latestReview)
                    .build());
        }

        // Coach Messages
        List<InterviewCoachMessage> messages = coachMessageRepository.findBySessionIdAndUserIdOrderByCreatedAtAsc(sessionId, user.getId());
        List<CoachChatMessageDto> messageDtos = new ArrayList<>();
        for (InterviewCoachMessage m : messages) {
            messageDtos.add(CoachChatMessageDto.builder()
                    .id(m.getId())
                    .role(m.getRole())
                    .content(m.getContent())
                    .createdAt(m.getCreatedAt())
                    .build());
        }

        return SessionDetailDto.builder()
                .id(session.getId())
                .topic(session.getTopic())
                .technology(session.getTechnology())
                .userInput(session.getUserInput())
                .difficulty(session.getDifficulty())
                .summary(session.getSummary())
                .keyConcepts(keyConcepts)
                .examples(examples)
                .commonMistakes(commonMistakes)
                .interviewRelevance(session.getInterviewRelevance())
                .createdAt(session.getCreatedAt())
                .completedAt(session.getCompletedAt())
                .practiceQuestions(questionDtos)
                .codingProblems(problemDtos)
                .coachMessages(messageDtos)
                .build();
    }

    @Transactional
    public CoachChatMessageDto askCoach(User user, Long sessionId, String userQuestion) {
        aiService.checkRateLimit(user.getId());

        InterviewLearningSession session = sessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Learning session not found or unauthorized"));

        InterviewCoachMessage userMsg = InterviewCoachMessage.builder()
                .session(session)
                .user(user)
                .role("USER")
                .content(userQuestion.trim())
                .createdAt(Instant.now())
                .build();
        coachMessageRepository.save(userMsg);

        List<InterviewCoachMessage> history = coachMessageRepository.findBySessionIdAndUserIdOrderByCreatedAtAsc(sessionId, user.getId());
        StringBuilder conversation = new StringBuilder();
        for (InterviewCoachMessage m : history) {
            conversation.append(String.format("%s: %s\n", m.getRole(), m.getContent()));
        }

        String systemPrompt = String.format("""
            You are a patient, encouraging, and expert Technical Mentor & Interview Coach at JVM CREW.

            CORE DIRECTIVE (MANDATORY):
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, BITWISE TRICKS, OR LOW-LEVEL CONCEPTS UNLESS THE USER EXPLICITLY REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.

            YOUR ROLE & CAPABILITIES:
            - You are a general-purpose technical mentor and interview coach for all technologies (Java, Python, JS, SQL, Docker, DSA, Git, Spring Boot, etc.).
            - Context: "%s" (%s, %s difficulty). This provides helpful starting background, but is NEVER a restriction. Answer ANY question the candidate asks.
            - Prioritize: 1. Understanding -> 2. Simplicity -> 3. Correctness -> 4. Readability -> 5. Practical learning -> 6. Optimization only when requested.
            - Explain concepts in simple, clear language with small intuitive examples and line-by-line code breakdowns.
            - If an advanced alternative exists (like bitwise tricks or complex streams), keep it strictly optional under "Optional: Alternative Approach" and clearly state that the beginner approach is standard and preferred for learning.
            """,
                session.getTopic(),
                session.getTechnology(),
                session.getDifficulty() != null ? session.getDifficulty().name() : "BEGINNER"
        );

        String coachReply = aiService.generateText(systemPrompt, conversation.toString());

        InterviewCoachMessage coachMsg = InterviewCoachMessage.builder()
                .session(session)
                .user(user)
                .role("COACH")
                .content(coachReply)
                .createdAt(Instant.now())
                .build();
        coachMsg = coachMessageRepository.save(coachMsg);

        return CoachChatMessageDto.builder()
                .id(coachMsg.getId())
                .role("COACH")
                .content(coachMsg.getContent())
                .createdAt(coachMsg.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryItemDto> getCombinedHistory(User user) {
        List<HistoryItemDto> items = new ArrayList<>();

        List<InterviewLearningSession> sessions = sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (InterviewLearningSession s : sessions) {
            items.add(HistoryItemDto.builder()
                    .id(s.getId())
                    .type("LEARNING_SESSION")
                    .topic(s.getTopic())
                    .technology(s.getTechnology())
                    .difficulty(s.getDifficulty() != null ? s.getDifficulty().name() : "INTERMEDIATE")
                    .status("Active")
                    .timestamp(s.getCreatedAt())
                    .build());
        }

        List<InterviewMockSession> mocks = mockSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId());
        for (InterviewMockSession m : mocks) {
            items.add(HistoryItemDto.builder()
                    .id(m.getId())
                    .type("MOCK_INTERVIEW")
                    .topic(m.getTopic())
                    .technology(m.getTechnology())
                    .difficulty(m.getDifficulty() != null ? m.getDifficulty().name() : "INTERMEDIATE")
                    .score(m.getOverallScore())
                    .status(m.getStatus() != null ? m.getStatus().name() : "IN_PROGRESS")
                    .timestamp(m.getStartedAt())
                    .build());
        }

        items.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return items;
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<CodeExampleDto> parseCodeExamples(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CodeExampleDto>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<CodingExampleDto> parseCodingExamples(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CodingExampleDto>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
