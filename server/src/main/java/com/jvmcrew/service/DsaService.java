package com.jvmcrew.service;

import com.jvmcrew.dto.DsaTopicStatsDto;
import com.jvmcrew.dto.ProblemAttemptRequest;
import com.jvmcrew.dto.ProblemDto;
import com.jvmcrew.model.Problem;
import com.jvmcrew.model.ProblemAttempt;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.AttemptStatus;
import com.jvmcrew.repository.ProblemAttemptRepository;
import com.jvmcrew.repository.ProblemRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DsaService {

    private final ProblemRepository problemRepository;
    private final ProblemAttemptRepository attemptRepository;
    private final UserRepository userRepository;

    // Target counts per category for the 6-month curriculum
    private static final Map<String, Integer> TOPIC_TARGETS = new LinkedHashMap<>();
    static {
        TOPIC_TARGETS.put("Arrays & Two Pointers", 30);
        TOPIC_TARGETS.put("Strings & Sliding Window", 25);
        TOPIC_TARGETS.put("Linked Lists", 15);
        TOPIC_TARGETS.put("Stacks & Queues", 20);
        TOPIC_TARGETS.put("Binary Trees & BST", 30);
        TOPIC_TARGETS.put("Graphs & BFS/DFS", 25);
        TOPIC_TARGETS.put("Dynamic Programming", 35);
        TOPIC_TARGETS.put("Heaps & Greedy", 20);
    }

    @Transactional(readOnly = true)
    public List<DsaTopicStatsDto> getDsaStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<Problem> allProblems = problemRepository.findAll();
        List<ProblemAttempt> userAttempts = attemptRepository.findByUser(user);

        Map<Long, ProblemAttempt> attemptMap = userAttempts.stream()
                .collect(Collectors.toMap(a -> a.getProblem().getId(), a -> a));

        Map<String, List<Problem>> byTopic = allProblems.stream()
                .collect(Collectors.groupingBy(Problem::getTopic, LinkedHashMap::new, Collectors.toList()));

        List<DsaTopicStatsDto> result = new ArrayList<>();

        for (Map.Entry<String, Integer> targetEntry : TOPIC_TARGETS.entrySet()) {
            String topic = targetEntry.getKey();
            int target = targetEntry.getValue();

            List<Problem> problems = byTopic.getOrDefault(topic, Collections.emptyList());
            int solved = 0;
            int attempted = 0;

            List<ProblemDto> problemDtos = new ArrayList<>();

            for (Problem p : problems) {
                ProblemAttempt attempt = attemptMap.get(p.getId());
                AttemptStatus status = attempt != null ? attempt.getStatus() : null;
                Integer attempts = attempt != null ? attempt.getAttempts() : 0;
                Integer timeTaken = attempt != null ? attempt.getTimeTakenMin() : null;
                Instant solvedAt = attempt != null ? attempt.getSolvedAt() : null;

                if (status == AttemptStatus.SOLVED) {
                    solved++;
                } else if (status == AttemptStatus.ATTEMPTED) {
                    attempted++;
                }

                problemDtos.add(ProblemDto.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .platform(p.getPlatform())
                        .topic(p.getTopic())
                        .difficulty(p.getDifficulty())
                        .userStatus(status)
                        .attempts(attempts)
                        .timeTakenMin(timeTaken)
                        .solvedAt(solvedAt)
                        .build());
            }

            int completionPct = target > 0 ? Math.min(100, (solved * 100) / target) : 0;

            result.add(DsaTopicStatsDto.builder()
                    .topic(topic)
                    .targetCount(target)
                    .solvedCount(solved)
                    .attemptedCount(attempted)
                    .completionPct(completionPct)
                    .problems(problemDtos)
                    .build());
        }

        return result;
    }

    @Transactional
    public ProblemDto recordAttempt(Long userId, ProblemAttemptRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new IllegalArgumentException("Problem not found: " + request.getProblemId()));

        ProblemAttempt attempt = attemptRepository.findByUserAndProblem(user, problem)
                .orElseGet(() -> ProblemAttempt.builder()
                        .user(user)
                        .problem(problem)
                        .attempts(0)
                        .build());

        attempt.setStatus(request.getStatus());
        attempt.setAttempts(attempt.getAttempts() + 1);
        if (request.getTimeTakenMin() != null) {
            attempt.setTimeTakenMin(request.getTimeTakenMin());
        }

        if (request.getStatus() == AttemptStatus.SOLVED) {
            attempt.setSolvedAt(Instant.now());
        }

        attempt = attemptRepository.save(attempt);

        return ProblemDto.builder()
                .id(problem.getId())
                .name(problem.getName())
                .platform(problem.getPlatform())
                .topic(problem.getTopic())
                .difficulty(problem.getDifficulty())
                .userStatus(attempt.getStatus())
                .attempts(attempt.getAttempts())
                .timeTakenMin(attempt.getTimeTakenMin())
                .solvedAt(attempt.getSolvedAt())
                .build();
    }
}
