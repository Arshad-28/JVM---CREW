package com.jvmcrew.repository;

import com.jvmcrew.model.Problem;
import com.jvmcrew.model.ProblemAttempt;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.AttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemAttemptRepository extends JpaRepository<ProblemAttempt, Long> {
    List<ProblemAttempt> findByUser(User user);
    List<ProblemAttempt> findByUserId(Long userId);
    Optional<ProblemAttempt> findByUserAndProblem(User user, Problem problem);
    Optional<ProblemAttempt> findByUserIdAndProblemId(Long userId, Long problemId);
    long countByUserAndStatus(User user, AttemptStatus status);
    long countByUserIdAndStatus(Long userId, AttemptStatus status);

    @Query("SELECT COUNT(pa) FROM ProblemAttempt pa WHERE pa.user = :user AND pa.status = 'SOLVED' AND pa.problem.topic = :topic")
    long countSolvedByUserAndTopic(@Param("user") User user, @Param("topic") String topic);
}
