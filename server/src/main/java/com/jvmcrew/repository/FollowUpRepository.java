package com.jvmcrew.repository;

import com.jvmcrew.model.FollowUp;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {
    List<FollowUp> findByTeamAndStatusOrderByCreatedAtDesc(Team team, String status);
    List<FollowUp> findByTeamOrderByCreatedAtDesc(Team team);
    List<FollowUp> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
    long countByTeamAndStatus(Team team, String status);
}
