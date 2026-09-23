package com.jvmcrew.service;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.*;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamManagementService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;
    private final LeadershipService leadershipService;
    private final StreakService streakService;
    private final PasswordEncoder passwordEncoder;
    private final SupabaseAdminService supabaseAdminService;

    @Transactional(readOnly = true)
    public TeamManagementDto getMyTeam(UserPrincipal principal) {
        Long userId = principal.getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Team team = resolveUserTeam(user, principal.getTeamId());
        return buildTeamManagementDto(team, userId);
    }

    @Transactional(readOnly = true)
    public TeamManagementDto getTeamById(Long teamId, Long requesterId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        if (requesterId != null) {
            User requester = userRepository.findById(requesterId).orElse(null);
            if (requester != null) {
                TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(requester).orElse(null);
                if (tm != null && tm.getRole() != Role.ADMIN && !tm.getTeam().getId().equals(team.getId())) {
                    throw new AccessDeniedException("You are not authorized to view team management details of another team.");
                }
            }
        }

        return buildTeamManagementDto(team, requesterId);
    }

    @Transactional
    public TeamManagementDto updateCustomTeamName(UserPrincipal principal, UpdateTeamNameRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));

        Team team = resolveUserTeam(user, principal.getTeamId());
        verifyLeadOrAdmin(principal, team);

        String raw = request.getCustomName().trim();
        String clean = raw.replaceAll("(?i)^JVM\\s*CREW\\s*", "").trim();
        if (clean.isEmpty()) {
            clean = "Team";
        }

        team.setCustomName(clean);
        team.setName(clean);
        team.setUpdatedAt(Instant.now());
        team = teamRepository.save(team);

        log.info("Team ID {} renamed to '{}' by User ID {}", team.getId(), team.getName(), principal.getId());
        return buildTeamManagementDto(team, principal.getId());
    }

    public String generateNextMemberCrewId(Team team) {
        String prefix = team.getCrewIdPrefix();
        List<TeamMember> activeMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);
        Set<Integer> usedSlots = new HashSet<>();
        for (TeamMember tm : activeMembers) {
            if (tm.getSerialNumber() != null && tm.getSerialNumber().toUpperCase().startsWith(prefix + "-")) {
                try {
                    String numPart = tm.getSerialNumber().substring(prefix.length() + 1);
                    usedSlots.add(Integer.parseInt(numPart));
                } catch (NumberFormatException ignored) {}
            }
        }
        int nextSlot = 2;
        while (nextSlot <= 5 && usedSlots.contains(nextSlot)) {
            nextSlot++;
        }
        if (nextSlot > 5) {
            for (int i = 1; i <= 5; i++) {
                if (!usedSlots.contains(i)) {
                    nextSlot = i;
                    break;
                }
            }
        }
        return String.format("%s-%03d", prefix, nextSlot);
    }

    @Transactional
    public TeamManagementDto addMemberToTeam(UserPrincipal principal, AddTeamMemberRequest request) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        Team team = resolveUserTeam(requester, principal.getTeamId());
        verifyLeadOrAdmin(principal, team);

        long activeMemberCount = teamMemberRepository.countByTeamAndIsActiveTrue(team);
        if (activeMemberCount >= 5) {
            throw new IllegalStateException("Team " + team.getFormattedDisplayName() + " has reached its maximum capacity of 5 members (1 Lead + 4 Interns).");
        }

        User targetUser = null;
        if (request.getUserId() != null) {
            targetUser = userRepository.findById(request.getUserId()).orElse(null);
        } else if (StringUtils.hasText(request.getEmail())) {
            targetUser = userRepository.findByEmail(request.getEmail().trim().toLowerCase()).orElse(null);
        }

        if (targetUser == null) {
            // Create user if not exists
            if (!StringUtils.hasText(request.getEmail())) {
                throw new IllegalArgumentException("User email is required to add a team member");
            }
            String name = StringUtils.hasText(request.getName()) ? request.getName().trim() : "SDE Intern";
            String email = request.getEmail().trim().toLowerCase();
            String rawPassword = StringUtils.hasText(request.getPassword()) ? request.getPassword().trim() : null;

            // Provision user in Supabase Auth via Admin API
            java.util.UUID supabaseAuthId = null;
            if (rawPassword != null) {
                supabaseAuthId = supabaseAdminService.createAuthUser(email, rawPassword, name).orElse(null);
            }

            targetUser = userRepository.save(User.builder()
                    .name(name)
                    .email(email)
                    .authUserId(supabaseAuthId)
                    .passwordHash(rawPassword != null ? passwordEncoder.encode(rawPassword) : null)
                    .phoneNumber(StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber().trim() : null)
                    .college(StringUtils.hasText(request.getCollege()) ? request.getCollege().trim() : null)
                    .organization(StringUtils.hasText(request.getOrganization()) ? request.getOrganization().trim() : "Algorithms365")
                    .bio(StringUtils.hasText(request.getBio()) ? request.getBio().trim() : null)
                    .githubUrl(validateAndNormalizeGithubUrl(request.getGithubUrl()))
                    .linkedinUrl(validateAndNormalizeLinkedInUrl(request.getLinkedinUrl()))
                    .build());
        } else {
            // Update existing user profile if new information provided
            if (StringUtils.hasText(request.getName())) targetUser.setName(request.getName().trim());
            if (StringUtils.hasText(request.getPhoneNumber())) targetUser.setPhoneNumber(request.getPhoneNumber().trim());
            if (StringUtils.hasText(request.getCollege())) targetUser.setCollege(request.getCollege().trim());
            if (StringUtils.hasText(request.getOrganization())) targetUser.setOrganization(request.getOrganization().trim());
            if (StringUtils.hasText(request.getBio())) targetUser.setBio(request.getBio().trim());
            if (request.getGithubUrl() != null) targetUser.setGithubUrl(validateAndNormalizeGithubUrl(request.getGithubUrl()));
            if (request.getLinkedinUrl() != null) targetUser.setLinkedinUrl(validateAndNormalizeLinkedInUrl(request.getLinkedinUrl()));
            if (StringUtils.hasText(request.getPassword())) {
                targetUser.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
            }
            targetUser = userRepository.save(targetUser);

            // Check if user is actively in another team
            Optional<TeamMember> otherActiveMembership = teamMemberRepository.findFirstByUserAndIsActiveTrue(targetUser);
            if (otherActiveMembership.isPresent() && !otherActiveMembership.get().getTeam().getId().equals(team.getId())) {
                if (Boolean.TRUE.equals(request.getTransferIfAssigned())) {
                    TeamMember oldTm = otherActiveMembership.get();
                    oldTm.setIsActive(false);
                    oldTm.setLeftAt(Instant.now());
                    teamMemberRepository.save(oldTm);
                    log.info("Transferred user {} from team {} to team {}", targetUser.getEmail(), oldTm.getTeam().getName(), team.getName());
                } else {
                    throw new IllegalStateException(targetUser.getName() + " is already an active member of " 
                            + otherActiveMembership.get().getTeam().getFormattedDisplayName() 
                            + ". Set transferIfAssigned=true to move this user.");
                }
            }
        }

        // Check if user is already an active member of this team
        Optional<TeamMember> existingMembership = teamMemberRepository.findByTeamAndUser(team, targetUser);
        if (existingMembership.isPresent()) {
            TeamMember tm = existingMembership.get();
            if (Boolean.TRUE.equals(tm.getIsActive())) {
                throw new IllegalStateException(targetUser.getName() + " is already an active member of " + team.getFormattedDisplayName());
            }
            tm.setIsActive(true);
            tm.setLeftAt(null);
            tm.setPosition("SDE Intern");
            if (StringUtils.hasText(request.getSerialNumber())) {
                tm.setSerialNumber(request.getSerialNumber().trim());
            }
            teamMemberRepository.save(tm);
        } else {
            String serial = StringUtils.hasText(request.getSerialNumber())
                    ? request.getSerialNumber().trim()
                    : generateNextMemberCrewId(team);

            TeamMember newMember = TeamMember.builder()
                    .team(team)
                    .user(targetUser)
                    .role(Role.MEMBER)
                    .serialNumber(serial)
                    .position("SDE Intern")
                    .isActive(true)
                    .joinedAt(Instant.now())
                    .build();
            teamMemberRepository.save(newMember);
        }

        log.info("User {} added to team {} by User {}", targetUser.getEmail(), team.getName(), principal.getId());
        return buildTeamManagementDto(team, principal.getId());
    }

    @Transactional
    public TeamManagementDto removeMemberFromTeam(UserPrincipal principal, Long targetUserId) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        Team team = resolveUserTeam(requester, principal.getTeamId());
        verifyLeadOrAdmin(principal, team);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));

        TeamMember tm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, targetUser)
                .orElseThrow(() -> new IllegalStateException("User is not an active member of this team"));

        // Cannot remove the current active Lead directly without transferring lead
        LocalDate today = LocalDate.now();
        if (leadershipService.isUserActiveLead(targetUser, today)) {
            throw new IllegalStateException("Cannot remove the active Current Lead. Please reassign leadership to another team member first.");
        }

        tm.setIsActive(false);
        tm.setLeftAt(Instant.now());
        teamMemberRepository.save(tm);

        log.info("User ID {} soft-removed from team ID {} by Lead ID {}", targetUserId, team.getId(), principal.getId());
        return buildTeamManagementDto(team, principal.getId());
    }

    @Transactional
    public TeamManagementDto changeCurrentLead(UserPrincipal principal, ChangeLeadRequest request) {
        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        Team team = resolveUserTeam(requester, principal.getTeamId());
        verifyLeadOrAdmin(principal, team);

        User newLead = userRepository.findById(request.getNewLeadUserId())
                .orElseThrow(() -> new IllegalArgumentException("New lead user not found: " + request.getNewLeadUserId()));

        TeamMember newLeadMembership = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, newLead)
                .orElseThrow(() -> new IllegalStateException("The selected user is not an active member of " + team.getFormattedDisplayName()));

        LocalDate today = LocalDate.now();
        LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : today;
        LocalDate endDate = request.getEndDate() != null ? request.getEndDate() : YearMonth.from(startDate).atEndOfMonth();

        // 1. Close active leadership assignments for this team covering today
        List<LeadershipAssignment> activeAssignments = leadershipAssignmentRepository.findActiveAssignmentsForTeamAndDate(team, today);
        for (LeadershipAssignment a : activeAssignments) {
            if (!a.getUser().getId().equals(newLead.getId())) {
                a.setStatus("SUPERSEDED");
                if (a.getStartDate().isBefore(today)) {
                    a.setEndDate(today.minusDays(1));
                }
                leadershipAssignmentRepository.save(a);
            }
        }

        // 2. Create new active assignment for the new Lead
        LeadershipAssignment newAssignment = LeadershipAssignment.builder()
                .team(team)
                .user(newLead)
                .startDate(startDate)
                .endDate(endDate)
                .assignedBy(requester)
                .notes(StringUtils.hasText(request.getNotes()) ? request.getNotes().trim() : "Leadership Assigned via Team Management")
                .status("ACTIVE")
                .build();
        leadershipAssignmentRepository.save(newAssignment);

        // 3. Update team_members roles: new lead -> Role.LEAD, previous members -> Role.MEMBER
        List<TeamMember> teamMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);
        for (TeamMember m : teamMembers) {
            if (m.getUser().getId().equals(newLead.getId())) {
                m.setRole(Role.LEAD);
            } else {
                m.setRole(Role.MEMBER);
            }
            m.setPosition("SDE Intern");
            teamMemberRepository.save(m);
        }

        log.info("Leadership of Team ID {} transferred to User ID {} ({}) by User ID {}",
                team.getId(), newLead.getId(), newLead.getName(), requester.getId());

        return buildTeamManagementDto(team, principal.getId());
    }

    @Transactional(readOnly = true)
    public List<OrganizationTeamSummaryDto> getAllTeams() {
        List<Team> teams = teamRepository.findByIsActiveTrueOrderByIdAsc();
        LocalDate today = LocalDate.now();

        return teams.stream().map(team -> {
            int memberCount = (int) teamMemberRepository.countByTeamAndIsActiveTrue(team);
            List<LeadershipAssignment> activeList = leadershipAssignmentRepository.findActiveAssignmentsForTeamAndDate(team, today);
            Optional<LeadershipAssignment> leadOpt = !activeList.isEmpty() ? Optional.of(activeList.get(0)) : Optional.empty();

            Long leadUserId = null;
            String leadName = "Unassigned";
            String leadEmail = null;
            String period = "—";

            if (leadOpt.isPresent()) {
                LeadershipAssignment a = leadOpt.get();
                leadUserId = a.getUser().getId();
                leadName = a.getUser().getName();
                leadEmail = a.getUser().getEmail();
                period = a.getStartDate().format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " + a.getEndDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH));
            }

            return OrganizationTeamSummaryDto.builder()
                    .id(team.getId())
                    .parentBrand("JVM CREW")
                    .customName(team.getCustomName() != null ? team.getCustomName() : "")
                    .displayName(team.getFormattedDisplayName())
                    .cohort(team.getCohort())
                    .memberCount(memberCount)
                    .currentLeadUserId(leadUserId)
                    .currentLeadName(leadName)
                    .currentLeadEmail(leadEmail)
                    .currentLeadPeriod(period)
                    .isActive(team.getIsActive())
                    .createdAt(team.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public TeamManagementDto createTeam(UserPrincipal principal, CreateTeamRequest request) {
        String raw = request.getCustomName().trim();
        String clean = raw.replaceAll("(?i)^JVM\\s*CREW\\s*", "").trim();
        if (clean.isEmpty()) {
            clean = "Team";
        }

        Team team = Team.builder()
                .customName(clean)
                .name(clean)
                .cohort(StringUtils.hasText(request.getCohort()) ? request.getCohort().trim() : null)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        team = teamRepository.save(team);

        log.info("New team created: ID {} - '{}' by User ID {}", team.getId(), team.getName(), principal.getId());
        return buildTeamManagementDto(team, principal.getId());
    }

    private Team resolveUserTeam(User user, Long teamId) {
        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user).orElse(null);
        if (tm != null) {
            return tm.getTeam();
        }
        if (teamId != null) {
            return teamRepository.findById(teamId)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
        }
        throw new IllegalStateException("User " + user.getEmail() + " does not belong to any active team");
    }

    private void verifyLeadOrAdmin(UserPrincipal principal, Team team) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (principal.getRole() == Role.ADMIN) return;
        User requester = userRepository.findById(principal.getId()).orElse(null);
        if (requester != null) {
            boolean isLeadToday = leadershipService.isUserActiveLead(requester, team, LocalDate.now());
            TeamMember tm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, requester).orElse(null);
            if (isLeadToday || (tm != null && tm.getRole() == Role.LEAD)) {
                return;
            }
        }
        throw new AccessDeniedException("Only the active Current Lead or Administrator can manage " + team.getFormattedDisplayName());
    }

    private TeamManagementDto buildTeamManagementDto(Team team, Long requesterUserId) {
        LocalDate today = LocalDate.now();
        CurrentLeadDto currentLeadDto = leadershipService.getCurrentLeadInfo(requesterUserId, team.getId(), today);

        List<TeamMember> activeMembers = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);

        List<User> memberUsers = activeMembers.stream().map(TeamMember::getUser).collect(Collectors.toList());
        Map<Long, UserStreakDto> memberStreakMap = streakService.getBatchUserStreaks(memberUsers, today);

        List<TeamMemberSummaryDto> memberDtos = activeMembers.stream().map(m -> {
            boolean isLead = currentLeadDto != null && m.getUser().getId().equals(currentLeadDto.getUserId());
            int streak = memberStreakMap.containsKey(m.getUser().getId())
                    ? memberStreakMap.get(m.getUser().getId()).getCurrentStreak()
                    : 0;

            return TeamMemberSummaryDto.builder()
                    .membershipId(m.getId())
                    .userId(m.getUser().getId())
                    .name(m.getUser().getName())
                    .email(m.getUser().getEmail())
                    .serialNumber(m.getSerialNumber() != null ? m.getSerialNumber() : String.format("%s-%03d", team.getCrewIdPrefix(), m.getUser().getId()))
                    .position(m.getPosition() != null ? m.getPosition() : "SDE Intern")
                    .role(isLead ? "LEAD" : "MEMBER")
                    .isCurrentLead(isLead)
                    .streakDays(streak)
                    .joinedAt(m.getJoinedAt())
                    .isActive(m.getIsActive())
                    .phoneNumber(m.getUser().getPhoneNumber())
                    .college(m.getUser().getCollege())
                    .organization(m.getUser().getOrganization())
                    .bio(m.getUser().getBio())
                    .githubUrl(m.getUser().getGithubUrl())
                    .linkedinUrl(m.getUser().getLinkedinUrl())
                    .photoUrl(m.getUser().getPhotoUrl())
                    .avatarUrl(m.getUser().getAvatarUrl())
                    .build();
        }).collect(Collectors.toList());

        boolean isAuthorized = (currentLeadDto != null && requesterUserId != null && requesterUserId.equals(currentLeadDto.getUserId()));

        return TeamManagementDto.builder()
                .id(team.getId())
                .parentBrand("JVM CREW")
                .customName(team.getCustomName() != null ? team.getCustomName() : "")
                .displayName(team.getFormattedDisplayName())
                .cohort(team.getCohort())
                .isActive(team.getIsActive())
                .createdAt(team.getCreatedAt())
                .currentLead(currentLeadDto)
                .members(memberDtos)
                .memberCount(memberDtos.size())
                .isUserAuthorizedToManage(isAuthorized)
                .build();
    }

    @Transactional
    public TeamManagementDto updateMember(UserPrincipal principal, Long targetUserId, LeadUpdateMemberRequest request) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }

        User requester = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Requester not found"));

        Team team = resolveUserTeam(requester, principal.getTeamId());

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));

        TeamMember tm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, targetUser)
                .orElseThrow(() -> new AccessDeniedException("User " + targetUserId + " is not an active member of your team"));

        LocalDate today = LocalDate.now();
        boolean isAdmin = principal.getRole() == Role.ADMIN;
        boolean isLeadToday = isAdmin || leadershipService.isUserActiveLead(requester, team, today);
        boolean isSelf = requester.getId().equals(targetUserId);

        if (!isLeadToday && !isSelf) {
            throw new AccessDeniedException("You do not have permission to edit another member's profile.");
        }

        if (StringUtils.hasText(request.getName())) {
            if (isLeadToday || isAdmin) {
                targetUser.setName(request.getName().trim());
            }
        }
        if (StringUtils.hasText(request.getEmail())) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(targetUser.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    throw new IllegalArgumentException("Email already in use: " + newEmail);
                }
                if (isLeadToday || isAdmin) {
                    targetUser.setEmail(newEmail);
                }
            }
        }
        if (request.getPhoneNumber() != null) {
            targetUser.setPhoneNumber(request.getPhoneNumber().trim().isEmpty() ? null : request.getPhoneNumber().trim());
        }
        if (request.getCollege() != null) {
            targetUser.setCollege(request.getCollege().trim().isEmpty() ? null : request.getCollege().trim());
        }
        if (request.getOrganization() != null) {
            targetUser.setOrganization(request.getOrganization().trim().isEmpty() ? null : request.getOrganization().trim());
        }
        if (request.getBio() != null) {
            targetUser.setBio(request.getBio().trim().isEmpty() ? null : request.getBio().trim());
        }
        if (request.getGithubUrl() != null) {
            targetUser.setGithubUrl(validateAndNormalizeGithubUrl(request.getGithubUrl()));
        }
        if (request.getLinkedinUrl() != null) {
            targetUser.setLinkedinUrl(validateAndNormalizeLinkedInUrl(request.getLinkedinUrl()));
        }
        if (request.getPhotoUrl() != null) {
            targetUser.setPhotoUrl(request.getPhotoUrl().trim().isEmpty() ? null : request.getPhotoUrl().trim());
        }
        if (request.getAvatarUrl() != null) {
            targetUser.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }
        userRepository.save(targetUser);

        if (isLeadToday || isAdmin) {
            if (StringUtils.hasText(request.getSerialNumber())) {
                tm.setSerialNumber(request.getSerialNumber().trim());
            }
            if (StringUtils.hasText(request.getPosition())) {
                tm.setPosition(request.getPosition().trim());
            }
            teamMemberRepository.save(tm);
        }

        log.info("Member ID {} updated in Team ID {} by User ID {}", targetUserId, team.getId(), requester.getId());
        return buildTeamManagementDto(team, principal.getId());
    }

    public static String validateAndNormalizeLinkedInUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
            throw new IllegalArgumentException("Invalid URL protocol");
        }
        if (lower.startsWith("linkedin.com")) {
            trimmed = "https://www.linkedin.com" + trimmed.substring(12);
        } else if (lower.startsWith("www.linkedin.com")) {
            trimmed = "https://" + trimmed;
        } else if (lower.startsWith("http://linkedin.com")) {
            trimmed = "https://www.linkedin.com" + trimmed.substring(19);
        } else if (lower.startsWith("https://linkedin.com")) {
            trimmed = "https://www.linkedin.com" + trimmed.substring(20);
        } else if (lower.startsWith("http://")) {
            trimmed = "https://" + trimmed.substring(7);
        } else if (!lower.startsWith("https://")) {
            trimmed = "https://" + trimmed;
        }
        try {
            java.net.URI uri = new java.net.URI(trimmed);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Invalid LinkedIn URL host");
            }
            String hostLower = host.toLowerCase();
            if (!hostLower.equals("linkedin.com") && !hostLower.endsWith(".linkedin.com")) {
                throw new IllegalArgumentException("URL must be a valid LinkedIn profile URL (e.g. linkedin.com/in/username)");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid LinkedIn profile URL: " + url);
        }
        return trimmed;
    }

    public static String validateAndNormalizeGithubUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
            throw new IllegalArgumentException("Invalid URL protocol");
        }
        if (lower.startsWith("github.com")) {
            trimmed = "https://github.com" + trimmed.substring(10);
        } else if (lower.startsWith("www.github.com")) {
            trimmed = "https://github.com" + trimmed.substring(14);
        } else if (lower.startsWith("http://www.github.com")) {
            trimmed = "https://github.com" + trimmed.substring(21);
        } else if (lower.startsWith("https://www.github.com")) {
            trimmed = "https://github.com" + trimmed.substring(22);
        } else if (lower.startsWith("http://github.com")) {
            trimmed = "https://github.com" + trimmed.substring(17);
        } else if (lower.startsWith("http://")) {
            trimmed = "https://" + trimmed.substring(7);
        } else if (!lower.startsWith("https://")) {
            trimmed = "https://" + trimmed;
        }
        try {
            java.net.URI uri = new java.net.URI(trimmed);
            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Invalid GitHub URL host");
            }
            String hostLower = host.toLowerCase();
            if (!hostLower.equals("github.com") && !hostLower.endsWith(".github.com")) {
                throw new IllegalArgumentException("URL must be a valid GitHub profile URL (e.g. github.com/username)");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid GitHub profile URL: " + url);
        }
        return trimmed;
    }

    public static String validateAndNormalizeUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
            throw new IllegalArgumentException("Invalid URL protocol");
        }
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            trimmed = "https://" + trimmed;
        } else if (lower.startsWith("http://")) {
            trimmed = "https://" + trimmed.substring(7);
        }
        try {
            java.net.URI uri = new java.net.URI(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                throw new IllegalArgumentException("URL must use HTTP or HTTPS");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException("Invalid URL host");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid profile URL: " + url);
        }
        return trimmed;
    }
}
