package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewMockSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewMockSessionRepository extends JpaRepository<InterviewMockSession, Long> {
    List<InterviewMockSession> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);
    List<InterviewMockSession> findByUserIdOrderByStartedAtDesc(Long userId);
    Optional<InterviewMockSession> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
