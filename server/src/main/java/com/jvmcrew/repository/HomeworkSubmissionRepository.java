package com.jvmcrew.repository;

import com.jvmcrew.model.Homework;
import com.jvmcrew.model.HomeworkSubmission;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {
    List<HomeworkSubmission> findByHomework(Homework homework);
    Optional<HomeworkSubmission> findByHomeworkAndUser(Homework homework, User user);
    List<HomeworkSubmission> findByUserOrderBySubmittedAtDesc(User user);
    long countByHomework(Homework homework);
    long countByHomeworkAndStatus(Homework homework, String status);
}
