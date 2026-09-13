package com.jvmcrew.repository;

import com.jvmcrew.model.Blocker;
import com.jvmcrew.model.Standup;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.BlockerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlockerRepository extends JpaRepository<Blocker, Long> {
    List<Blocker> findByStatusOrderByCreatedAtDesc(BlockerStatus status);
    List<Blocker> findByTeamAndStatusOrderByCreatedAtDesc(Team team, BlockerStatus status);
    List<Blocker> findByTeamIdAndStatusOrderByCreatedAtDesc(Long teamId, BlockerStatus status);
    List<Blocker> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Blocker> findByTeamAndUserAndStatusOrderByCreatedAtDesc(Team team, User user, BlockerStatus status);
    List<Blocker> findByUserAndStatusOrderByCreatedAtDesc(User user, BlockerStatus status);
    boolean existsByStandupAndStatus(Standup standup, BlockerStatus status);
    long countByStatus(BlockerStatus status);
    long countByTeamAndStatus(Team team, BlockerStatus status);
}
