package com.jvmcrew.repository;

import com.jvmcrew.model.LearningTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningTopicRepository extends JpaRepository<LearningTopic, Long> {
    List<LearningTopic> findAllByOrderByIdAsc();
    List<LearningTopic> findAllByOrderBySubjectAscOrderIndexAsc();
    List<LearningTopic> findBySubjectOrderByOrderIndexAsc(String subject);

    @Query("SELECT DISTINCT t.subject FROM LearningTopic t")
    List<String> findDistinctSubjects();
}
