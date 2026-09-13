package com.jvmcrew.repository;

import com.jvmcrew.model.Homework;
import com.jvmcrew.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    List<Homework> findByTeamOrderByCreatedAtDesc(Team team);
    List<Homework> findByTeamAndIsPublishedTrueOrderByCreatedAtDesc(Team team);
}
