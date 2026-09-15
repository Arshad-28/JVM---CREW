package com.jvmcrew.repository;

import com.jvmcrew.model.Homework;
import com.jvmcrew.model.HomeworkReminder;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeworkReminderRepository extends JpaRepository<HomeworkReminder, Long> {
    List<HomeworkReminder> findByUserAndIsReadFalse(User user);
    List<HomeworkReminder> findByHomeworkAndUser(Homework homework, User user);
    List<HomeworkReminder> findByHomework(Homework homework);
    void deleteByHomework(Homework homework);
}
