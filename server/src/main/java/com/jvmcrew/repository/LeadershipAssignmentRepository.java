package com.jvmcrew.repository;

import com.jvmcrew.model.LeadershipAssignment;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadershipAssignmentRepository extends JpaRepository<LeadershipAssignment, Long> {

    List<LeadershipAssignment> findByTeamOrderByStartDateDesc(Team team);

    List<LeadershipAssignment> findByUserOrderByStartDateDesc(User user);

    @Query("SELECT la FROM LeadershipAssignment la " +
           "JOIN FETCH la.user u " +
           "WHERE la.team = :team " +
           "AND la.startDate <= :date AND la.endDate >= :date " +
           "AND la.status = 'ACTIVE' " +
           "ORDER BY la.id DESC")
    List<LeadershipAssignment> findActiveAssignmentsForTeamAndDate(@Param("team") Team team, @Param("date") LocalDate date);

    @Query("SELECT la FROM LeadershipAssignment la " +
           "WHERE la.user = :user " +
           "AND la.startDate <= :date AND la.endDate >= :date " +
           "AND la.status = 'ACTIVE'")
    Optional<LeadershipAssignment> findActiveAssignmentForUserAndDate(@Param("user") User user, @Param("date") LocalDate date);
}
