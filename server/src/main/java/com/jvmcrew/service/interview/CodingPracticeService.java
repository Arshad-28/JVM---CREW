package com.jvmcrew.service.interview;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.interview.CodeReviewDto;
import com.jvmcrew.dto.interview.CodingExampleDto;
import com.jvmcrew.dto.interview.CodingHintResponseDto;
import com.jvmcrew.dto.interview.CodingSolutionDto;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.InterviewCodingAttempt;
import com.jvmcrew.model.interview.InterviewCodingProblem;
import com.jvmcrew.model.interview.InterviewDifficulty;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.repository.interview.InterviewCodingAttemptRepository;
import com.jvmcrew.repository.interview.InterviewCodingProblemRepository;
import com.jvmcrew.service.ai.AiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodingPracticeService {

    private final AiService aiService;
    private final InterviewCodingProblemRepository codingProblemRepository;
    private final InterviewCodingAttemptRepository codingAttemptRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public InterviewCodingProblem generateCodingProblem(InterviewLearningSession session) {
        String systemPrompt = """
            You are a Senior Technical Coding Interviewer and patient mentor at JVM CREW.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            BEGINNER JAVA PROGRAMMING & STRUCTURE RULES:
            1. QUESTION TYPE DETERMINATION:
               - CASE A — USER ASKS FOR A JAVA PROGRAM (e.g. "Write a Java program to check whether a number is even or odd", "Java program to calculate factorial", "Write a program to...", or foundational beginner Java topic):
                 * Set "questionType": "PROGRAM"
                 * Teach the standard beginner Java runnable program structure:
                   import java.util.Scanner;
                   public class Main {
                       public static void main(String[] args) {
                           // input using Scanner if required
                           // logic (e.g. if/else or simple for-loop)
                           // output (System.out.println)
                       }
                   }
                 * Starter code MUST be:
                   import java.util.Scanner;

                   public class Main {
                       public static void main(String[] args) {
                           // Write your code here
                       }
                   }
                 * Reference solution MUST be a complete runnable program using `public class Main` and `public static void main(String[] args)`.
               - CASE B — USER EXPLICITLY ASKS FOR A METHOD (e.g. user asks for "method", "function", "write a method", "boolean isEven", "complete the method", or method signature):
                 * Set "questionType": "METHOD"
                 * Starter code:
                   public class Solution {
                       public static boolean isEven(int n) {
                           // Write your method here
                           return false;
                       }
                   }
                 * Reference solution:
                   public class Solution {
                       public static boolean isEven(int n) {
                           return n % 2 == 0;
                       }
                   }
                 * Clearly state in problemStatement: "This problem expects a method, so you only need to complete this method."
            
            2. SIMPLEST STANDARD APPROACH FIRST:
               - Even/Odd: Use standard modulo `n % 2 == 0` (NOT bitwise `n & 1`).
               - Factorial: Use standard `for` loop (NOT recursion unless requested).
               - Loops & Conditions: Standard `for`/`while` and `if`/`else`.
               - Do NOT use streams, lambdas, generics, or recursion unless explicitly requested.
            
            Strict JSON Schema required:
            {
              "title": "Clean concise problem title (e.g. 'Check Even or Odd')",
              "questionType": "PROGRAM", // Strictly "PROGRAM" (default for Java programs) or "METHOD" (when user explicitly requests a method/function)
              "language": "JAVA",
              "problemStatement": "Clear problem description with requirements and expected program/method structure.",
              "difficulty": "BEGINNER", // One of: BEGINNER, INTERMEDIATE, ADVANCED, INTERVIEW
              "examples": [
                {
                  "input": "4",
                  "output": "Even",
                  "explanation": "4 divided by 2 has remainder 0, so it is Even."
                }
              ],
              "constraints": [
                "Time Complexity: O(1) or O(N)",
                "Space Complexity: O(1)"
              ],
              "starterCode": "import java.util.Scanner;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        // Write your code here\\n    }\\n}",
              "solutionApproach": "High-level algorithmic approach (e.g. Modulo Division, Simple For Loop)",
              "hints": [
                "Hint 1: Very small clue to guide beginner intuition without giving code.",
                "Hint 2: More direct clue on operators or loop structures.",
                "Hint 3: Edge cases to remember (e.g. zero, negative numbers)."
              ],
              "solution": {
                "code": "import java.util.Scanner;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        System.out.print(\\"Enter a number: \\");\\n        int n = sc.nextInt();\\n\\n        if (n % 2 == 0) {\\n            System.out.println(\\"Even\\");\\n        } else {\\n            System.out.println(\\"Odd\\");\\n        }\\n\\n        sc.close();\\n    }\\n}",
                "approach": "Simplest Standard Approach Name",
                "explanation": "Simple explanation of the code at a beginner learner's level.",
                "syntaxNotes": "Explanation of fundamental language constructs (import, class, main method, Scanner, if-else, loops).",
                "whyItWorks": "Simple logical explanation of why this solution is correct.",
                "exampleWalkthrough": "Trace of variable values on a simple sample test input.",
                "timeComplexity": "O(1)",
                "spaceComplexity": "O(1)",
                "edgeCases": [
                  "Basic positive numbers",
                  "Zero and negative numbers"
                ]
              }
            }
            """;

        String userPrompt = String.format("""
            Original User Request: "%s"
            Topic: "%s"
            Technology: "%s"
            Difficulty: %s
            Context Summary: "%s"
            """,
                session.getUserInput() != null ? session.getUserInput() : session.getTopic(),
                session.getTopic(),
                session.getTechnology(),
                session.getDifficulty() != null ? session.getDifficulty().name() : "BEGINNER",
                session.getSummary() != null ? session.getSummary() : ""
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);

        String title = root.path("title").asText("Coding Challenge: " + session.getTopic());
        String statement = root.path("problemStatement").asText("");
        String rawQType = root.path("questionType").asText("PROGRAM").trim().toUpperCase();
        String qType = "METHOD".equals(rawQType) ? "METHOD" : "PROGRAM";
        // If user prompt explicitly specified method, ensure METHOD
        if (session.getUserInput() != null) {
            String lowerInput = session.getUserInput().toLowerCase();
            if ((lowerInput.contains("method") || lowerInput.contains("function") || lowerInput.contains("iseven(int")) && !lowerInput.contains("program")) {
                qType = "METHOD";
            }
        }
        String lang = root.path("language").asText(session.getTechnology() != null && !session.getTechnology().isBlank() ? session.getTechnology().toUpperCase() : "JAVA");
        String starterCode = root.path("starterCode").asText("// Write your solution here\n");
        String solutionApproach = root.path("solutionApproach").asText("");

        List<CodingExampleDto> examples = new ArrayList<>();
        JsonNode examplesNode = root.path("examples");
        if (examplesNode.isArray()) {
            for (JsonNode ex : examplesNode) {
                examples.add(CodingExampleDto.builder()
                        .input(ex.path("input").asText(""))
                        .output(ex.path("output").asText(""))
                        .explanation(ex.path("explanation").asText(""))
                        .build());
            }
        }

        List<String> constraints = new ArrayList<>();
        JsonNode constraintsNode = root.path("constraints");
        if (constraintsNode.isArray()) {
            for (JsonNode c : constraintsNode) {
                constraints.add(c.asText());
            }
        }

        List<String> hints = new ArrayList<>();
        JsonNode hintsNode = root.path("hints");
        if (hintsNode.isArray()) {
            for (JsonNode h : hintsNode) {
                hints.add(h.asText());
            }
        }
        if (hints.isEmpty() && root.hasNonNull("hint")) {
            hints.add(root.path("hint").asText());
        }

        JsonNode solNode = root.path("solution");
        CodingSolutionDto solutionDto = null;
        if (solNode.isObject()) {
            List<String> edgeCases = new ArrayList<>();
            JsonNode ecNode = solNode.path("edgeCases");
            if (ecNode.isArray()) {
                for (JsonNode ec : ecNode) edgeCases.add(ec.asText());
            }

            String timeComp = solNode.path("timeComplexity").asText("O(N)");
            if (solNode.has("complexity") && solNode.path("complexity").has("time")) {
                timeComp = solNode.path("complexity").path("time").asText(timeComp);
            }
            String spaceComp = solNode.path("spaceComplexity").asText("O(1)");
            if (solNode.has("complexity") && solNode.path("complexity").has("space")) {
                spaceComp = solNode.path("complexity").path("space").asText(spaceComp);
            }

            solutionDto = CodingSolutionDto.builder()
                    .code(solNode.path("code").asText(""))
                    .approach(solNode.path("approach").asText(solutionApproach))
                    .explanation(solNode.path("explanation").asText(""))
                    .syntaxNotes(solNode.path("syntaxNotes").asText(""))
                    .whyItWorks(solNode.path("whyItWorks").asText(""))
                    .exampleWalkthrough(solNode.path("exampleWalkthrough").asText(""))
                    .timeComplexity(timeComp)
                    .spaceComplexity(spaceComp)
                    .edgeCases(edgeCases)
                    .build();
        }

        String examplesJson = null;
        String constraintsJson = null;
        String hintsJson = null;
        String solutionJson = null;
        try {
            examplesJson = objectMapper.writeValueAsString(examples);
            constraintsJson = objectMapper.writeValueAsString(constraints);
            if (!hints.isEmpty()) {
                hintsJson = objectMapper.writeValueAsString(hints);
            }
            if (solutionDto != null) {
                solutionJson = objectMapper.writeValueAsString(solutionDto);
            }
        } catch (Exception e) {
            log.error("Failed to serialize coding problem JSON: {}", e.getMessage());
        }

        InterviewCodingProblem problem = InterviewCodingProblem.builder()
                .session(session)
                .title(title)
                .problemStatement(statement)
                .difficulty(session.getDifficulty())
                .questionType(qType)
                .language(lang)
                .examplesJson(examplesJson)
                .constraintsJson(constraintsJson)
                .starterCode(starterCode)
                .solutionApproach(solutionApproach)
                .hint(!hints.isEmpty() ? hints.get(0) : "")
                .hintsJson(hintsJson)
                .solutionJson(solutionJson)
                .createdAt(Instant.now())
                .build();

        return codingProblemRepository.save(problem);
    }

    @Transactional
    public CodingHintResponseDto getProblemHint(User user, InterviewCodingProblem problem, int hintIndex) {
        List<String> hintsList = parseHints(problem.getHintsJson());

        // If no hints saved yet (legacy), generate 3 progressive hints on the fly
        if (hintsList.isEmpty()) {
            aiService.checkRateLimit(user.getId());
            String systemPrompt = """
                You are a patient software engineering mentor at JVM CREW.
                
                CRITICAL CORE DIRECTIVE:
                DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
                DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
                
                Generate 3 progressive conceptual hints for this coding problem leading to the simplest standard solution:
                - Hint 1: Conceptual direction to guide beginner intuition without revealing code.
                - Hint 2: Basic structure or operator choice (e.g., use an if-else check or a basic loop).
                - Hint 3: Return values and simple edge cases to keep in mind.
                Do NOT suggest bitwise hacks, complex streams, or obscure tricks unless explicitly required by the problem.
                Do NOT provide complete code in any hint.
                
                Strict JSON Schema:
                {
                  "hints": [
                    "Hint 1: ...",
                    "Hint 2: ...",
                    "Hint 3: ..."
                  ]
                }
                """;

            String userPrompt = String.format("Problem Title: %s\nStatement: %s\nDifficulty: %s",
                    problem.getTitle(), problem.getProblemStatement(), problem.getDifficulty());

            JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);
            JsonNode hNode = root.path("hints");
            if (hNode.isArray()) {
                for (JsonNode h : hNode) {
                    hintsList.add(h.asText());
                }
            }
            if (hintsList.isEmpty() && problem.getHint() != null && !problem.getHint().isBlank()) {
                hintsList.add(problem.getHint());
            }
            try {
                problem.setHintsJson(objectMapper.writeValueAsString(hintsList));
                codingProblemRepository.save(problem);
            } catch (Exception e) {
                log.error("Failed to save hintsJson: {}", e.getMessage());
            }
        }

        int targetIdx = Math.max(1, hintIndex);
        int total = Math.max(1, hintsList.size());
        int zeroBasedIdx = Math.min(targetIdx - 1, hintsList.size() - 1);
        String selectedHint = hintsList.isEmpty() ? "Think carefully about the problem constraints and base cases." : hintsList.get(zeroBasedIdx);
        boolean hasMore = zeroBasedIdx < hintsList.size() - 1;

        return CodingHintResponseDto.builder()
                .hint(selectedHint)
                .hintIndex(zeroBasedIdx + 1)
                .totalHints(total)
                .hasMoreHints(hasMore)
                .build();
    }

    @Transactional
    public CodingSolutionDto revealSolution(User user, InterviewCodingProblem problem) {
        if (problem.getSolutionJson() != null && !problem.getSolutionJson().isBlank()) {
            try {
                return objectMapper.readValue(problem.getSolutionJson(), CodingSolutionDto.class);
            } catch (Exception e) {
                log.warn("Failed to parse cached solution JSON: {}", e.getMessage());
            }
        }

        // Generate complete structured solution on demand
        aiService.checkRateLimit(user.getId());
        String systemPrompt = """
            You are a Principal Software Engineer and patient teacher at JVM CREW.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            STRUCTURE RULES:
            1. If questionType is "PROGRAM" (or Java program requested):
               - The solution code MUST be a complete runnable program using `public class Main` and `public static void main(String[] args)`.
               - Use Scanner for console input if needed, and standard loops/if-else.
            2. If questionType is "METHOD":
               - The solution code should be a clear method inside a class.
            
            Provide the complete, clean, readable reference solution for this coding challenge.
            - The solution code MUST use the simplest, most readable standard beginner approach (e.g., for even/odd in Java, use standard modulo `number % 2 == 0` with simple `if/else`, NOT bitwise `& 1`, NOT streams; for factorial, use simple `for` loop).
            - Explanations must be structured clearly: Concept -> Simple Explanation -> Line-by-Line Code -> How it works.
            
            Strict JSON Schema required:
            {
              "code": "// Complete, runnable, clean standard beginner solution\\npublic class Main { ... }",
              "approach": "Simplest Standard Approach (e.g., Modulo Remainder Division)",
              "explanation": "Clear step-by-step walkthrough of how the code executes line by line.",
              "syntaxNotes": "Explanation of fundamental language constructs, keywords, and operators used.",
              "whyItWorks": "Clear logical explanation of why this solution is correct.",
              "exampleWalkthrough": "Trace of variable states on a simple test input.",
              "timeComplexity": "O(1) or O(N)",
              "spaceComplexity": "O(1)",
              "edgeCases": [
                "Basic standard case",
                "Zero and negative numbers",
                "Boundary limits"
              ]
            }
            """;

        String userPrompt = String.format("""
            Problem: %s
            Statement: %s
            Question Type: %s
            Difficulty: %s
            Technology: %s
            Starter Code:
            %s
            """,
                problem.getTitle(),
                problem.getProblemStatement(),
                problem.getQuestionType() != null ? problem.getQuestionType() : "PROGRAM",
                problem.getDifficulty(),
                problem.getSession() != null ? problem.getSession().getTechnology() : "Java",
                problem.getStarterCode()
        );

        JsonNode solNode = aiService.generateStructuredJson(systemPrompt, userPrompt);

        List<String> edgeCases = new ArrayList<>();
        JsonNode ecNode = solNode.path("edgeCases");
        if (ecNode.isArray()) {
            for (JsonNode ec : ecNode) edgeCases.add(ec.asText());
        }

        CodingSolutionDto solutionDto = CodingSolutionDto.builder()
                .code(solNode.path("code").asText(""))
                .approach(solNode.path("approach").asText(problem.getSolutionApproach()))
                .explanation(solNode.path("explanation").asText(""))
                .syntaxNotes(solNode.path("syntaxNotes").asText(""))
                .whyItWorks(solNode.path("whyItWorks").asText(""))
                .exampleWalkthrough(solNode.path("exampleWalkthrough").asText(""))
                .timeComplexity(solNode.path("timeComplexity").asText("O(1)"))
                .spaceComplexity(solNode.path("spaceComplexity").asText("O(1)"))
                .edgeCases(edgeCases)
                .build();

        try {
            problem.setSolutionJson(objectMapper.writeValueAsString(solutionDto));
            codingProblemRepository.save(problem);
        } catch (Exception e) {
            log.error("Failed to cache solutionJson: {}", e.getMessage());
        }

        return solutionDto;
    }

    @Transactional
    public CodeReviewDto reviewCodeSubmission(User user, InterviewCodingProblem problem, String submittedCode, String language) {
        aiService.checkRateLimit(user.getId());

        String systemPrompt = """
            You are a Principal Software Engineer and Master Technical Interviewer at JVM CREW conducting a constructive, beginner-friendly code review.
            
            CRITICAL CORE DIRECTIVE:
            DEFAULT TO BEGINNER. ALWAYS TEACH THE SIMPLEST CORRECT APPROACH FIRST. NEVER OVERCOMPLICATE AN ANSWER.
            DO NOT INTRODUCE ADVANCED TECHNIQUES, OPTIMIZATIONS, CLEVER SYNTAX, OR LOW-LEVEL CONCEPTS UNLESS THE USER REQUESTS THEM, THE SELECTED DIFFICULTY REQUIRES THEM, OR THE PROBLEM CANNOT BE CORRECTLY SOLVED WITHOUT THEM.
            
            EVALUATION & GRADING PRINCIPLES:
            1. RECOGNIZE STANDARD BEGINNER SOLUTIONS:
               - If questionType is PROGRAM: Standard beginner runnable programs using `public class Main { public static void main(String[] args) { ... } }` and basic logic (like `n % 2 == 0` or simple for loops) are FULLY ACCEPTABLE and should be marked ACCEPTED with high score (90-100).
               - If questionType is METHOD: Standard method solutions (e.g. `return number % 2 == 0;` or `if (n % 2 == 0) return true; else return false;`) are FULLY ACCEPTABLE with high score.
               - DO NOT penalize or mark down for not using bitwise operations (`n & 1`), streams, lambdas, ternaries, or clever one-liners.
               - Praise clarity, simplicity, and readability.
            2. SYNTAX & COMPILATION:
               - Check for actual syntax errors, typos (e.g. 'Static' vs 'static'), missing semicolons/braces, type mismatches.
            3. LOGIC & EDGE CASES:
               - Evaluate if logic handles the problem requirements correctly, including basic edge cases (0, negative numbers, empty arrays if applicable).
            4. CONSTRUCTIVE BEGINNER FEEDBACK:
               - In `suggestedImprovements` and `optimizedSolution`, offer gentle, readable refinements, NOT confusing bitwise tricks or premature micro-optimizations.
            
            Status Classification (strictly one of):
            - ACCEPTED (Correct, clean, readable, meets requirements)
            - PARTIALLY_CORRECT (Works on basic cases but misses edge cases)
            - SYNTAX_OR_COMPILATION_ERROR (Code has syntax bugs, capitalization errors, or compilation issues)
            - MISUNDERSTOOD_REQUIREMENTS (Code solves wrong problem, wrong return type, or missing required method)
            - INCORRECT_LOGIC (Algorithmic flaws, infinite loops, incorrect arithmetic)
            - INEFFICIENT_SOLUTION (Only if solution has severe algorithmic inefficiency like O(N^2) where O(N) was required)
            
            Strict JSON Schema required:
            {
              "score": 95, // Integer 0 to 100 reflecting correctness and code quality
              "status": "ACCEPTED", // One of: ACCEPTED, PARTIALLY_CORRECT, SYNTAX_OR_COMPILATION_ERROR, MISUNDERSTOOD_REQUIREMENTS, INCORRECT_LOGIC, INEFFICIENT_SOLUTION
              "summary": "Clear, encouraging summary of what the candidate did right, and any gentle notes for improvement.",
              "correctnessAnalysis": "Clear line-by-line breakdown of the submission's logic and strengths.",
              "timeComplexity": "O(1) or O(N)",
              "spaceComplexity": "O(1)",
              "edgeCases": [
                "Passed: Standard positive numbers",
                "Passed: Zero and negative numbers",
                "Passed: Boundary limit"
              ],
              "suggestedImprovements": [
                "Readable simplification or best practice note"
              ],
              "optimizedSolution": "Clean, beginner-friendly standard reference snippet."
            }
            """;

        String userPrompt = String.format("""
            Problem: "%s"
            Problem Statement:
            "%s"
            Question Type: %s
            Constraints:
            %s
            Language: %s
            Submitted Code:
            ```
            %s
            ```
            """,
                problem.getTitle(),
                problem.getProblemStatement(),
                problem.getQuestionType() != null ? problem.getQuestionType() : "PROGRAM",
                problem.getConstraintsJson(),
                language != null ? language : "JAVA",
                submittedCode
        );

        JsonNode root = aiService.generateStructuredJson(systemPrompt, userPrompt);

        int score = root.path("score").asInt(70);
        String status = root.path("status").asText("EVALUATED");
        String summary = root.path("summary").asText("");
        String correctnessAnalysis = root.path("correctnessAnalysis").asText("");
        String timeComplexity = root.path("timeComplexity").asText("O(N)");
        String spaceComplexity = root.path("spaceComplexity").asText("O(1)");
        String optimizedSolution = root.path("optimizedSolution").asText("");

        List<String> edgeCases = new ArrayList<>();
        JsonNode edgeNode = root.path("edgeCases");
        if (edgeNode.isArray()) {
            for (JsonNode e : edgeNode) edgeCases.add(e.asText());
        }

        List<String> suggestedImprovements = new ArrayList<>();
        JsonNode impNode = root.path("suggestedImprovements");
        if (impNode.isArray()) {
            for (JsonNode i : impNode) suggestedImprovements.add(i.asText());
        }

        CodeReviewDto reviewDto = CodeReviewDto.builder()
                .problemId(problem.getId())
                .score(score)
                .status(status)
                .summary(summary)
                .correctnessAnalysis(correctnessAnalysis)
                .timeComplexity(timeComplexity)
                .spaceComplexity(spaceComplexity)
                .edgeCases(edgeCases)
                .suggestedImprovements(suggestedImprovements)
                .optimizedSolution(optimizedSolution)
                .createdAt(Instant.now())
                .build();

        String feedbackJson = null;
        try {
            feedbackJson = objectMapper.writeValueAsString(reviewDto);
        } catch (Exception e) {
            log.error("Failed to serialize code review JSON: {}", e.getMessage());
        }

        InterviewCodingAttempt attempt = InterviewCodingAttempt.builder()
                .problem(problem)
                .session(problem.getSession())
                .user(user)
                .submittedCode(submittedCode)
                .language(language != null ? language : "JAVA")
                .status(status)
                .score(score)
                .reviewFeedbackJson(feedbackJson)
                .createdAt(Instant.now())
                .build();

        attempt = codingAttemptRepository.save(attempt);
        reviewDto.setAttemptId(attempt.getId());

        return reviewDto;
    }

    private List<String> parseHints(String hintsJson) {
        if (hintsJson == null || hintsJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(hintsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
