package com.jvmcrew.repository.interview;

import com.jvmcrew.model.interview.InterviewUserWeakness;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewUserWeaknessRepository extends JpaRepository<InterviewUserWeakness, Long> {
    List<InterviewUserWeakness> findByUserIdOrderByAverageScoreAsc(Long userId);
    Optional<InterviewUserWeakness> findByUserIdAndTopicAndWeakConcept(Long userId, String topic, String weakConcept);
}
