package com.jvmcrew.repository;

import com.jvmcrew.model.Task;
import com.jvmcrew.model.TaskHistory;
import com.jvmcrew.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskHistoryRepository extends JpaRepository<TaskHistory, Long> {
    List<TaskHistory> findByTaskOrderByChangedAtDesc(Task task);
    List<TaskHistory> findByTaskIdOrderByChangedAtDesc(Long taskId);
    List<TaskHistory> findTop20ByOrderByChangedAtDesc();
    List<TaskHistory> findTop20ByTaskTeamOrderByChangedAtDesc(Team team);
}
