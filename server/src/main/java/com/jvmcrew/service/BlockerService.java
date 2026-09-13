package com.jvmcrew.service;

import com.jvmcrew.dto.BlockerResponse;
import com.jvmcrew.model.Blocker;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.BlockerStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.BlockerRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlockerService {

    private final BlockerRepository blockerRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public List<BlockerResponse> getOpenBlockers(Long teamId, Long requesterId) {
        Long effectiveTeamId = teamId;
        if (effectiveTeamId == null && requesterId != null) {
            User requester = userRepository.findById(requesterId).orElse(null);
            if (requester != null) {
                effectiveTeamId = teamMemberRepository.findFirstByUserAndIsActiveTrue(requester)
                        .map(tm -> tm.getTeam().getId())
                        .orElse(null);
            }
        }

        if (effectiveTeamId == null) {
            return Collections.emptyList();
        }

        return blockerRepository.findByTeamIdAndStatusOrderByCreatedAtDesc(effectiveTeamId, BlockerStatus.OPEN).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BlockerResponse updateBlockerStatus(Long blockerId, BlockerStatus status, Long resolvedByUserId) {
        Blocker blocker = blockerRepository.findById(blockerId)
                .orElseThrow(() -> new IllegalArgumentException("Blocker not found: " + blockerId));

        if (resolvedByUserId != null) {
            User resolver = userRepository.findById(resolvedByUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Resolver not found: " + resolvedByUserId));
            TeamMember resolverTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(resolver)
                    .orElseThrow(() -> new IllegalStateException("Resolver does not belong to any active team"));

            boolean isOwner = blocker.getUser().getId().equals(resolvedByUserId);
            boolean isLeadOfTeam = resolverTm.getRole() == Role.LEAD && blocker.getTeam() != null && blocker.getTeam().getId().equals(resolverTm.getTeam().getId());

            if (!isOwner && !isLeadOfTeam) {
                throw new AccessDeniedException("You are not authorized to update blockers for another team.");
            }

            blocker.setStatus(status);
            if (status == BlockerStatus.RESOLVED) {
                blocker.setResolvedAt(Instant.now());
                blocker.setAssignedTo(resolver);
            } else {
                blocker.setResolvedAt(null);
            }
        } else {
            blocker.setStatus(status);
            if (status == BlockerStatus.RESOLVED) {
                blocker.setResolvedAt(Instant.now());
            } else {
                blocker.setResolvedAt(null);
            }
        }

        blocker = blockerRepository.save(blocker);
        return mapToResponse(blocker);
    }

    public BlockerResponse mapToResponse(Blocker b) {
        return BlockerResponse.builder()
                .id(b.getId())
                .standupId(b.getStandup() != null ? b.getStandup().getId() : null)
                .userId(b.getUser().getId())
                .userName(b.getUser().getName())
                .title(b.getTitle())
                .category(b.getCategory())
                .priority(b.getPriority())
                .description(b.getDescription())
                .status(b.getStatus())
                .assignedToId(b.getAssignedTo() != null ? b.getAssignedTo().getId() : null)
                .assignedToName(b.getAssignedTo() != null ? b.getAssignedTo().getName() : null)
                .createdAt(b.getCreatedAt())
                .resolvedAt(b.getResolvedAt())
                .build();
    }
}
