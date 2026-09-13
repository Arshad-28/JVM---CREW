package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewMockQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewMockQuestionRepository extends JpaRepository<InterviewMockQuestion, Long> {
    List<InterviewMockQuestion> findByMockSessionIdOrderBySequenceNumberAsc(Long mockSessionId);
    Optional<InterviewMockQuestion> findByMockSessionIdAndSequenceNumber(Long mockSessionId, Integer sequenceNumber);
}
