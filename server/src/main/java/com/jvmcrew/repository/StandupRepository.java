package com.jvmcrew.repository;

import com.jvmcrew.model.Standup;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StandupRepository extends JpaRepository<Standup, Long> {
    Optional<Standup> findByUserAndDate(User user, LocalDate date);
    Optional<Standup> findByUserIdAndDate(Long userId, LocalDate date);
    Optional<Standup> findByTeamAndUserAndDate(Team team, User user, LocalDate date);
    Optional<Standup> findByTeamAndUserAndDateAndIsCompletedTrue(Team team, User user, LocalDate date);
    List<Standup> findByTeamAndDate(Team team, LocalDate date);
    List<Standup> findByTeamAndDateAndIsCompletedTrue(Team team, LocalDate date);
    List<Standup> findByTeamIdAndDate(Long teamId, LocalDate date);
    List<Standup> findByUserOrderByDateDesc(User user);
    List<Standup> findByTeamOrderByDateDesc(Team team);
    List<Standup> findByTeamAndDateBetween(Team team, LocalDate startDate, LocalDate endDate);
    long countByTeamAndDate(Team team, LocalDate date);
}
