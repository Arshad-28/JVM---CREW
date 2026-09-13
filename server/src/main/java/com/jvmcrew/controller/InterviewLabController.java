package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.interview.*;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import com.jvmcrew.model.interview.InterviewCodingProblem;
import com.jvmcrew.model.interview.InterviewLearningSession;
import com.jvmcrew.model.interview.InterviewPracticeQuestion;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.repository.interview.InterviewCodingProblemRepository;
import com.jvmcrew.repository.interview.InterviewLearningSessionRepository;
import com.jvmcrew.repository.interview.InterviewPracticeQuestionRepository;
import com.jvmcrew.service.interview.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interview-lab")
@RequiredArgsConstructor
public class InterviewLabController {

    private final InterviewLabService interviewLabService;
    private final PracticeService practiceService;
    private final EvaluationService evaluationService;
    private final InterviewService interviewService;
    private final CodingPracticeService codingPracticeService;
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final InterviewLearningSessionRepository sessionRepository;
    private final InterviewPracticeQuestionRepository practiceQuestionRepository;
    private final InterviewCodingProblemRepository codingProblemRepository;

    private User getAuthenticatedUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Team getActiveTeam(User user) {
        return teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .map(com.jvmcrew.model.TeamMember::getTeam)
                .orElse(null);
    }

    @PostMapping("/sessions")
    public ResponseEntity<SessionDetailDto> createSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateSessionRequest request) {
        User user = getAuthenticatedUser(principal);
        Team team = getActiveTeam(user);
        return ResponseEntity.ok(interviewLabService.createSession(user, team, request));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionSummaryDto>> getUserSessions(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewLabService.getUserSessions(user, limit));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<SessionDetailDto> getSessionDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewLabService.getSessionDetail(user, id));
    }

    @PostMapping("/sessions/{id}/practice/generate")
    public ResponseEntity<List<PracticeQuestionDto>> generatePractice(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        InterviewLearningSession session = sessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found or unauthorized"));
        practiceService.generatePracticeQuestions(session);
        return ResponseEntity.ok(interviewLabService.getSessionDetail(user, id).getPracticeQuestions());
    }

    @PostMapping("/questions/{id}/hint")
    public ResponseEntity<Map<String, String>> getPracticeHint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        InterviewPracticeQuestion question = practiceQuestionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));
        
        if (!question.getSession().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        String hint = practiceService.getQuestionHint(question);
        return ResponseEntity.ok(Map.of("hint", hint));
    }

    @PostMapping("/questions/{id}/answer")
    public ResponseEntity<PracticeEvaluationDto> submitPracticeAnswer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SubmitPracticeAnswerRequest request) {
        User user = getAuthenticatedUser(principal);
        InterviewPracticeQuestion question = practiceQuestionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));

        if (!question.getSession().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(evaluationService.evaluatePracticeAnswer(user, question.getSession(), question, request.getAnswer()));
    }

    @PostMapping("/sessions/{id}/coding/generate")
    public ResponseEntity<CodingProblemDto> generateCodingProblem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        InterviewLearningSession session = sessionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Session not found or unauthorized"));
        InterviewCodingProblem problem = codingPracticeService.generateCodingProblem(session);
        return ResponseEntity.ok(interviewLabService.getSessionDetail(user, id).getCodingProblems().stream()
                .filter(p -> p.getId().equals(problem.getId()))
                .findFirst().orElse(null));
    }

    @PostMapping("/coding/{id}/hint")
    public ResponseEntity<CodingHintResponseDto> getCodingHint(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int hintIndex) {
        User user = getAuthenticatedUser(principal);
        InterviewCodingProblem problem = codingProblemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        if (!problem.getSession().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(codingPracticeService.getProblemHint(user, problem, hintIndex));
    }

    @PostMapping("/coding/{id}/solution")
    public ResponseEntity<CodingSolutionDto> getCodingSolution(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        InterviewCodingProblem problem = codingProblemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        if (!problem.getSession().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(codingPracticeService.revealSolution(user, problem));
    }

    @PostMapping("/coding/{id}/review")
    public ResponseEntity<CodeReviewDto> reviewCode(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SubmitCodeReviewRequest request) {
        User user = getAuthenticatedUser(principal);
        InterviewCodingProblem problem = codingProblemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        if (!problem.getSession().getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(codingPracticeService.reviewCodeSubmission(user, problem, request.getCode(), request.getLanguage()));
    }

    @PostMapping("/sessions/{id}/coach")
    public ResponseEntity<CoachChatMessageDto> askCoach(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CoachChatRequest request) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewLabService.askCoach(user, id, request.getMessage()));
    }

    @PostMapping("/mock/start")
    public ResponseEntity<MockInterviewStateDto> startMockInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StartMockInterviewRequest request) {
        User user = getAuthenticatedUser(principal);
        Team team = getActiveTeam(user);
        return ResponseEntity.ok(interviewService.startMockInterview(user, team, request));
    }

    @GetMapping("/mock/{id}")
    public ResponseEntity<MockInterviewStateDto> getMockInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewService.getMockInterviewState(user, id));
    }

    @PostMapping("/mock/{id}/answer")
    public ResponseEntity<MockInterviewStateDto> submitMockAnswer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SubmitMockAnswerRequest request) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewService.submitMockAnswer(user, id, request.getAnswer()));
    }

    @PostMapping("/mock/{id}/finish")
    public ResponseEntity<MockInterviewStateDto> finishMockInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = getAuthenticatedUser(principal);
        var mockSession = interviewService.getMockInterviewState(user, id);
        return ResponseEntity.ok(mockSession);
    }

    @GetMapping("/history")
    public ResponseEntity<List<HistoryItemDto>> getCombinedHistory(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(interviewLabService.getCombinedHistory(user));
    }

    @GetMapping("/insights")
    public ResponseEntity<LearningInsightsDto> getPersonalInsights(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = getAuthenticatedUser(principal);
        return ResponseEntity.ok(recommendationService.getPersonalInsights(user));
    }
}
