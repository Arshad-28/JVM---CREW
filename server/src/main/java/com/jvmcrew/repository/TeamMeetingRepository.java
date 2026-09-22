package com.jvmcrew.repository;

import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMeeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMeetingRepository extends JpaRepository<TeamMeeting, Long> {

    List<TeamMeeting> findByTeamOrderByScheduledDateDescStartTimeDesc(Team team);

    List<TeamMeeting> findByTeamAndIsActiveTrueOrderByScheduledDateAscStartTimeAsc(Team team);

    Optional<TeamMeeting> findByIdAndTeam(Long id, Team team);

    @Query("SELECT tm FROM TeamMeeting tm WHERE tm.team = :team AND tm.isActive = true AND tm.scheduledDate >= :today ORDER BY tm.scheduledDate ASC, tm.startTime ASC")
    List<TeamMeeting> findUpcomingMeetingsForTeam(@Param("team") Team team, @Param("today") LocalDate today);

    @Query("SELECT tm FROM TeamMeeting tm WHERE tm.team = :team AND tm.isActive = true AND tm.scheduledDate = :today ORDER BY tm.startTime ASC")
    List<TeamMeeting> findTodaysMeetingsForTeam(@Param("team") Team team, @Param("today") LocalDate today);
}
