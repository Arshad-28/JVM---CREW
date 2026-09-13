package com.jvmcrew.repository;

import com.jvmcrew.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByTopicOrderByIdAsc(String topic);

    @Query("SELECT DISTINCT p.topic FROM Problem p ORDER BY p.topic ASC")
    List<String> findDistinctTopics();

    long countByTopic(String topic);
}
