package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewPracticeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewPracticeQuestionRepository extends JpaRepository<InterviewPracticeQuestion, Long> {
    List<InterviewPracticeQuestion> findBySessionIdOrderBySequenceOrderAsc(Long sessionId);
}
