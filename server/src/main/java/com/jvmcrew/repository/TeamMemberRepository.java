package com.jvmcrew.repository;

import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeam(Team team);
    List<TeamMember> findByTeamId(Long teamId);
    List<TeamMember> findByTeamAndIsActiveTrueOrderByJoinedAtAsc(Team team);
    List<TeamMember> findByTeamIdAndIsActiveTrue(Long teamId);
    Optional<TeamMember> findByTeamAndUser(Team team, User user);
    Optional<TeamMember> findByTeamAndUserAndIsActiveTrue(Team team, User user);
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    Optional<TeamMember> findFirstByUser(User user);
    Optional<TeamMember> findFirstByUserAndIsActiveTrue(User user);
    Optional<TeamMember> findFirstByTeamAndRoleAndIsActiveTrue(Team team, com.jvmcrew.model.enums.Role role);
    @org.springframework.data.jpa.repository.Query("SELECT tm FROM TeamMember tm JOIN FETCH tm.team WHERE tm.user = :user AND tm.isActive = true")
    Optional<TeamMember> findActiveWithTeamByUser(@org.springframework.data.repository.query.Param("user") User user);

    boolean existsByTeamAndUser(Team team, User user);
    boolean existsByTeamAndUserAndIsActiveTrue(Team team, User user);
    long countByTeamAndIsActiveTrue(Team team);
}
