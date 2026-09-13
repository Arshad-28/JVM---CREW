package com.jvmcrew.service;

import com.jvmcrew.dto.LeadMessageAnswerRequest;
import com.jvmcrew.dto.LeadMessageRequest;
import com.jvmcrew.dto.LeadMessageResponseDto;
import com.jvmcrew.model.LeadMessage;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LeadMessageRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeadMessageService {

    private final LeadMessageRepository leadMessageRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public LeadMessageResponseDto createMessage(Long userId, LeadMessageRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        TeamMember teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
        Team team = teamMember.getTeam();

        if (!StringUtils.hasText(request.getMessage())) {
            throw new IllegalArgumentException("Message content cannot be blank");
        }

        String inputMethod = "voice".equalsIgnoreCase(request.getInputMethod()) ? "voice" : "text";

        LeadMessage msg = LeadMessage.builder()
                .user(user)
                .team(team)
                .message(request.getMessage().trim())
                .inputMethod(inputMethod)
                .relatedTopic(request.getRelatedTopic())
                .isUrgent(Boolean.TRUE.equals(request.getIsUrgent()))
                .status("OPEN")
                .createdAt(Instant.now())
                .build();

        msg = leadMessageRepository.save(msg);
        return mapToDto(msg);
    }

    @Transactional(readOnly = true)
    public List<LeadMessageResponseDto> getMemberMessages(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));

        return leadMessageRepository.findByTeamOrderByCreatedAtDesc(tm.getTeam()).stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LeadMessageResponseDto> getTeamMessages(Long leadId) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + leadId));

        TeamMember teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));

        if (teamMember.getRole() != Role.LEAD && teamMember.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only Team Leads can view all team messages.");
        }

        Team team = teamMember.getTeam();

        return leadMessageRepository.findByTeamOrderByCreatedAtDesc(team).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeadMessageResponseDto respondToMessage(Long messageId, Long leadId, LeadMessageAnswerRequest request) {
        LeadMessage msg = leadMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found: " + messageId));

        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        TeamMember leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));

        if (leadMember.getRole() != Role.LEAD && leadMember.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only Team Leads can respond to messages.");
        }

        if (!leadMember.getTeam().getId().equals(msg.getTeam().getId())) {
            throw new AccessDeniedException("You are not authorized to respond to messages from another team.");
        }

        if (request == null || !StringUtils.hasText(request.getResponse())) {
            throw new IllegalArgumentException("Response cannot be blank");
        }

        msg.setLeadResponse(request.getResponse().trim());
        msg.setRespondedAt(Instant.now());
        msg.setStatus("ANSWERED");
        msg = leadMessageRepository.save(msg);

        return mapToDto(msg);
    }

    public LeadMessageResponseDto mapToDto(LeadMessage m) {
        return LeadMessageResponseDto.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .userName(m.getUser().getName())
                .userEmail(m.getUser().getEmail())
                .teamId(m.getTeam().getId())
                .message(m.getMessage())
                .inputMethod(m.getInputMethod())
                .relatedTopic(m.getRelatedTopic())
                .isUrgent(m.getIsUrgent())
                .status(m.getStatus())
                .leadResponse(m.getLeadResponse())
                .respondedAt(m.getRespondedAt())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
