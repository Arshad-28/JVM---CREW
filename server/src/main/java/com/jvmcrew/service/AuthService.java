package com.jvmcrew.service;

import com.jvmcrew.config.JwtTokenProvider;
import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.AuthRequest;
import com.jvmcrew.dto.AuthResponse;
import com.jvmcrew.dto.RegisterRequest;
import com.jvmcrew.model.LeadershipAssignment;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LeadershipAssignmentRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.TeamRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;
    private final LeadershipService leadershipService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email address is already registered: " + email);
        }

        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (!StringUtils.hasText(request.getPassword()) || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (!StringUtils.hasText(request.getTeamName())) {
            throw new IllegalArgumentException("Team name is required to register a new team");
        }

        String rawTeamName = request.getTeamName().trim();
        String cleanTeamName = rawTeamName.replaceAll("(?i)^JVM\\s*CREW\\s+", "").trim();
        if (cleanTeamName.isEmpty()) {
            cleanTeamName = rawTeamName;
        }

        // Validate that no active team already has this custom name
        String finalCleanName = cleanTeamName;
        boolean teamExists = teamRepository.existsByNameIgnoreCaseAndIsActiveTrue(finalCleanName)
                || teamRepository.existsByNameIgnoreCaseAndIsActiveTrue("JVM CREW " + finalCleanName)
                || teamRepository.existsByCustomNameIgnoreCaseAndIsActiveTrue(finalCleanName);

        if (teamExists) {
            throw new IllegalArgumentException("A team named '" + finalCleanName + "' already exists. Please choose a unique team name.");
        }

        // 1. Create the new Team
        Team team = Team.builder()
                .name(finalCleanName)
                .customName(finalCleanName)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        team = teamRepository.save(team);

        // 2. Create the User (Team Lead)
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword().trim()))
                .build();
        user = userRepository.save(user);

        // 3. Create the Team Membership with Role.LEAD and TEAMNAME-001 Crew ID
        String leadCrewId = String.format("%s-001", team.getCrewIdPrefix());
        TeamMember member = TeamMember.builder()
                .team(team)
                .user(user)
                .role(Role.LEAD)
                .position("SDE Intern")
                .serialNumber(leadCrewId)
                .isActive(true)
                .joinedAt(Instant.now())
                .build();
        teamMemberRepository.save(member);

        // 4. Create active Leadership Assignment for the registered Lead
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        String monthLabel = today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + today.getYear();

        leadershipAssignmentRepository.save(LeadershipAssignment.builder()
                .team(team)
                .user(user)
                .startDate(startOfMonth)
                .endDate(endOfMonth)
                .status("ACTIVE")
                .notes(monthLabel + " Team Lead: " + user.getName())
                .createdAt(Instant.now())
                .assignedBy(user)
                .build());

        UserPrincipal principal = new UserPrincipal(user, member, team.getId(), Role.LEAD);
        String token = tokenProvider.generateToken(principal);

        var leadInfo = leadershipService.getCurrentLeadInfo(user.getId(), team, today);
        String leadPeriod = leadInfo != null ? leadInfo.getPeriodLabel() : null;

        String finalDisplayName = team.getFormattedDisplayName().isEmpty() ? team.getName() : team.getFormattedDisplayName();
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(Role.LEAD)
                .teamId(team.getId())
                .teamName(finalDisplayName)
                .team(AuthResponse.TeamSummary.builder()
                        .id(team.getId())
                        .name(team.getName())
                        .displayName(finalDisplayName)
                        .build())
                .serialNumber(member.getSerialNumber())
                .position("SDE Intern")
                .isCurrentLead(true)
                .leadPeriod(leadPeriod)
                .photoUrl(user.getPhotoUrl())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = principal.getUser() != null 
                ? principal.getUser() 
                : userRepository.findById(principal.getId()).orElseThrow(() -> new IllegalArgumentException("User not found"));

        TeamMember teamMember = principal.getTeamMember() != null
                ? principal.getTeamMember()
                : teamMemberRepository.findActiveWithTeamByUser(user).orElseGet(() -> teamMemberRepository.findFirstByUser(user).orElse(null));

        Team team = teamMember != null ? teamMember.getTeam() : null;
        Long teamId = team != null ? team.getId() : principal.getTeamId();
        String teamName = team != null 
                ? (team.getFormattedDisplayName().isEmpty() ? team.getName() : team.getFormattedDisplayName())
                : "";

        String serialNumber = teamMember != null && teamMember.getSerialNumber() != null
                ? teamMember.getSerialNumber()
                : (team != null ? String.format("%s-%03d", team.getCrewIdPrefix(), user.getId()) : "MEMBER");
        String position = teamMember != null && teamMember.getPosition() != null ? teamMember.getPosition() : "SDE Intern";

        Role role = principal.getRole() != null ? principal.getRole() : Role.MEMBER;
        boolean isCurrentLead = role == Role.LEAD;

        LocalDate today = LocalDate.now();
        String leadPeriod = null;
        if (isCurrentLead) {
            YearMonth ym = YearMonth.from(today);
            leadPeriod = ym.atDay(1).format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " +
                         ym.atEndOfMonth().format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH));
        }

        String token = tokenProvider.generateToken(new UserPrincipal(user, teamMember, teamId, role));

        AuthResponse.TeamSummary teamSummary = team != null ? AuthResponse.TeamSummary.builder()
                .id(team.getId())
                .name(team.getName())
                .displayName(teamName)
                .build() : null;

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(role)
                .teamId(teamId)
                .teamName(teamName)
                .team(teamSummary)
                .serialNumber(serialNumber)
                .position(position)
                .isCurrentLead(isCurrentLead)
                .leadPeriod(leadPeriod)
                .phoneNumber(user.getPhoneNumber())
                .college(user.getCollege())
                .organization(user.getOrganization())
                .bio(user.getBio())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .photoUrl(user.getPhotoUrl())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    public AuthResponse getCurrentUser(UserPrincipal principal) {
        User user = principal.getUser() != null
                ? principal.getUser()
                : userRepository.findById(principal.getId()).orElseThrow(() -> new IllegalArgumentException("User not found"));

        TeamMember teamMember = principal.getTeamMember() != null
                ? principal.getTeamMember()
                : teamMemberRepository.findActiveWithTeamByUser(user).orElseGet(() -> teamMemberRepository.findFirstByUser(user).orElse(null));

        Team team = teamMember != null ? teamMember.getTeam() : null;
        Long teamId = team != null ? team.getId() : principal.getTeamId();
        String teamName = team != null 
                ? (team.getFormattedDisplayName().isEmpty() ? team.getName() : team.getFormattedDisplayName())
                : "";
        String serialNumber = teamMember != null && teamMember.getSerialNumber() != null
                ? teamMember.getSerialNumber()
                : (team != null ? String.format("%s-%03d", team.getCrewIdPrefix(), user.getId()) : "MEMBER");
        String position = teamMember != null && teamMember.getPosition() != null ? teamMember.getPosition() : "SDE Intern";

        Role role = principal.getRole() != null ? principal.getRole() : Role.MEMBER;
        boolean isCurrentLead = role == Role.LEAD;

        LocalDate today = LocalDate.now();
        String leadPeriod = null;
        if (isCurrentLead) {
            YearMonth ym = YearMonth.from(today);
            leadPeriod = ym.atDay(1).format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " +
                         ym.atEndOfMonth().format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH));
        }

        String token = tokenProvider.generateToken(new UserPrincipal(user, teamMember, teamId, role));

        AuthResponse.TeamSummary teamSummary = team != null ? AuthResponse.TeamSummary.builder()
                .id(team.getId())
                .name(team.getName())
                .displayName(teamName)
                .build() : null;

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(role)
                .teamId(teamId)
                .teamName(teamName)
                .team(teamSummary)
                .serialNumber(serialNumber)
                .position(position)
                .isCurrentLead(isCurrentLead)
                .leadPeriod(leadPeriod)
                .phoneNumber(user.getPhoneNumber())
                .college(user.getCollege())
                .organization(user.getOrganization())
                .bio(user.getBio())
                .githubUrl(user.getGithubUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .photoUrl(user.getPhotoUrl())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    @Transactional
    public void changePassword(Long userId, com.jvmcrew.dto.ChangePasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public AuthResponse updateAccount(UserPrincipal principal, com.jvmcrew.dto.UpdateAccountRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));

        String newEmail = request.getEmail().trim().toLowerCase();
        String newName = request.getName().trim();

        if (newName.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        if (newEmail.isBlank()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }

        // If email is changed, ensure uniqueness
        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email address is already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        user.setName(newName);
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber().trim());
        if (request.getCollege() != null) user.setCollege(request.getCollege().trim());
        if (request.getOrganization() != null) user.setOrganization(request.getOrganization().trim());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (request.getGithubUrl() != null) user.setGithubUrl(TeamManagementService.validateAndNormalizeGithubUrl(request.getGithubUrl()));
        if (request.getLinkedinUrl() != null) user.setLinkedinUrl(TeamManagementService.validateAndNormalizeLinkedInUrl(request.getLinkedinUrl()));
        if (request.getPhotoUrl() != null) user.setPhotoUrl(request.getPhotoUrl().trim().isEmpty() ? null : request.getPhotoUrl().trim());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());

        User savedUser = userRepository.save(user);

        TeamMember teamMember = teamMemberRepository.findActiveWithTeamByUser(savedUser)
                .orElseGet(() -> teamMemberRepository.findFirstByUser(savedUser).orElse(null));

        Team team = teamMember != null ? teamMember.getTeam() : null;
        Long teamId = team != null ? team.getId() : null;
        String teamName = team != null 
                ? (team.getFormattedDisplayName().isEmpty() ? team.getName() : team.getFormattedDisplayName())
                : "";
        String serialNumber = teamMember != null && teamMember.getSerialNumber() != null
                ? teamMember.getSerialNumber()
                : (team != null ? String.format("%s-%03d", team.getCrewIdPrefix(), savedUser.getId()) : "MEMBER");
        String position = teamMember != null && teamMember.getPosition() != null ? teamMember.getPosition() : "SDE Intern";

        LocalDate today = LocalDate.now();
        boolean isCurrentLead = leadershipService.isUserActiveLead(savedUser, team, today);
        Role role = isCurrentLead ? Role.LEAD : (teamMember != null ? teamMember.getRole() : Role.MEMBER);

        var leadInfo = leadershipService.getCurrentLeadInfo(savedUser.getId(), team, today);
        String leadPeriod = leadInfo != null ? leadInfo.getPeriodLabel() : null;

        String newToken = tokenProvider.generateToken(new UserPrincipal(savedUser, teamMember, teamId, role));

        AuthResponse.TeamSummary teamSummary = team != null ? AuthResponse.TeamSummary.builder()
                .id(team.getId())
                .name(team.getName())
                .displayName(teamName)
                .build() : null;

        return AuthResponse.builder()
                .token(newToken)
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(role)
                .teamId(teamId)
                .teamName(teamName)
                .team(teamSummary)
                .serialNumber(serialNumber)
                .position(position)
                .isCurrentLead(isCurrentLead)
                .leadPeriod(leadPeriod)
                .phoneNumber(savedUser.getPhoneNumber())
                .college(savedUser.getCollege())
                .organization(savedUser.getOrganization())
                .bio(savedUser.getBio())
                .githubUrl(savedUser.getGithubUrl())
                .linkedinUrl(savedUser.getLinkedinUrl())
                .photoUrl(savedUser.getPhotoUrl())
                .avatarUrl(savedUser.getAvatarUrl())
                .build();
    }
}
