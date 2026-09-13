package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewMockAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewMockAnswerRepository extends JpaRepository<InterviewMockAnswer, Long> {
    List<InterviewMockAnswer> findByMockSessionIdAndUserId(Long mockSessionId, Long userId);
}
