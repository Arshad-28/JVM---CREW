package com.jvmcrew;

import com.jvmcrew.dto.HomeworkRequest;
import com.jvmcrew.dto.HomeworkSubmissionRequest;
import com.jvmcrew.dto.TaskRequest;
import com.jvmcrew.dto.TaskResponse;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskPriority;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.*;
import com.jvmcrew.service.HomeworkService;
import com.jvmcrew.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class TaskAndHomeworkDeletionTest {

    @Autowired
    private TaskService taskService;

    @Autowired
    private HomeworkService homeworkService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskCommentRepository taskCommentRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private HomeworkSubmissionRepository homeworkSubmissionRepository;

    @Autowired
    private HomeworkReminderRepository homeworkReminderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private LeadershipAssignmentRepository leadershipAssignmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Team teamA;
    private Team teamB;
    private User leadA;
    private User memberA;
    private User leadB;

    @BeforeEach
    void setUp() {
        teamA = teamRepository.save(Team.builder()
                .name("Crew Alpha")
                .customName("Alpha")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        teamB = teamRepository.save(Team.builder()
                .name("Crew Beta")
                .customName("Beta")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        leadA = userRepository.save(User.builder()
                .name("Lead Alice")
                .email("alice@alpha.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .build());

        memberA = userRepository.save(User.builder()
                .name("Member Bob")
                .email("bob@alpha.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .build());

        leadB = userRepository.save(User.builder()
                .name("Lead Charlie")
                .email("charlie@beta.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamA)
                .user(leadA)
                .role(Role.LEAD)
                .isActive(true)
                .joinedAt(Instant.now())
                .build());

        leadershipAssignmentRepository.save(LeadershipAssignment.builder()
                .team(teamA)
                .user(leadA)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusDays(25))
                .status("ACTIVE")
                .assignedBy(leadA)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamA)
                .user(memberA)
                .role(Role.MEMBER)
                .isActive(true)
                .joinedAt(Instant.now())
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamB)
                .user(leadB)
                .role(Role.LEAD)
                .isActive(true)
                .joinedAt(Instant.now())
                .build());

        leadershipAssignmentRepository.save(LeadershipAssignment.builder()
                .team(teamB)
                .user(leadB)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusDays(25))
                .status("ACTIVE")
                .assignedBy(leadB)
                .build());
    }

    @Test
    void testLeadCanDeleteTaskSuccessfully() {
        TaskRequest req = TaskRequest.builder()
                .title("Implement Dynamic Programming Solution")
                .description("Write 0/1 knapsack in Java")
                .assigneeId(memberA.getId())
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .deadline(LocalDate.of(2026, 9, 30))
                .build();

        TaskResponse created = taskService.createTask(leadA.getId(), teamA.getId(), req);
        Long taskId = created.getId();

        // Add a comment
        taskService.addComment(taskId, memberA.getId(), teamA.getId(), "Started working on DP array.");

        assertEquals(1, taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).size());
        assertFalse(taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId).isEmpty());

        // Alice (Lead of Team A) deletes the task
        taskService.deleteTask(taskId, leadA.getId(), teamA.getId());

        // Verify task and dependent records are deleted
        assertTrue(taskRepository.findById(taskId).isEmpty());
        assertTrue(taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).isEmpty());
        assertTrue(taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(taskId).isEmpty());
    }

    @Test
    void testMemberCannotDeleteTask() {
        TaskRequest req = TaskRequest.builder()
                .title("Fix Concurrent Modification Issue")
                .priority(TaskPriority.MED)
                .status(TaskStatus.TODO)
                .build();

        TaskResponse created = taskService.createTask(leadA.getId(), teamA.getId(), req);
        Long taskId = created.getId();

        // Bob (Member of Team A) attempts to delete -> AccessDeniedException (403)
        assertThrows(AccessDeniedException.class, () ->
                taskService.deleteTask(taskId, memberA.getId(), teamA.getId())
        );

        // Task must still exist
        assertTrue(taskRepository.findById(taskId).isPresent());
    }

    @Test
    void testCrossTeamLeadCannotDeleteTask() {
        TaskRequest req = TaskRequest.builder()
                .title("Team A Exclusive Mission")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .build();

        TaskResponse created = taskService.createTask(leadA.getId(), teamA.getId(), req);
        Long taskId = created.getId();

        // Charlie (Lead of Team B) attempts to delete Team A's task -> AccessDeniedException (403)
        assertThrows(AccessDeniedException.class, () ->
                taskService.deleteTask(taskId, leadB.getId(), teamB.getId())
        );

        // Task must still exist
        assertTrue(taskRepository.findById(taskId).isPresent());
    }

    @Test
    void testLeadCanDeleteHomeworkSuccessfully() {
        HomeworkRequest hwReq = HomeworkRequest.builder()
                .title("Java Collections Framework Homework")
                .subjectTopic("Java — HashMap Internals")
                .questions(List.of("Explain load factor", "Implement bucket resizing"))
                .dueDate(LocalDate.now().plusDays(3))
                .publishNow(true)
                .build();

        var hwResponse = homeworkService.createHomework(leadA.getId(), hwReq);
        Long hwId = hwResponse.getId();

        // Member A submits homework
        HomeworkSubmissionRequest subReq = HomeworkSubmissionRequest.builder()
                .answerText("Load factor determines when to rehash bucket array.")
                .build();
        homeworkService.submitHomework(hwId, memberA.getId(), subReq);

        // Lead A sends reminder
        homeworkService.remindMember(hwId, leadA.getId(), memberA.getId());

        Homework hw = homeworkRepository.findById(hwId).orElseThrow();
        assertEquals(1, homeworkSubmissionRepository.findByHomework(hw).size());
        assertEquals(1, homeworkReminderRepository.findByHomework(hw).size());

        // Alice (Lead of Team A) deletes the homework
        homeworkService.deleteHomework(hwId, leadA.getId());

        // Verify homework and child records are deleted
        assertTrue(homeworkRepository.findById(hwId).isEmpty());
        assertTrue(homeworkSubmissionRepository.findByHomework(hw).isEmpty());
        assertTrue(homeworkReminderRepository.findByHomework(hw).isEmpty());
    }

    @Test
    void testMemberCannotDeleteHomework() {
        HomeworkRequest hwReq = HomeworkRequest.builder()
                .title("Java Threading Homework")
                .subjectTopic("Multithreading")
                .questions(List.of("Explain synchronized keyword"))
                .dueDate(LocalDate.now().plusDays(2))
                .publishNow(true)
                .build();

        var hwResponse = homeworkService.createHomework(leadA.getId(), hwReq);
        Long hwId = hwResponse.getId();

        // Bob (Member of Team A) attempts to delete homework -> AccessDeniedException (403)
        assertThrows(AccessDeniedException.class, () ->
                homeworkService.deleteHomework(hwId, memberA.getId())
        );

        // Homework must still exist
        assertTrue(homeworkRepository.findById(hwId).isPresent());
    }

    @Test
    void testCrossTeamLeadCannotDeleteHomework() {
        HomeworkRequest hwReq = HomeworkRequest.builder()
                .title("Alpha Team Homework")
                .subjectTopic("Alpha Exclusive")
                .questions(List.of("Alpha question 1"))
                .dueDate(LocalDate.now().plusDays(2))
                .publishNow(true)
                .build();

        var hwResponse = homeworkService.createHomework(leadA.getId(), hwReq);
        Long hwId = hwResponse.getId();

        // Charlie (Lead of Team B) attempts to delete Team A's homework -> AccessDeniedException (403)
        assertThrows(AccessDeniedException.class, () ->
                homeworkService.deleteHomework(hwId, leadB.getId())
        );

        // Homework must still exist
        assertTrue(homeworkRepository.findById(hwId).isPresent());
    }
}