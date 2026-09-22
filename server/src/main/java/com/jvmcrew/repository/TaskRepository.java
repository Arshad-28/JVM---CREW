package com.jvmcrew.repository;

import com.jvmcrew.model.Task;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByTeamOrderByCreatedAtDesc(Team team);
    List<Task> findByTeamIdOrderByCreatedAtDesc(Long teamId);
    List<Task> findByTeamIdAndAssigneeIdOrderByCreatedAtDesc(Long teamId, Long assigneeId);
    List<Task> findByTeamAndAssigneeOrderByCreatedAtDesc(Team team, User assignee);
    List<Task> findByAssigneeOrderByCreatedAtDesc(User assignee);
    List<Task> findByAssigneeInOrderByCreatedAtDesc(java.util.Collection<User> assignees);
    List<Task> findByAssigneeIdOrderByCreatedAtDesc(Long assigneeId);
    List<Task> findByAssigneeAndStatus(User assignee, TaskStatus status);
    List<Task> findByAssigneeAndDeadline(User assignee, LocalDate deadline);
    List<Task> findByAssigneeIdAndDeadline(Long assigneeId, LocalDate deadline);
    long countByTeamAndStatus(Team team, TaskStatus status);
    long countByAssigneeAndStatus(User assignee, TaskStatus status);
    long countByAssigneeAndStatusNot(User assignee, TaskStatus status);
    long countByTeam(Team team);

    @Query("SELECT t FROM Task t WHERE t.assignee = :user AND (t.deadline <= :date OR t.deadline IS NULL) AND t.status != 'DONE' ORDER BY t.deadline ASC NULLS LAST")
    List<Task> findTodayChecklistTasks(@Param("user") User user, @Param("date") LocalDate date);
}
