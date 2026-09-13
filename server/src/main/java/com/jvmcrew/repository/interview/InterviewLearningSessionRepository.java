package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewLearningSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewLearningSessionRepository extends JpaRepository<InterviewLearningSession, Long> {
    List<InterviewLearningSession> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<InterviewLearningSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<InterviewLearningSession> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
