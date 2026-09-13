package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewCodingAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewCodingAttemptRepository extends JpaRepository<InterviewCodingAttempt, Long> {
    List<InterviewCodingAttempt> findBySessionIdAndUserId(Long sessionId, Long userId);
    List<InterviewCodingAttempt> findByProblemIdAndUserId(Long problemId, Long userId);
}
