package com.jvmcrew.service.interview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.model.interview.InterviewPracticeQuestion;
import com.jvmcrew.model.interview.PracticeQuestionType;
import com.jvmcrew.repository.interview.InterviewPracticeQuestionRepository;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PracticeService {

    private final AiService aiService;
    private final InterviewPracticeQuestionRepository practiceQuestionRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<InterviewPracticeQuestion> generatePracticeQuestions(InterviewLearningSession session) {
        String systemPrompt = """
            You are a Principal Software Engineering Interviewer and patient mentor at JVM CREW.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            Generate a set of 3-4 diverse, high-quality practice questions tailored to the candidate's topic and difficulty level.
            If difficulty is BEGINNER (the global default):
            - Prioritize clear, foundational, intuitive, and practical questions.
            - Do NOT ask overly complex questions involving bitwise tricks, low-level JVM memory internals, or obscure syntax unless explicitly requested.
            - Ensure questions focus on understanding, readability, and standard everyday code patterns.
            
            Question Types to choose from appropriately:
            - MCQ (Multiple Choice Question with 4 distinct options)
            - CONCEPTUAL (Foundational understanding of core principles)
            - SHORT_ANSWER (Targeted technical definition or behavior)
            - OUTPUT_PREDICTION (Predict exact output of a clear code snippet)
            - DEBUGGING (Find the simple bug in a code snippet)
            - INTERVIEW_STYLE (Direct question commonly asked in live junior/entry rounds)
            
            Strict JSON Schema required:
            {
              "questions": [
                {
                  "questionText": "The actual question text or scenario with code snippet if applicable",
                  "questionType": "MCQ", // One of: MCQ, CONCEPTUAL, SHORT_ANSWER, OUTPUT_PREDICTION, DEBUGGING, INTERVIEW_STYLE
                  "difficulty": "BEGINNER", // One of: BEGINNER, INTERMEDIATE, ADVANCED, INTERVIEW
                  "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // Required for MCQ, omit or empty array for others
                  "hint": "A helpful beginner-friendly nudge without giving away the direct answer",
                  "sampleAnswer": "Ideal simple, clear technical response",
                  "explanation": "Why this answer is correct and key beginner-friendly takeaways"
                }
              ]
            }
            """;

        String userPrompt = String.format("""
            Topic: "%s"
            Technology: "%s"
            Difficulty: %s
            Summary Context: "%s"
            """,
                session.getTopic(),
                session.getTechnology(),
                session.getDifficulty() != null ? session.getDifficulty().name() : "BEGINNER",
                session.getSummary() != null ? session.getSummary() : session.getUserInput()
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);
        JsonNode questionsNode = root.path("questions");

        List<InterviewPracticeQuestion> generatedList = new ArrayList<>();
        if (questionsNode.isArray()) {
            int seq = 1;
            for (JsonNode qNode : questionsNode) {
                String qText = qNode.path("questionText").asText("");
                if (qText.isBlank()) continue;

                String typeStr = qNode.path("questionType").asText("CONCEPTUAL").toUpperCase();
                PracticeQuestionType qType;
                try {
                    qType = PracticeQuestionType.valueOf(typeStr);
                } catch (Exception e) {
                    qType = PracticeQuestionType.CONCEPTUAL;
                }

                String diffStr = qNode.path("difficulty").asText(session.getDifficulty().name()).toUpperCase();
                InterviewDifficulty diff;
                try {
                    diff = InterviewDifficulty.valueOf(diffStr);
                } catch (Exception e) {
                    diff = session.getDifficulty();
                }

                List<String> options = new ArrayList<>();
                JsonNode optsNode = qNode.path("options");
                if (optsNode.isArray()) {
                    for (JsonNode opt : optsNode) {
                        options.add(opt.asText());
                    }
                }

                String hint = qNode.path("hint").asText("");
                String sampleAnswer = qNode.path("sampleAnswer").asText("");
                String explanation = qNode.path("explanation").asText("");

                String optionsJson = null;
                try {
                    if (!options.isEmpty()) {
                        optionsJson = objectMapper.writeValueAsString(options);
                    }
                } catch (Exception e) {
                    log.error("Failed to serialize options JSON: {}", e.getMessage());
                }

                InterviewPracticeQuestion question = InterviewPracticeQuestion.builder()
                        .session(session)
                        .questionText(qText)
                        .questionType(qType)
                        .difficulty(diff)
                        .optionsJson(optionsJson)
                        .hint(hint)
                        .sampleAnswer(sampleAnswer)
                        .explanation(explanation)
                        .sequenceOrder(seq++)
                        .createdAt(Instant.now())
                        .build();

                generatedList.add(practiceQuestionRepository.save(question));
            }
        }

        return generatedList;
    }

    public String getQuestionHint(InterviewPracticeQuestion question) {
        if (question.getHint() != null && !question.getHint().isBlank()) {
            return question.getHint();
        }

        String systemPrompt = """
            You are a friendly technical mentor at JVM CREW.
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            Provide a brief, beginner-friendly 1-2 sentence guiding hint for this interview practice question without revealing the answer directly.
            """;
        String userPrompt = "Question: " + question.getQuestionText();
        String generatedHint = aiService.generateText(systemPrompt, userPrompt);
        question.setHint(generatedHint);
        practiceQuestionRepository.save(question);
        return generatedHint;
    }
}
