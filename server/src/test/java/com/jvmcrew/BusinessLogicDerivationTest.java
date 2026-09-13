package com.jvmcrew;

import com.jvmcrew.dto.StandupRequest;
import com.jvmcrew.dto.StandupResponse;
import com.jvmcrew.dto.TaskStatusUpdateRequest;
import com.jvmcrew.model.Blocker;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.Task;
import com.jvmcrew.model.TaskHistory;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.BlockerStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.model.enums.TaskPriority;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.BlockerRepository;
import com.jvmcrew.repository.TaskHistoryRepository;
import com.jvmcrew.repository.TaskRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.TeamRepository;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.service.StandupService;
import com.jvmcrew.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
public class BusinessLogicDerivationTest {

    @Autowired
    private StandupService standupService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskHistoryRepository taskHistoryRepository;

    @Autowired
    private BlockerRepository blockerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Team testTeam;
    private User testUser;
    private Task testTask;

    @BeforeEach
    void setUp() {
        testTeam = teamRepository.save(Team.builder()
                .name("DevTest")
                .customName("DevTest")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        testUser = userRepository.save(User.builder()
                .name("Test Developer")
                .email("developer.test@example.com")
                .passwordHash(passwordEncoder.encode("securePass123"))
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(testTeam)
                .user(testUser)
                .role(Role.MEMBER)
                .serialNumber("DEVTEST-002")
                .position("SDE Intern")
                .isActive(true)
                .joinedAt(Instant.now())
                .build());

        testTask = taskRepository.save(Task.builder()
                .team(testTeam)
                .assignee(testUser)
                .title("Implement Database Connection Pool")
                .description("Tune HikariCP connection pool settings")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .progressPct(50)
                .estHours(6.0)
                .actualHours(3.0)
                .deadline(LocalDate.now().plusDays(3))
                .createdAt(Instant.now())
                .build());
    }

    @Test
    void testStandupAutoCreatesBlockerWhenFieldFilled() {
        StandupRequest req = new StandupRequest(
                "Completed SQL Schema normalization draft",
                "Working on B-Tree index benchmarks",
                "Docker network timeout connecting to Postgres",
                "B-Tree pages and fillfactor settings",
                4
        );

        StandupResponse res = standupService.submitStandup(testUser.getId(), req);
        assertNotNull(res);
        assertTrue(res.isBlockerCreated());

        List<Blocker> blockers = blockerRepository.findByStatusOrderByCreatedAtDesc(BlockerStatus.OPEN);
        boolean found = blockers.stream().anyMatch(b -> b.getUser().getId().equals(testUser.getId()));
        assertTrue(found, "Blocker must be automatically created when blockers field is provided in standup");
    }

    @Test
    void testTaskStatusTransitionWritesToAuditHistory() {
        TaskStatus originalStatus = testTask.getStatus();
        TaskStatus nextStatus = originalStatus == TaskStatus.DONE ? TaskStatus.IN_PROGRESS : TaskStatus.DONE;

        TaskStatusUpdateRequest updateReq = new TaskStatusUpdateRequest(nextStatus, 100, 5.0);
        taskService.updateTaskStatus(testTask.getId(), testUser.getId(), testTeam.getId(), updateReq);

        List<TaskHistory> history = taskHistoryRepository.findByTaskIdOrderByChangedAtDesc(testTask.getId());
        assertFalse(history.isEmpty());
        assertEquals("status", history.get(0).getFieldChanged());
        assertEquals(nextStatus.name(), history.get(0).getNewValue());
    }
}
