package com.jvmcrew;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.AuthRequest;
import com.jvmcrew.dto.AuthResponse;
import com.jvmcrew.dto.LeadUpdateMemberRequest;
import com.jvmcrew.dto.TeamManagementDto;
import com.jvmcrew.dto.UpdateAccountRequest;
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

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class MemberProfilePersistenceTest {

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

    private Team teamA;
    private Team teamB;
    private User leadA;
    private User memberA;
    private User leadB;
    private User memberB;

    @BeforeEach
    void setUp() {
        teamA = teamRepository.save(Team.builder()
                .name("Alpha")
                .customName("Alpha")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        leadA = userRepository.save(User.builder()
                .name("Lead A")
                .email("lead.a@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .college("Engineering College A")
                .organization("Algorithms365")
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamA)
                .user(leadA)
                .role(Role.LEAD)
                .serialNumber("ALPHA-001")
                .position("SDE Intern")
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

        memberA = userRepository.save(User.builder()
                .name("Member A")
                .email("member.a@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .college("Engineering College A")
                .organization("Algorithms365")
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamA)
                .user(memberA)
                .role(Role.MEMBER)
                .serialNumber("ALPHA-002")
                .position("SDE Intern")
                .isActive(true)
                .joinedAt(Instant.now())
                .build());

        teamB = teamRepository.save(Team.builder()
                .name("Beta")
                .customName("Beta")
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());

        leadB = userRepository.save(User.builder()
                .name("Lead B")
                .email("lead.b@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .college("Engineering College B")
                .organization("Algorithms365")
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamB)
                .user(leadB)
                .role(Role.LEAD)
                .serialNumber("BETA-001")
                .position("SDE Intern")
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

        memberB = userRepository.save(User.builder()
                .name("Member B")
                .email("member.b@test.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .college("Engineering College B")
                .organization("Algorithms365")
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(teamB)
                .user(memberB)
                .role(Role.MEMBER)
                .serialNumber("BETA-002")
                .position("SDE Intern")
                .isActive(true)
                .joinedAt(Instant.now())
                .build());
    }

    @Test
    void test1_LeadCanViewAllMembersAndEditTeamMemberAndPersistsToPostgreSQL() {
        UserPrincipal leadPrincipal = new UserPrincipal(leadA, teamA.getId(), Role.LEAD);

        // 1. Verify visibility: Lead can see all team members of their team
        TeamManagementDto teamData = teamManagementService.getMyTeam(leadPrincipal);
        assertEquals(2, teamData.getMembers().size());
        assertTrue(teamData.getIsUserAuthorizedToManage());
        assertTrue(teamData.getMembers().stream().anyMatch(m -> m.getUserId().equals(leadA.getId()) && m.getIsCurrentLead()));
        assertTrue(teamData.getMembers().stream().anyMatch(m -> m.getUserId().equals(memberA.getId()) && !m.getIsCurrentLead()));

        // 2. Lead edits member
        LeadUpdateMemberRequest updateRequest = LeadUpdateMemberRequest.builder()
                .name("Member A Updated")
                .email("member.a@test.com")
                .phoneNumber("+91 9988776655")
                .college("MIT Bangalore")
                .organization("Algorithms365 Global")
                .bio("Specialized in High Performance Java Backend Systems")
                .linkedinUrl("www.linkedin.com/in/member-a-updated")
                .githubUrl("github.com/member-a-updated")
                .photoUrl("https://example.com/avatar-a.png")
                .position("Lead Backend Engineer")
                .serialNumber("ALPHA-002")
                .build();

        TeamManagementDto teamResult = teamManagementService.updateMember(leadPrincipal, memberA.getId(), updateRequest);
        assertNotNull(teamResult);

        // 3. Verify PostgreSQL persistence
        User updatedMemberInDb = userRepository.findById(memberA.getId()).orElseThrow();
        assertEquals("Member A Updated", updatedMemberInDb.getName());
        assertEquals("+91 9988776655", updatedMemberInDb.getPhoneNumber());
        assertEquals("MIT Bangalore", updatedMemberInDb.getCollege());
        assertEquals("Algorithms365 Global", updatedMemberInDb.getOrganization());
        assertEquals("Specialized in High Performance Java Backend Systems", updatedMemberInDb.getBio());
        assertEquals("https://www.linkedin.com/in/member-a-updated", updatedMemberInDb.getLinkedinUrl());
        assertEquals("https://github.com/member-a-updated", updatedMemberInDb.getGithubUrl());
        assertEquals("https://example.com/avatar-a.png", updatedMemberInDb.getPhotoUrl());

        TeamMember tmInDb = teamMemberRepository.findByTeamAndUser(teamA, updatedMemberInDb).orElseThrow();
        assertEquals("Lead Backend Engineer", tmInDb.getPosition());

        // 4. Verify Member receives updated profile on login
        AuthResponse memberAuth = authService.login(new AuthRequest("member.a@test.com", "password123"));
        assertEquals("Member A Updated", memberAuth.getName());
        assertEquals("MIT Bangalore", memberAuth.getCollege());
        assertEquals("Algorithms365 Global", memberAuth.getOrganization());
        assertEquals("Specialized in High Performance Java Backend Systems", memberAuth.getBio());
        assertEquals("https://www.linkedin.com/in/member-a-updated", memberAuth.getLinkedinUrl());
        assertEquals("https://github.com/member-a-updated", memberAuth.getGithubUrl());
        assertEquals("https://example.com/avatar-a.png", memberAuth.getPhotoUrl());
    }

    @Test
    void test2_NormalMemberCanViewAllTeamMembersButNotAuthorizedToManage() {
        UserPrincipal memberPrincipal = new UserPrincipal(memberA, teamA.getId(), Role.MEMBER);

        TeamManagementDto teamData = teamManagementService.getMyTeam(memberPrincipal);
        assertNotNull(teamData);
        assertEquals(2, teamData.getMembers().size());
        assertFalse(teamData.getIsUserAuthorizedToManage()); // Normal member cannot manage team

        // Verify all team members are present
        assertTrue(teamData.getMembers().stream().anyMatch(m -> m.getUserId().equals(leadA.getId())));
        assertTrue(teamData.getMembers().stream().anyMatch(m -> m.getUserId().equals(memberA.getId())));
    }

    @Test
    void test3_NormalMemberCanEditOwnProfile() {
        UserPrincipal memberPrincipal = new UserPrincipal(memberA, teamA.getId(), Role.MEMBER);

        // Self-edit via updateMember
        LeadUpdateMemberRequest selfUpdateRequest = LeadUpdateMemberRequest.builder()
                .phoneNumber("+91 9123456780")
                .college("RVCE Bangalore")
                .organization("Algorithms365 Engineering")
                .bio("Focused on Distributed Systems")
                .linkedinUrl("linkedin.com/in/member-a-self")
                .githubUrl("github.com/member-a-self")
                .photoUrl("https://example.com/photo-self.png")
                .build();

        TeamManagementDto result = teamManagementService.updateMember(memberPrincipal, memberA.getId(), selfUpdateRequest);
        assertNotNull(result);

        User dbUser = userRepository.findById(memberA.getId()).orElseThrow();
        assertEquals("+91 9123456780", dbUser.getPhoneNumber());
        assertEquals("RVCE Bangalore", dbUser.getCollege());
        assertEquals("Algorithms365 Engineering", dbUser.getOrganization());
        assertEquals("Focused on Distributed Systems", dbUser.getBio());
        assertEquals("https://www.linkedin.com/in/member-a-self", dbUser.getLinkedinUrl());
        assertEquals("https://github.com/member-a-self", dbUser.getGithubUrl());
        assertEquals("https://example.com/photo-self.png", dbUser.getPhotoUrl());

        // Also verify via AuthService updateAccount
        UpdateAccountRequest accountRequest = UpdateAccountRequest.builder()
                .name("Member A Final")
                .email("member.a@test.com")
                .college("RVCE Bangalore")
                .organization("Algorithms365 Engineering")
                .bio("Distributed Systems Specialist")
                .githubUrl("github.com/member-a-self")
                .linkedinUrl("linkedin.com/in/member-a-self")
                .photoUrl("https://example.com/photo-self.png")
                .build();

        AuthResponse authResult = authService.updateAccount(memberPrincipal, accountRequest);
        assertEquals("Member A Final", authResult.getName());
        assertEquals("Distributed Systems Specialist", authResult.getBio());
    }

    @Test
    void test4_ApiSecurity_NormalMemberCannotEditAnotherMemberProfile() {
        UserPrincipal memberAPrincipal = new UserPrincipal(memberA, teamA.getId(), Role.MEMBER);

        LeadUpdateMemberRequest updateRequest = LeadUpdateMemberRequest.builder()
                .name("Malicious Edit Attempt")
                .email("lead.a@test.com")
                .bio("Unauthorized change")
                .build();

        // Attempt to edit Lead A by Member A must throw AccessDeniedException (HTTP 403 Forbidden)
        assertThrows(AccessDeniedException.class, () -> {
            teamManagementService.updateMember(memberAPrincipal, leadA.getId(), updateRequest);
        });
    }

    @Test
    void test5_CrossTeam_CannotViewOrEditMembersOfAnotherTeam() {
        UserPrincipal leadAPrincipal = new UserPrincipal(leadA, teamA.getId(), Role.LEAD);

        // 1. Team A getMyTeam only contains Team A members, never Team B members
        TeamManagementDto teamAData = teamManagementService.getMyTeam(leadAPrincipal);
        assertTrue(teamAData.getMembers().stream().noneMatch(m -> m.getUserId().equals(memberB.getId())));
        assertTrue(teamAData.getMembers().stream().noneMatch(m -> m.getUserId().equals(leadB.getId())));

        // 2. Attempting to edit Member B (belonging to Team B) by Lead A must throw AccessDeniedException
        LeadUpdateMemberRequest updateRequest = LeadUpdateMemberRequest.builder()
                .name("Cross Team Attack")
                .email("member.b@test.com")
                .college("Hacker College")
                .build();

        assertThrows(AccessDeniedException.class, () -> {
            teamManagementService.updateMember(leadAPrincipal, memberB.getId(), updateRequest);
        });
    }

    @Test
    void test6_LeadRotation_DynamicallyTransfersEditPermissions() {
        UserPrincipal initialLeadPrincipal = new UserPrincipal(leadA, teamA.getId(), Role.LEAD);

        // 1. Initially, Lead A can edit Member A
        LeadUpdateMemberRequest req1 = LeadUpdateMemberRequest.builder()
                .bio("First update by Lead A")
                .build();
        assertDoesNotThrow(() -> teamManagementService.updateMember(initialLeadPrincipal, memberA.getId(), req1));

        // 2. Rotate leadership: Member A becomes the new Lead
        com.jvmcrew.dto.ChangeLeadRequest changeLeadReq = com.jvmcrew.dto.ChangeLeadRequest.builder()
                .newLeadUserId(memberA.getId())
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .notes("Rotated lead to Member A")
                .build();

        teamManagementService.changeCurrentLead(initialLeadPrincipal, changeLeadReq);

        // 3. Now create principals for the new state
        UserPrincipal oldLeadPrincipal = new UserPrincipal(leadA, teamA.getId(), Role.MEMBER);
        UserPrincipal newLeadPrincipal = new UserPrincipal(memberA, teamA.getId(), Role.LEAD);

        // 4. Old Lead (now normal member) CANNOT edit other members
        LeadUpdateMemberRequest oldLeadAttempt = LeadUpdateMemberRequest.builder()
                .bio("Attempted edit by demoted lead")
                .build();
        assertThrows(AccessDeniedException.class, () -> {
            teamManagementService.updateMember(oldLeadPrincipal, memberA.getId(), oldLeadAttempt);
        });

        // 5. New Lead CAN edit other team members
        LeadUpdateMemberRequest newLeadAttempt = LeadUpdateMemberRequest.builder()
                .bio("Legitimate edit by New Lead")
                .build();
        assertDoesNotThrow(() -> {
            teamManagementService.updateMember(newLeadPrincipal, leadA.getId(), newLeadAttempt);
        });

        User leadAInDb = userRepository.findById(leadA.getId()).orElseThrow();
        assertEquals("Legitimate edit by New Lead", leadAInDb.getBio());
    }

    @Test
    void testUrlNormalization() {
        assertEquals("https://www.linkedin.com/in/sample",
                TeamManagementService.validateAndNormalizeLinkedInUrl("www.linkedin.com/in/sample"));
        assertEquals("https://www.linkedin.com/in/sample",
                TeamManagementService.validateAndNormalizeLinkedInUrl("linkedin.com/in/sample"));
        assertEquals("https://www.linkedin.com/in/sample",
                TeamManagementService.validateAndNormalizeLinkedInUrl("http://www.linkedin.com/in/sample"));
        assertEquals("https://www.linkedin.com/in/sample",
                TeamManagementService.validateAndNormalizeLinkedInUrl("https://www.linkedin.com/in/sample"));

        assertEquals("https://github.com/sample",
                TeamManagementService.validateAndNormalizeGithubUrl("github.com/sample"));
        assertEquals("https://github.com/sample",
                TeamManagementService.validateAndNormalizeGithubUrl("http://github.com/sample"));
        assertEquals("https://github.com/sample",
                TeamManagementService.validateAndNormalizeGithubUrl("https://github.com/sample"));
    }
}
