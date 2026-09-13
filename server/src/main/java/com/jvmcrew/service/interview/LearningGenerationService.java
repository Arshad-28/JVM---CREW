package com.jvmcrew.service.interview;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.interview.CodeExampleDto;
import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningGenerationService {

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public void generateLearningContent(InterviewLearningSession session) {
        String systemPrompt = """
            You are a patient, encouraging, and expert Technical Mentor & Interview Lead at JVM CREW.

            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, BITWISE TRICKS, LAMBDAS, STREAMS, RECURSION, OR LOW-LEVEL INTERNALS UNLESS THE USER EXPLICITLY REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.

            PRINCIPLES:
            1. HONOR USER EXPLICIT REQUESTS: If the user specifically requests a particular technique or method (e.g., "using bitwise operators", "using streams", "using recursion", "optimized with two pointers"), honor their explicit request and teach that specific technique clearly.
            2. DEFAULT TO SIMPLEST CORRECT ANSWER: When no specific technique is requested, always use the standard, clean, intuitive beginner solution (e.g., for general even/odd, use standard modulo `if (n % 2 == 0)` with readable if/else, NOT bitwise).
            3. EXPLANATIONS SHORT & CLEAR:
               - Concept -> Simple explanation -> Small example -> Code -> How it works.
               - Avoid multi-paragraph internal JVM/memory theory unless specifically requested.
            4. READABLE CODE:
               - Write clean, readable beginner-friendly code with clear variable names and braces.
               - Avoid clever one-liners, ternary tricks, or obscure language features.
            5. ADVANCED KNOWLEDGE SECONDARY:
               - If an advanced alternative exists for a general question, keep it under an optional secondary note (e.g. "Alternative Technique") and explain clearly that the beginner approach is standard.
            6. APPLIES GLOBALLY: Java, Python, JS, C++, SQL, Docker, Git, Spring Boot, DSA, etc.

            Strict JSON Schema required:
            {
              "topicTitle": "Clean, descriptive technical title (e.g., 'Java: Even or Odd Number Check' or 'Java: Variables & Data Types')",
              "technology": "Standardized technology name (e.g., 'Java', 'SQL', 'Spring Boot', 'DSA', 'Docker', 'React', 'Git')",
              "summary": "Clear, intuitive 2-3 sentence explanation addressing the user's prompt directly in simple, accessible language.",
              "keyConcepts": [
                "Key Point 1: Clear, straightforward explanation",
                "Key Point 2: Clear, straightforward explanation",
                "Key Point 3: Clear, straightforward explanation"
              ],
              "examples": [
                {
                  "title": "Simple & Readable Code Example",
                  "language": "java",
                  "code": "// Clean, readable, beginner-friendly code snippet\\npublic class Example { ... }",
                  "explanation": "Simple step-by-step walkthrough of how this code works and why it is correct."
                }
              ],
              "commonMistakes": [
                "Common Mistake 1: Simple explanation of what beginners often misunderstand and how to avoid it.",
                "Common Mistake 2: Practical tip."
              ],
              "interviewRelevance": "Why interviewers ask about this fundamental concept and what simple explanation they expect."
            }
            """;

        String userPrompt = String.format("""
            User Input / Request: "%s"
            Selected Difficulty: %s
            Selected Technology: %s
            """,
                session.getUserInput(),
                session.getDifficulty() != null ? session.getDifficulty().name() : "BEGINNER",
                session.getTechnology() != null && !session.getTechnology().isBlank() ? session.getTechnology() : "Auto-detect"
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);

        String topicTitle = root.path("topicTitle").asText(session.getUserInput());
        String technology = root.path("technology").asText(session.getTechnology() != null ? session.getTechnology() : "Java");
        String summary = root.path("summary").asText("");
        String interviewRelevance = root.path("interviewRelevance").asText("");

        List<String> keyConcepts = new ArrayList<>();
        JsonNode conceptsNode = root.path("keyConcepts");
        if (conceptsNode.isArray()) {
            for (JsonNode c : conceptsNode) {
                keyConcepts.add(c.asText());
            }
        }

        List<CodeExampleDto> examples = new ArrayList<>();
        JsonNode examplesNode = root.path("examples");
        if (examplesNode.isArray()) {
            for (JsonNode ex : examplesNode) {
                examples.add(CodeExampleDto.builder()
                        .title(ex.path("title").asText("Code Example"))
                        .language(ex.path("language").asText("java"))
                        .code(ex.path("code").asText(""))
                        .explanation(ex.path("explanation").asText(""))
                        .build());
            }
        }

        List<String> commonMistakes = new ArrayList<>();
        JsonNode mistakesNode = root.path("commonMistakes");
        if (mistakesNode.isArray()) {
            for (JsonNode m : mistakesNode) {
                commonMistakes.add(m.asText());
            }
        }

        try {
            session.setTopic(topicTitle);
            session.setTechnology(technology);
            session.setSummary(summary);
            session.setKeyConceptsJson(objectMapper.writeValueAsString(keyConcepts));
            session.setExamplesJson(objectMapper.writeValueAsString(examples));
            session.setCommonMistakesJson(objectMapper.writeValueAsString(commonMistakes));
            session.setInterviewRelevance(interviewRelevance);
        } catch (Exception e) {
            log.error("Failed to serialize learning content JSON: {}", e.getMessage(), e);
        }
    }
}
