package com.jvmcrew;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.AddTeamMemberRequest;
import com.jvmcrew.dto.AuthRequest;
import com.jvmcrew.dto.AuthResponse;
import com.jvmcrew.dto.ChangeLeadRequest;
import com.jvmcrew.dto.RegisterRequest;
import com.jvmcrew.dto.TeamManagementDto;
import com.jvmcrew.model.LeadershipAssignment;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LeadershipAssignmentRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.TeamRepository;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.service.AuthService;
import com.jvmcrew.service.TeamManagementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class AuthAndAccountFlowTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private TeamManagementService teamManagementService;

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

    @Test
    void testLeadRegistration_CreatesTeam_LeadUser_AndActiveLeadershipInPostgres() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Mohammed Arshad")
                .email("arshad.lead@example.com")
                .password("superSecret123")
                .teamName("Phoenix")
                .build();

        AuthResponse res = authService.register(registerReq);

        assertNotNull(res);
        assertNotNull(res.getToken());
        assertEquals("arshad.lead@example.com", res.getEmail());
        assertEquals(Role.LEAD, res.getRole());
        assertTrue(res.getIsCurrentLead());
        assertEquals("PHOENIX-001", res.getSerialNumber());

        // Verify PostgreSQL persistence
        User savedUser = userRepository.findByEmail("arshad.lead@example.com").orElse(null);
        assertNotNull(savedUser);
        assertEquals("Mohammed Arshad", savedUser.getName());
        assertTrue(passwordEncoder.matches("superSecret123", savedUser.getPasswordHash()));

        Team savedTeam = teamRepository.findById(res.getTeamId()).orElse(null);
        assertNotNull(savedTeam);
        assertEquals("Phoenix", savedTeam.getName());

        TeamMember savedMembership = teamMemberRepository.findByTeamAndUser(savedTeam, savedUser).orElse(null);
        assertNotNull(savedMembership);
        assertEquals(Role.LEAD, savedMembership.getRole());
        assertEquals("PHOENIX-001", savedMembership.getSerialNumber());
        assertTrue(savedMembership.getIsActive());

        List<LeadershipAssignment> activeAssignments = leadershipAssignmentRepository
                .findActiveAssignmentsForTeamAndDate(savedTeam, LocalDate.now());
        assertEquals(1, activeAssignments.size());
        assertEquals(savedUser.getId(), activeAssignments.get(0).getUser().getId());
    }

    @Test
    void testLeadLogin_WithValidCredentials_SucceedsWithDynamicLeadRole() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Lead Candidate")
                .email("candidate.lead@example.com")
                .password("myPassword2026")
                .teamName("Vanguard")
                .build();
        authService.register(registerReq);

        AuthRequest loginReq = new AuthRequest("candidate.lead@example.com", "myPassword2026");
        AuthResponse loginRes = authService.login(loginReq);

        assertNotNull(loginRes);
        assertNotNull(loginRes.getToken());
        assertEquals("candidate.lead@example.com", loginRes.getEmail());
        assertEquals(Role.LEAD, loginRes.getRole());
        assertTrue(loginRes.getIsCurrentLead());
    }

    @Test
    void testLeadAddsTeamMember_CreatesMemberInPostgresAsRoleMember() {
        // 1. Register Lead
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Team Leader")
                .email("team.lead@example.com")
                .password("leadPass123")
                .teamName("Titans")
                .build();
        AuthResponse leadAuth = authService.register(registerReq);
        User leadUser = userRepository.findById(leadAuth.getId()).orElseThrow();
        UserPrincipal leadPrincipal = new UserPrincipal(leadUser, leadAuth.getTeamId(), Role.LEAD);

        // 2. Lead adds a new member
        AddTeamMemberRequest addMemberReq = AddTeamMemberRequest.builder()
                .name("Chidananda SDE")
                .email("chida.intern@example.com")
                .password("chidaPass456")
                .phoneNumber("+91 9876543210")
                .college("Engineering College")
                .organization("Algorithms365")
                .bio("Backend Engineer passionate about Spring Boot")
                .githubUrl("https://github.com/chidananda")
                .linkedinUrl("https://linkedin.com/in/chidananda")
                .build();

        TeamManagementDto teamDto = teamManagementService.addMemberToTeam(leadPrincipal, addMemberReq);
        assertNotNull(teamDto);
        assertEquals(2, teamDto.getMemberCount());

        // Verify member in PostgreSQL
        User memberUser = userRepository.findByEmail("chida.intern@example.com").orElse(null);
        assertNotNull(memberUser);
        assertEquals("Chidananda SDE", memberUser.getName());
        assertTrue(passwordEncoder.matches("chidaPass456", memberUser.getPasswordHash()));
        assertEquals("Engineering College", memberUser.getCollege());

        Team savedTeam = teamRepository.findById(leadAuth.getTeamId()).orElseThrow();
        TeamMember memberTm = teamMemberRepository.findByTeamAndUser(savedTeam, memberUser).orElse(null);
        assertNotNull(memberTm);
        // CRITICAL REQUIREMENT: Member is created as MEMBER, not LEAD
        assertEquals(Role.MEMBER, memberTm.getRole());
        assertEquals("TITANS-002", memberTm.getSerialNumber());
        assertTrue(memberTm.getIsActive());

        // 3. Member logs in
        AuthRequest memberLoginReq = new AuthRequest("chida.intern@example.com", "chidaPass456");
        AuthResponse memberAuth = authService.login(memberLoginReq);

        assertNotNull(memberAuth);
        assertNotNull(memberAuth.getToken());
        assertEquals("chida.intern@example.com", memberAuth.getEmail());
        assertEquals(Role.MEMBER, memberAuth.getRole());
        assertFalse(memberAuth.getIsCurrentLead());
        assertEquals("TITANS-002", memberAuth.getSerialNumber());
    }

    @Test
    void testLogin_WithUnregisteredEmail_Fails() {
        AuthRequest loginReq = new AuthRequest("nonexistent.user@random.com", "anyPassword123");
        assertThrows(BadCredentialsException.class, () -> authService.login(loginReq));
    }

    @Test
    void testLogin_WithWrongPassword_Fails() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Secure User")
                .email("secure.user@example.com")
                .password("correctPassword123")
                .teamName("Shield")
                .build();
        authService.register(registerReq);

        AuthRequest wrongPasswordReq = new AuthRequest("secure.user@example.com", "wrongPassword999");
        assertThrows(BadCredentialsException.class, () -> authService.login(wrongPasswordReq));
    }

    @Test
    void testMemberCannotAddMembersOrAccessLeadActions() {
        // Register Lead and Member
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Alpha Lead")
                .email("alpha.lead@example.com")
                .password("leadPass123")
                .teamName("Alpha")
                .build();
        AuthResponse leadAuth = authService.register(registerReq);
        User leadUser = userRepository.findById(leadAuth.getId()).orElseThrow();
        UserPrincipal leadPrincipal = new UserPrincipal(leadUser, leadAuth.getTeamId(), Role.LEAD);

        AddTeamMemberRequest addMemberReq = AddTeamMemberRequest.builder()
                .name("Alpha Member")
                .email("alpha.member@example.com")
                .password("memberPass123")
                .build();
        teamManagementService.addMemberToTeam(leadPrincipal, addMemberReq);

        User memberUser = userRepository.findByEmail("alpha.member@example.com").orElseThrow();
        UserPrincipal memberPrincipal = new UserPrincipal(memberUser, leadAuth.getTeamId(), Role.MEMBER);

        // Attempt by normal member to add another user must throw AccessDeniedException
        AddTeamMemberRequest unauthorizedAdd = AddTeamMemberRequest.builder()
                .name("Hacker User")
                .email("hacker@example.com")
                .password("hackerPass123")
                .build();
        assertThrows(AccessDeniedException.class, () -> 
                teamManagementService.addMemberToTeam(memberPrincipal, unauthorizedAdd));

        // Attempt by normal member to remove lead must throw AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> 
                teamManagementService.removeMemberFromTeam(memberPrincipal, leadUser.getId()));
    }

    @Test
    void testLeadershipRotation_TransfersLeadPrivilegesDynamically() {
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Initial Lead")
                .email("initial.lead@example.com")
                .password("pass123")
                .teamName("RotationTeam")
                .build();
        AuthResponse leadAuth = authService.register(registerReq);
        User leadUser = userRepository.findById(leadAuth.getId()).orElseThrow();
        UserPrincipal leadPrincipal = new UserPrincipal(leadUser, leadAuth.getTeamId(), Role.LEAD);

        AddTeamMemberRequest addMemberReq = AddTeamMemberRequest.builder()
                .name("Successor Member")
                .email("successor@example.com")
                .password("pass123")
                .build();
        teamManagementService.addMemberToTeam(leadPrincipal, addMemberReq);
        User successorUser = userRepository.findByEmail("successor@example.com").orElseThrow();

        // Rotate lead to successor
        ChangeLeadRequest changeLeadReq = ChangeLeadRequest.builder()
                .newLeadUserId(successorUser.getId())
                .notes("Monthly Lead Handover")
                .build();
        teamManagementService.changeCurrentLead(leadPrincipal, changeLeadReq);

        // Login as successor -> should now dynamically have Role.LEAD
        AuthResponse successorAuth = authService.login(new AuthRequest("successor@example.com", "pass123"));
        assertEquals(Role.LEAD, successorAuth.getRole());
        assertTrue(successorAuth.getIsCurrentLead());

        // Login as initial lead -> should now dynamically have Role.MEMBER
        AuthResponse initialLeadAuth = authService.login(new AuthRequest("initial.lead@example.com", "pass123"));
        assertEquals(Role.MEMBER, initialLeadAuth.getRole());
        assertFalse(initialLeadAuth.getIsCurrentLead());
    }
}
