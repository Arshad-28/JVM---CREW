package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewPracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewPracticeAttemptRepository extends JpaRepository<InterviewPracticeAttempt, Long> {
    List<InterviewPracticeAttempt> findBySessionIdAndUserId(Long sessionId, Long userId);
    Optional<InterviewPracticeAttempt> findTopByQuestionIdAndUserIdOrderByCreatedAtDesc(Long questionId, Long userId);
}
