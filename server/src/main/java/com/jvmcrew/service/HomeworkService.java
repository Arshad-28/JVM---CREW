package com.jvmcrew.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jvmcrew.dto.*;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeworkService {

    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final HomeworkReminderRepository homeworkReminderRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final LeadershipService leadershipService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<HomeworkResponse> getHomeworkList(Long userId, LocalDate targetDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        var teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
        Team team = teamMember.getTeam();
        boolean isLead = teamMember.getRole() == Role.LEAD;

        LocalDate today = targetDate != null ? targetDate : LocalDate.now();

        List<Homework> homeworkList;
        if (isLead) {
            homeworkList = homeworkRepository.findByTeamOrderByCreatedAtDesc(team);
        } else {
            homeworkList = homeworkRepository.findByTeamAndIsPublishedTrueOrderByCreatedAtDesc(team);
        }

        // Subordinate team members (excluding Lead)
        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(team).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        return homeworkList.stream()
                .map(hw -> mapToResponse(hw, user, isLead, teamMembers, today))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HomeworkResponse getHomeworkById(Long homeworkId, Long userId, LocalDate targetDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .orElseThrow(() -> new IllegalStateException("User does not belong to any active team"));
        Team team = teamMember.getTeam();

        if (!hw.getTeam().getId().equals(team.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized access to homework from another team");
        }

        boolean isLead = teamMember.getRole() == Role.LEAD;
        if (!isLead && !Boolean.TRUE.equals(hw.getIsPublished())) {
            throw new IllegalArgumentException("Homework is not published");
        }

        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(team).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        LocalDate today = targetDate != null ? targetDate : LocalDate.now();
        return mapToResponse(hw, user, isLead, teamMembers, today);
    }

    @Transactional
    public HomeworkResponse createHomework(Long leadId, HomeworkRequest request) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        var teamMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        Team team = teamMember.getTeam();

        if (!StringUtils.hasText(request.getTitle())) {
            throw new IllegalArgumentException("Homework title cannot be blank");
        }

        String questionsJson = "[]";
        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            try {
                questionsJson = objectMapper.writeValueAsString(request.getQuestions());
            } catch (Exception e) {
                questionsJson = "[]";
            }
        }

        boolean publishNow = Boolean.TRUE.equals(request.getPublishNow()) || Boolean.TRUE.equals(request.getIsPublished());
        Instant now = Instant.now();

        Homework hw = Homework.builder()
                .team(team)
                .creator(lead)
                .title(request.getTitle().trim())
                .subjectTopic(StringUtils.hasText(request.getSubjectTopic()) ? request.getSubjectTopic().trim() : "General Classwork")
                .questionsJson(questionsJson)
                .instructions(request.getInstructions())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(3))
                .attachmentName(request.getAttachmentName())
                .attachmentData(request.getAttachmentData())
                .attachmentType(request.getAttachmentType())
                .solutionText(request.getSolutionText())
                .solutionAttachmentName(request.getSolutionAttachmentName())
                .solutionAttachmentData(request.getSolutionAttachmentData())
                .solutionAttachmentType(request.getSolutionAttachmentType())
                .isPublished(publishNow)
                .publishedAt(publishNow ? now : null)
                .isSolutionPublished(false)
                .createdAt(now)
                .updatedAt(now)
                .build();

        hw = homeworkRepository.save(hw);

        if (publishNow) {
            notificationService.notifyHomeworkPublished(hw, lead);
        }

        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(team).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        return mapToResponse(hw, lead, true, teamMembers, LocalDate.now());
    }

    @Transactional
    public HomeworkResponse updateHomework(Long homeworkId, Long leadId, HomeworkRequest request) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        if (!hw.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to modify homework from another team");
        }

        if (!StringUtils.hasText(request.getTitle())) {
            throw new IllegalArgumentException("Homework title cannot be blank");
        }

        String questionsJson = hw.getQuestionsJson();
        if (request.getQuestions() != null) {
            try {
                questionsJson = objectMapper.writeValueAsString(request.getQuestions());
            } catch (Exception e) {
                // keep existing
            }
        }

        hw.setTitle(request.getTitle().trim());
        if (StringUtils.hasText(request.getSubjectTopic())) {
            hw.setSubjectTopic(request.getSubjectTopic().trim());
        }
        hw.setQuestionsJson(questionsJson);
        hw.setInstructions(request.getInstructions());
        
        LocalDate oldDueDate = hw.getDueDate();
        boolean dueDateChanged = false;
        if (request.getDueDate() != null && !request.getDueDate().equals(oldDueDate)) {
            hw.setDueDate(request.getDueDate());
            dueDateChanged = true;
        }
        if (request.getAttachmentName() != null) {
            hw.setAttachmentName(request.getAttachmentName());
            hw.setAttachmentData(request.getAttachmentData());
            hw.setAttachmentType(request.getAttachmentType());
        }
        if (request.getSolutionText() != null) {
            hw.setSolutionText(request.getSolutionText());
        }
        if (request.getSolutionAttachmentName() != null) {
            hw.setSolutionAttachmentName(request.getSolutionAttachmentName());
            hw.setSolutionAttachmentData(request.getSolutionAttachmentData());
            hw.setSolutionAttachmentType(request.getSolutionAttachmentType());
        }

        boolean newlyPublished = false;
        if (Boolean.TRUE.equals(request.getPublishNow()) && !Boolean.TRUE.equals(hw.getIsPublished())) {
            hw.setIsPublished(true);
            hw.setPublishedAt(Instant.now());
            newlyPublished = true;
        }

        hw.setUpdatedAt(Instant.now());
        hw = homeworkRepository.save(hw);

        if (newlyPublished) {
            notificationService.notifyHomeworkPublished(hw, lead);
        } else if (dueDateChanged && Boolean.TRUE.equals(hw.getIsPublished())) {
            notificationService.notifyHomeworkDeadlineChanged(hw, oldDueDate);
        }

        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(hw.getTeam()).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        return mapToResponse(hw, lead, true, teamMembers, LocalDate.now());
    }

    @Transactional
    public HomeworkResponse publishHomework(Long homeworkId, Long leadId) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        if (!hw.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to publish homework from another team");
        }

        hw.setIsPublished(true);
        hw.setPublishedAt(Instant.now());
        hw.setUpdatedAt(Instant.now());
        hw = homeworkRepository.save(hw);

        notificationService.notifyHomeworkPublished(hw, lead);

        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(hw.getTeam()).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        return mapToResponse(hw, lead, true, teamMembers, LocalDate.now());
    }

    @Transactional
    public HomeworkResponse publishSolution(Long homeworkId, Long leadId, PublishSolutionRequest request) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        if (!hw.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to publish solution for another team's homework");
        }

        if (request != null) {
            if (StringUtils.hasText(request.getSolutionText())) {
                hw.setSolutionText(request.getSolutionText().trim());
            }
            if (StringUtils.hasText(request.getSolutionAttachmentName())) {
                hw.setSolutionAttachmentName(request.getSolutionAttachmentName());
                hw.setSolutionAttachmentData(request.getSolutionAttachmentData());
                hw.setSolutionAttachmentType(request.getSolutionAttachmentType());
            }
        }

        hw.setIsSolutionPublished(true);
        hw.setSolutionPublishedAt(Instant.now());
        hw.setUpdatedAt(Instant.now());
        hw = homeworkRepository.save(hw);

        notificationService.notifyHomeworkSolutionPublished(hw);

        hw.setIsSolutionPublished(true);
        hw.setSolutionPublishedAt(Instant.now());
        hw.setUpdatedAt(Instant.now());
        hw = homeworkRepository.save(hw);

        List<TeamMember> teamMembers = teamMemberRepository.findByTeam(hw.getTeam()).stream()
                .filter(tm -> tm.getRole() != Role.LEAD)
                .collect(Collectors.toList());

        return mapToResponse(hw, lead, true, teamMembers, LocalDate.now());
    }

    @Transactional
    public HomeworkSubmissionResponse submitHomework(Long homeworkId, Long memberId, HomeworkSubmissionRequest request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var memberTm = teamMemberRepository.findFirstByUserAndIsActiveTrue(member)
                .orElseThrow(() -> new IllegalStateException("Member is not active in any team"));
        if (!hw.getTeam().getId().equals(memberTm.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to submit homework for another team");
        }

        if (!Boolean.TRUE.equals(hw.getIsPublished())) {
            throw new IllegalStateException("Cannot submit to an unpublished homework");
        }

        if (!StringUtils.hasText(request.getAnswerText()) && !StringUtils.hasText(request.getAttachmentData())) {
            throw new IllegalArgumentException("Please provide a typed answer or upload an attachment file");
        }

        Optional<HomeworkSubmission> existingOpt = homeworkSubmissionRepository.findByHomeworkAndUser(hw, member);
        HomeworkSubmission sub;

        if (existingOpt.isPresent()) {
            sub = existingOpt.get();
            sub.setAnswerText(request.getAnswerText());
            if (StringUtils.hasText(request.getAttachmentName())) {
                sub.setAttachmentName(request.getAttachmentName());
                sub.setAttachmentData(request.getAttachmentData());
                sub.setAttachmentType(request.getAttachmentType());
            }
            sub.setNotes(request.getNotes());
            sub.setStatus("SUBMITTED");
            sub.setSubmittedAt(Instant.now());
        } else {
            sub = HomeworkSubmission.builder()
                    .homework(hw)
                    .user(member)
                    .team(hw.getTeam())
                    .answerText(request.getAnswerText())
                    .attachmentName(request.getAttachmentName())
                    .attachmentData(request.getAttachmentData())
                    .attachmentType(request.getAttachmentType())
                    .notes(request.getNotes())
                    .status("SUBMITTED")
                    .submittedAt(Instant.now())
                    .build();
        }

        sub = homeworkSubmissionRepository.save(sub);
        return mapToSubmissionDto(sub);
    }

    @Transactional
    public HomeworkSubmissionResponse reviewSubmission(Long submissionId, Long leadId, ReviewSubmissionRequest request) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));

        HomeworkSubmission sub = homeworkSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));

        var leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        if (!sub.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to review submission from another team");
        }

        sub.setStatus("REVIEWED");
        sub.setReviewedAt(Instant.now());
        if (request != null && StringUtils.hasText(request.getFeedback())) {
            sub.setLeadFeedback(request.getFeedback().trim());
        }
        sub = homeworkSubmissionRepository.save(sub);
        notificationService.notifyHomeworkReviewed(sub, lead);

        return mapToSubmissionDto(sub);
    }

    @Transactional
    public boolean remindMember(Long homeworkId, Long leadId, Long targetUserId) {
        User lead = userRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found: " + leadId));
        User member = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetUserId));
        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(lead)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));
        if (!hw.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized to send reminders for another team's homework");
        }

        var targetMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(member)
                .orElseThrow(() -> new IllegalStateException("Target member is not active in any team"));
        if (!targetMember.getTeam().getId().equals(leadMember.getTeam().getId())) {
            throw new IllegalArgumentException("Target user is not a member of your team");
        }

        HomeworkReminder reminder = HomeworkReminder.builder()
                .homework(hw)
                .user(member)
                .lead(lead)
                .message("Reminder: Please submit your homework for \"" + hw.getTitle() + "\" (Due " + hw.getDueDate() + ")")
                .sentAt(Instant.now())
                .isRead(false)
                .build();

        homeworkReminderRepository.save(reminder);
        return true;
    }

    private HomeworkResponse mapToResponse(Homework hw, User currentUser, boolean isLead, List<TeamMember> teamMembers, LocalDate today) {
        List<String> questions = new ArrayList<>();
        if (StringUtils.hasText(hw.getQuestionsJson())) {
            try {
                questions = objectMapper.readValue(hw.getQuestionsJson(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                questions = List.of(hw.getQuestionsJson());
            }
        }

        boolean isOverdue = today.isAfter(hw.getDueDate());

        List<HomeworkSubmission> allSubmissions = homeworkSubmissionRepository.findByHomework(hw);
        Map<Long, HomeworkSubmission> subByUser = allSubmissions.stream()
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s));

        int totalMembersCount = teamMembers.size();
        int submittedCount = allSubmissions.size();
        int reviewedCount = (int) allSubmissions.stream().filter(s -> "REVIEWED".equalsIgnoreCase(s.getStatus())).count();
        int pendingCount = Math.max(0, totalMembersCount - submittedCount);

        HomeworkSubmission mySub = subByUser.get(currentUser.getId());
        HomeworkSubmissionResponse mySubmissionDto = mySub != null ? mapToSubmissionDto(mySub) : null;

        String myStatus;
        if (mySub != null) {
            myStatus = "REVIEWED".equalsIgnoreCase(mySub.getStatus()) ? "Reviewed" : "Submitted";
        } else {
            myStatus = isOverdue ? "Overdue" : "Pending";
        }

        boolean isReminded = !homeworkReminderRepository.findByHomeworkAndUser(hw, currentUser).isEmpty();

        List<MemberHomeworkStatusDto> memberStatuses = new ArrayList<>();
        if (isLead) {
            for (TeamMember tm : teamMembers) {
                User u = tm.getUser();
                HomeworkSubmission s = subByUser.get(u.getId());
                boolean hasSubmitted = s != null;
                boolean isRev = hasSubmitted && "REVIEWED".equalsIgnoreCase(s.getStatus());
                String status;
                if (hasSubmitted) {
                    status = isRev ? "Reviewed" : "Submitted";
                } else {
                    status = isOverdue ? "Overdue" : "Pending";
                }

                boolean memberReminded = !homeworkReminderRepository.findByHomeworkAndUser(hw, u).isEmpty();

                memberStatuses.add(MemberHomeworkStatusDto.builder()
                        .userId(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .status(status)
                        .isSubmitted(hasSubmitted)
                        .isReviewed(isRev)
                        .submittedAt(hasSubmitted ? s.getSubmittedAt() : null)
                        .submissionId(hasSubmitted ? s.getId() : null)
                        .answerText(hasSubmitted ? s.getAnswerText() : null)
                        .attachmentName(hasSubmitted ? s.getAttachmentName() : null)
                        .attachmentData(hasSubmitted ? s.getAttachmentData() : null)
                        .attachmentType(hasSubmitted ? s.getAttachmentType() : null)
                        .notes(hasSubmitted ? s.getNotes() : null)
                        .leadFeedback(hasSubmitted ? s.getLeadFeedback() : null)
                        .isReminded(memberReminded)
                        .build());
            }
        }

        // Hide solution from members if solution is not published yet
        boolean canSeeSolution = isLead || Boolean.TRUE.equals(hw.getIsSolutionPublished());
        String solText = canSeeSolution ? hw.getSolutionText() : null;
        String solAttName = canSeeSolution ? hw.getSolutionAttachmentName() : null;
        String solAttData = canSeeSolution ? hw.getSolutionAttachmentData() : null;
        String solAttType = canSeeSolution ? hw.getSolutionAttachmentType() : null;

        return HomeworkResponse.builder()
                .id(hw.getId())
                .teamId(hw.getTeam().getId())
                .teamName(hw.getTeam().getName())
                .creatorId(hw.getCreator().getId())
                .creatorName(hw.getCreator().getName())
                .title(hw.getTitle())
                .subjectTopic(hw.getSubjectTopic())
                .questions(questions)
                .instructions(hw.getInstructions())
                .dueDate(hw.getDueDate())
                .isOverdue(isOverdue)
                .attachmentName(hw.getAttachmentName())
                .attachmentData(hw.getAttachmentData())
                .attachmentType(hw.getAttachmentType())
                .solutionText(solText)
                .solutionAttachmentName(solAttName)
                .solutionAttachmentData(solAttData)
                .solutionAttachmentType(solAttType)
                .isPublished(hw.getIsPublished())
                .publishedAt(hw.getPublishedAt())
                .isSolutionPublished(hw.getIsSolutionPublished())
                .solutionPublishedAt(hw.getSolutionPublishedAt())
                .createdAt(hw.getCreatedAt())
                .totalMembers(totalMembersCount)
                .submittedCount(submittedCount)
                .reviewedCount(reviewedCount)
                .pendingCount(pendingCount)
                .mySubmission(mySubmissionDto)
                .myStatus(myStatus)
                .isReminded(isReminded)
                .memberSubmissions(memberStatuses)
                .build();
    }

    @Transactional
    public void deleteHomework(Long homeworkId, Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Homework hw = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new IllegalArgumentException("Homework not found: " + homeworkId));

        var teamMemberOpt = teamMemberRepository.findFirstByUserAndIsActiveTrue(user);
        if (teamMemberOpt.isEmpty()) {
            throw new IllegalStateException("User does not belong to any active team");
        }

        Team userTeam = teamMemberOpt.get().getTeam();
        if (!hw.getTeam().getId().equals(userTeam.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not authorized to delete homework from another team.");
        }

        verifyLeadAuthorization(user, hw.getTeam());

        List<HomeworkSubmission> submissions = homeworkSubmissionRepository.findByHomework(hw);
        if (!submissions.isEmpty()) {
            homeworkSubmissionRepository.deleteAll(submissions);
        }

        List<HomeworkReminder> reminders = homeworkReminderRepository.findByHomework(hw);
        if (!reminders.isEmpty()) {
            homeworkReminderRepository.deleteAll(reminders);
        }

        homeworkRepository.delete(hw);
    }

    private void verifyLeadAuthorization(User user, Team team) {
        if (user == null || team == null) {
            throw new org.springframework.security.access.AccessDeniedException("Authentication and valid team required.");
        }
        boolean isLeadToday = leadershipService.isUserActiveLead(user, team, LocalDate.now());
        var membershipOpt = teamMemberRepository.findByTeamAndUserAndIsActiveTrue(team, user);
        if (isLeadToday || (membershipOpt.isPresent() && (membershipOpt.get().getRole() == Role.LEAD || membershipOpt.get().getRole() == Role.ADMIN))) {
            return;
        }
        throw new org.springframework.security.access.AccessDeniedException("Only the active Lead of " + team.getFormattedDisplayName() + " can delete homework.");
    }

    private HomeworkSubmissionResponse mapToSubmissionDto(HomeworkSubmission s) {
        return HomeworkSubmissionResponse.builder()
                .id(s.getId())
                .homeworkId(s.getHomework().getId())
                .userId(s.getUser().getId())
                .userName(s.getUser().getName())
                .userEmail(s.getUser().getEmail())
                .answerText(s.getAnswerText())
                .attachmentName(s.getAttachmentName())
                .attachmentData(s.getAttachmentData())
                .attachmentType(s.getAttachmentType())
                .notes(s.getNotes())
                .status(s.getStatus())
                .leadFeedback(s.getLeadFeedback())
                .submittedAt(s.getSubmittedAt())
                .reviewedAt(s.getReviewedAt())
                .build();
    }
}
