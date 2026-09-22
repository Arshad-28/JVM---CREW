package com.jvmcrew.service;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.CreateTeamMeetingRequest;
import com.jvmcrew.dto.TeamMeetingDto;
import com.jvmcrew.dto.UpdateTeamMeetingRequest;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMeeting;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.MeetingPlatform;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.TeamMeetingRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.TeamRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamMeetingService {

    private final TeamMeetingRepository meetingRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final LeadershipService leadershipService;

    @Transactional(readOnly = true)
    public List<TeamMeetingDto> getTeamMeetings(UserPrincipal principal) {
        Team team = resolveUserTeam(principal);
        LocalDate today = LocalDate.now();
        List<TeamMeeting> meetings = meetingRepository.findByTeamOrderByScheduledDateDescStartTimeDesc(team);
        return meetings.stream()
                .map(m -> mapToDto(m, today))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeamMeetingDto> getUpcomingMeetings(UserPrincipal principal) {
        Team team = resolveUserTeam(principal);
        LocalDate today = LocalDate.now();
        List<TeamMeeting> meetings = meetingRepository.findUpcomingMeetingsForTeam(team, today);
        return meetings.stream()
                .map(m -> mapToDto(m, today))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<TeamMeetingDto> getNextUpcomingMeeting(UserPrincipal principal) {
        Team team = resolveUserTeam(principal);
        LocalDate today = LocalDate.now();
        List<TeamMeeting> meetings = meetingRepository.findUpcomingMeetingsForTeam(team, today);
        if (meetings.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(mapToDto(meetings.get(0), today));
    }

    @Transactional
    public TeamMeetingDto createMeeting(UserPrincipal principal, CreateTeamMeetingRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        Team team = resolveUserTeam(principal);

        verifyLeadOrAdmin(user, team);

        String normalizedUrl = validateAndNormalizeMeetingUrl(request.getMeetingUrl());

        TeamMeeting meeting = TeamMeeting.builder()
                .team(team)
                .createdBy(user)
                .title(request.getTitle().trim())
                .platform(request.getPlatform() != null ? request.getPlatform() : MeetingPlatform.GOOGLE_MEET)
                .meetingUrl(normalizedUrl)
                .scheduledDate(request.getScheduledDate())
                .startTime(request.getStartTime().trim())
                .endTime(StringUtils.hasText(request.getEndTime()) ? request.getEndTime().trim() : null)
                .description(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null)
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        meeting = meetingRepository.save(meeting);
        log.info("Team meeting ID {} ('{}') created for Team ID {} by Lead ID {}",
                meeting.getId(), meeting.getTitle(), team.getId(), user.getId());

        return mapToDto(meeting, LocalDate.now());
    }

    @Transactional
    public TeamMeetingDto updateMeeting(UserPrincipal principal, Long meetingId, UpdateTeamMeetingRequest request) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        Team team = resolveUserTeam(principal);

        verifyLeadOrAdmin(user, team);

        TeamMeeting meeting = meetingRepository.findByIdAndTeam(meetingId, team)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found with ID " + meetingId + " in your team"));

        if (StringUtils.hasText(request.getTitle())) {
            meeting.setTitle(request.getTitle().trim());
        }
        if (request.getPlatform() != null) {
            meeting.setPlatform(request.getPlatform());
        }
        if (StringUtils.hasText(request.getMeetingUrl())) {
            meeting.setMeetingUrl(validateAndNormalizeMeetingUrl(request.getMeetingUrl()));
        }
        if (request.getScheduledDate() != null) {
            meeting.setScheduledDate(request.getScheduledDate());
        }
        if (StringUtils.hasText(request.getStartTime())) {
            meeting.setStartTime(request.getStartTime().trim());
        }
        if (request.getEndTime() != null) {
            meeting.setEndTime(request.getEndTime().trim().isEmpty() ? null : request.getEndTime().trim());
        }
        if (request.getDescription() != null) {
            meeting.setDescription(request.getDescription().trim().isEmpty() ? null : request.getDescription().trim());
        }
        if (request.getIsActive() != null) {
            meeting.setIsActive(request.getIsActive());
        }

        meeting.setUpdatedAt(Instant.now());
        meeting = meetingRepository.save(meeting);

        log.info("Team meeting ID {} updated for Team ID {} by Lead ID {}",
                meeting.getId(), team.getId(), user.getId());

        return mapToDto(meeting, LocalDate.now());
    }

    @Transactional
    public void deleteMeeting(UserPrincipal principal, Long meetingId) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        Team team = resolveUserTeam(principal);

        verifyLeadOrAdmin(user, team);

        TeamMeeting meeting = meetingRepository.findByIdAndTeam(meetingId, team)
                .orElseThrow(() -> new IllegalArgumentException("Meeting not found with ID " + meetingId + " in your team"));

        meetingRepository.delete(meeting);
        log.info("Team meeting ID {} deleted from Team ID {} by Lead ID {}",
                meetingId, team.getId(), user.getId());
    }

    private Team resolveUserTeam(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + principal.getId()));
        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
        return tm.getTeam();
    }

    private void verifyLeadOrAdmin(User user, Team team) {
        LocalDate today = LocalDate.now();
        boolean isLeadToday = leadershipService.isUserActiveLead(user, team, today);
        boolean isAdmin = false;

        TeamMember tm = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, user).orElse(null);
        if (tm != null && (tm.getRole() == Role.ADMIN || tm.getRole() == Role.LEAD)) {
            isAdmin = tm.getRole() == Role.ADMIN;
            if (tm.getRole() == Role.LEAD) {
                isLeadToday = true;
            }
        }

        if (!isLeadToday && !isAdmin) {
            throw new AccessDeniedException("Access denied: Only the current Team Lead or Admin can manage team meetings.");
        }
    }

    public static String validateAndNormalizeMeetingUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Meeting URL is required");
        }
        String trimmed = url.trim();
        String lower = trimmed.toLowerCase();

        // Reject unsafe protocols
        if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
            throw new IllegalArgumentException("Invalid URL protocol");
        }

        if (!lower.startsWith("https://")) {
            if (lower.startsWith("http://")) {
                trimmed = "https://" + trimmed.substring(7);
            } else {
                trimmed = "https://" + trimmed;
            }
        }

        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme();
            if (scheme == null || !scheme.equalsIgnoreCase("https")) {
                throw new IllegalArgumentException("Meeting URL must use secure HTTPS protocol");
            }
            if (uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException("Invalid meeting URL host");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid meeting URL: " + url);
        }

        return trimmed;
    }

    private TeamMeetingDto mapToDto(TeamMeeting m, LocalDate today) {
        boolean isUpcoming = m.getIsActive() != null && m.getIsActive() &&
                (m.getScheduledDate().isAfter(today) || m.getScheduledDate().isEqual(today));

        return TeamMeetingDto.builder()
                .id(m.getId())
                .teamId(m.getTeam().getId())
                .teamName(m.getTeam().getFormattedDisplayName())
                .createdById(m.getCreatedBy() != null ? m.getCreatedBy().getId() : null)
                .createdByName(m.getCreatedBy() != null ? m.getCreatedBy().getName() : "Team Lead")
                .title(m.getTitle())
                .platform(m.getPlatform())
                .meetingUrl(m.getMeetingUrl())
                .scheduledDate(m.getScheduledDate())
                .startTime(m.getStartTime())
                .endTime(m.getEndTime())
                .description(m.getDescription())
                .isActive(m.getIsActive())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .isUpcoming(isUpcoming)
                .build();
    }
}
