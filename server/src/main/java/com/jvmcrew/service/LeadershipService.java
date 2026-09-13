package com.jvmcrew.service;

import com.jvmcrew.dto.CreateLeadershipAssignmentRequest;
import com.jvmcrew.dto.CurrentLeadDto;
import com.jvmcrew.dto.LeadershipAssignmentDto;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeadershipService {

    private final LeadershipAssignmentRepository assignmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH);

    /**
     * Resolves the active Lead User for a given Team on a specific calendar date.
     */
    @Transactional(readOnly = true)
    public Optional<User> resolveActiveLeadForDate(Team team, LocalDate date) {
        if (team == null || date == null) return Optional.empty();

        List<LeadershipAssignment> activeList = assignmentRepository.findActiveAssignmentsForTeamAndDate(team, date);
        if (!activeList.isEmpty()) {
            return Optional.of(activeList.get(0).getUser());
        }

        // Fallback to default lead in team_members if no assignment period is present
        return teamMemberRepository.findByTeam(team).stream()
                .filter(tm -> tm.getRole() == Role.LEAD)
                .map(TeamMember::getUser)
                .findFirst();
    }

    /**
     * Checks whether a specific user is the active lead for their team on the target date.
     */
    @Transactional(readOnly = true)
    public boolean isUserActiveLead(User user, LocalDate date) {
        if (user == null || date == null) return false;

        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user).orElse(null);
        if (tm == null) return false;

        return isUserActiveLead(user, tm.getTeam(), date);
    }

    /**
     * Checks whether a specific user is the active lead for a specified team on the target date.
     */
    @Transactional(readOnly = true)
    public boolean isUserActiveLead(User user, Team team, LocalDate date) {
        if (user == null || team == null || date == null) return false;

        Optional<User> activeLead = resolveActiveLeadForDate(team, date);
        return activeLead.isPresent() && activeLead.get().getId().equals(user.getId());
    }

    /**
     * Resolves Current Lead DTO for today's date.
     */
    @Transactional(readOnly = true)
    public CurrentLeadDto getCurrentLeadInfo(Long userId, LocalDate targetDate) {
        return getCurrentLeadInfo(userId, null, targetDate);
    }

    @Transactional(readOnly = true)
    public CurrentLeadDto getCurrentLeadInfo(Long userId, Long teamId, LocalDate targetDate) {
        LocalDate date = targetDate != null ? targetDate : LocalDate.now();
        Team team = null;

        if (teamId != null) {
            team = teamRepository.findById(teamId).orElse(null);
        }

        if (team == null && userId != null) {
            User currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(currentUser).orElse(null);
                if (tm != null) team = tm.getTeam();
            }
        }

        if (team == null) {
            return null;
        }

        List<LeadershipAssignment> activeList = assignmentRepository.findActiveAssignmentsForTeamAndDate(team, date);
        LeadershipAssignment assignment = !activeList.isEmpty() ? activeList.get(0) : null;

        User leadUser = assignment != null ? assignment.getUser() : null;
        if (leadUser == null) {
            leadUser = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team).stream()
                    .filter(tm -> tm.getRole() == Role.LEAD)
                    .map(TeamMember::getUser)
                    .findFirst()
                    .orElse(null);
        }

        if (leadUser == null) return null;

        TeamMember leadTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(leadUser).orElse(null);
        LocalDate start = assignment != null ? assignment.getStartDate() : YearMonth.from(date).atDay(1);
        LocalDate end = assignment != null ? assignment.getEndDate() : YearMonth.from(date).atEndOfMonth();
        String periodLabel = start.format(DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH)) + " – " +
                             end.format(DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.ENGLISH));

        return CurrentLeadDto.builder()
                .userId(leadUser.getId())
                .name(leadUser.getName())
                .email(leadUser.getEmail())
                .position(leadTm != null && leadTm.getPosition() != null ? leadTm.getPosition() : "SDE Intern")
                .serialNumber(leadTm != null && leadTm.getSerialNumber() != null ? leadTm.getSerialNumber() : String.format("%s-%03d", team.getCrewIdPrefix(), leadUser.getId()))
                .startDate(start)
                .endDate(end)
                .periodLabel(periodLabel)
                .monthName(date.format(MONTH_FORMATTER))
                .isUserCurrentLead(userId != null && userId.equals(leadUser.getId()))
                .phoneNumber(leadUser.getPhoneNumber())
                .college(leadUser.getCollege())
                .organization(leadUser.getOrganization())
                .bio(leadUser.getBio())
                .githubUrl(leadUser.getGithubUrl())
                .linkedinUrl(leadUser.getLinkedinUrl())
                .build();
    }

    /**
     * Lists all chronological leadership assignments for a team.
     */
    @Transactional(readOnly = true)
    public List<LeadershipAssignmentDto> getLeadershipHistory(Long teamId) {
        if (teamId == null) {
            return Collections.emptyList();
        }
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) {
            return Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        List<LeadershipAssignment> list = assignmentRepository.findByTeamOrderByStartDateDesc(team);

        return list.stream().map(a -> {
            TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(a.getUser()).orElse(null);
            boolean isCurrent = !today.isBefore(a.getStartDate()) && !today.isAfter(a.getEndDate()) && "ACTIVE".equals(a.getStatus());
            return LeadershipAssignmentDto.builder()
                    .id(a.getId())
                    .teamId(a.getTeam().getId())
                    .teamName(a.getTeam().getFormattedDisplayName())
                    .userId(a.getUser().getId())
                    .userName(a.getUser().getName())
                    .userEmail(a.getUser().getEmail())
                    .serialNumber(tm != null && tm.getSerialNumber() != null ? tm.getSerialNumber() : String.format("%s-%03d", a.getTeam().getCrewIdPrefix(), a.getUser().getId()))
                    .position(tm != null && tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                    .startDate(a.getStartDate())
                    .endDate(a.getEndDate())
                    .monthLabel(a.getStartDate().format(MONTH_FORMATTER))
                    .notes(a.getNotes())
                    .status(a.getStatus())
                    .isCurrent(isCurrent)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Creates or updates a leadership assignment for a team member.
     */
    @Transactional
    public LeadershipAssignmentDto createLeadershipAssignment(Long assignerUserId, CreateLeadershipAssignmentRequest req) {
        User assigner = userRepository.findById(assignerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Assigner user not found"));
        TeamMember assignerTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(assigner)
                .orElseThrow(() -> new IllegalStateException("Assigner does not belong to any active team"));

        User targetUser = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + req.getUserId()));

        TeamMember targetTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(targetUser)
                .orElseThrow(() -> new IllegalArgumentException("Target user is not an active member of any team"));
        Team team = targetTm.getTeam();

        if (!assignerTm.getTeam().getId().equals(team.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to create leadership assignments for another team.");
        }

        if (req.getStartDate() == null || req.getEndDate() == null || req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("Invalid assignment date range");
        }

        LeadershipAssignment assignment = LeadershipAssignment.builder()
                .team(team)
                .user(targetUser)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .assignedBy(assigner)
                .notes(req.getNotes())
                .status("ACTIVE")
                .build();

        assignment = assignmentRepository.save(assignment);
        log.info("Leadership assignment scheduled: User {} for period {} to {}", targetUser.getName(), req.getStartDate(), req.getEndDate());

        LocalDate today = LocalDate.now();
        boolean isCurrent = !today.isBefore(assignment.getStartDate()) && !today.isAfter(assignment.getEndDate());

        return LeadershipAssignmentDto.builder()
                .id(assignment.getId())
                .teamId(team.getId())
                .teamName(team.getName())
                .userId(targetUser.getId())
                .userName(targetUser.getName())
                .userEmail(targetUser.getEmail())
                .serialNumber(targetTm.getSerialNumber())
                .position(targetTm.getPosition() != null ? targetTm.getPosition() : "SDE Intern")
                .startDate(assignment.getStartDate())
                .endDate(assignment.getEndDate())
                .monthLabel(assignment.getStartDate().format(MONTH_FORMATTER))
                .notes(assignment.getNotes())
                .status(assignment.getStatus())
                .isCurrent(isCurrent)
                .build();
    }
}
