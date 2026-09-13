package com.jvmcrew.repository;

import com.jvmcrew.model.LeadMessage;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadMessageRepository extends JpaRepository<LeadMessage, Long> {
    List<LeadMessage> findByUserOrderByCreatedAtDesc(User user);
    List<LeadMessage> findByTeamOrderByCreatedAtDesc(Team team);
    List<LeadMessage> findByTeamAndStatusOrderByCreatedAtDesc(Team team, String status);
    List<LeadMessage> findByTeamAndIsUrgentTrueAndStatusOrderByCreatedAtDesc(Team team, String status);
    List<LeadMessage> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
    long countByTeamAndStatus(Team team, String status);
}
