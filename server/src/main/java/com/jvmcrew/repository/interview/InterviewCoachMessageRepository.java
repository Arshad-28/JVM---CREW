package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewCoachMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewCoachMessageRepository extends JpaRepository<InterviewCoachMessage, Long> {
    List<InterviewCoachMessage> findBySessionIdAndUserIdOrderByCreatedAtAsc(Long sessionId, Long userId);
}
