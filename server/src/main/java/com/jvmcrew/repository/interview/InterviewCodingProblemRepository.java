package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewCodingProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewCodingProblemRepository extends JpaRepository<InterviewCodingProblem, Long> {
    List<InterviewCodingProblem> findBySessionId(Long sessionId);
}
