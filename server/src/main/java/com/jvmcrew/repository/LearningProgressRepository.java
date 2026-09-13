package com.jvmcrew.repository;

import com.jvmcrew.model.LearningProgress;
import com.jvmcrew.model.LearningTopic;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.LearningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {
    List<LearningProgress> findByUser(User user);
    List<LearningProgress> findByUserId(Long userId);
    Optional<LearningProgress> findByUserAndTopic(User user, LearningTopic topic);
    Optional<LearningProgress> findByUserIdAndTopicId(Long userId, Long topicId);
    long countByUserAndStatus(User user, LearningStatus status);
    long countByUserIdAndStatus(Long userId, LearningStatus status);
    Optional<LearningProgress> findTopByUserAndStatusOrderByCompletedAtDesc(User user, LearningStatus status);

    @Query("SELECT lp FROM LearningProgress lp WHERE lp.user = :user AND lp.status = 'IN_PROGRESS' ORDER BY lp.topic.orderIndex ASC")
    List<LearningProgress> findInProgressTopics(@Param("user") User user);

    void deleteByTopic(LearningTopic topic);
}
