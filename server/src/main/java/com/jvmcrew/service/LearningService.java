package com.jvmcrew.service;

import com.jvmcrew.dto.LearningTopicDto;
import com.jvmcrew.dto.SubjectProgressDto;
import com.jvmcrew.model.LearningProgress;
import com.jvmcrew.model.LearningTopic;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.LearningStatus;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LearningProgressRepository;
import com.jvmcrew.repository.LearningTopicRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private final LearningTopicRepository topicRepository;
    private final LearningProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public List<SubjectProgressDto> getCurriculumProgress(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        List<LearningTopic> allTopics = topicRepository.findAllByOrderByIdAsc();
        List<LearningProgress> userProgressList = progressRepository.findByUser(user);

        Map<Long, LearningProgress> progressMap = userProgressList.stream()
                .collect(Collectors.toMap(p -> p.getTopic().getId(), p -> p));

        // Group by subject in preserved insertion order
        Map<String, List<LearningTopic>> bySubject = allTopics.stream()
                .collect(Collectors.groupingBy(LearningTopic::getSubject, LinkedHashMap::new, Collectors.toList()));

        List<SubjectProgressDto> result = new ArrayList<>();

        for (Map.Entry<String, List<LearningTopic>> entry : bySubject.entrySet()) {
            String subject = entry.getKey();
            List<LearningTopic> topics = entry.getValue();

            // Sort topics within subject by orderIndex, then ID
            topics.sort(Comparator.comparing(LearningTopic::getOrderIndex).thenComparing(LearningTopic::getId));

            int total = topics.size();
            int done = 0;
            int inProgress = 0;
            int notStarted = 0;

            List<LearningTopicDto> topicDtos = new ArrayList<>();

            for (LearningTopic topic : topics) {
                LearningProgress progress = progressMap.get(topic.getId());
                LearningStatus status = progress != null ? progress.getStatus() : LearningStatus.NOT_STARTED;
                Instant completedAt = progress != null ? progress.getCompletedAt() : null;

                if (status == LearningStatus.DONE) {
                    done++;
                } else if (status == LearningStatus.IN_PROGRESS) {
                    inProgress++;
                } else {
                    notStarted++;
                }

                topicDtos.add(LearningTopicDto.builder()
                        .id(topic.getId())
                        .subject(topic.getSubject())
                        .parentId(topic.getParentId())
                        .title(topic.getTitle())
                        .orderIndex(topic.getOrderIndex())
                        .status(status)
                        .completedAt(completedAt)
                        .build());
            }

            int completionPct = total > 0 ? (done * 100) / total : 0;

            result.add(SubjectProgressDto.builder()
                    .subject(subject)
                    .totalTopics(total)
                    .doneTopics(done)
                    .inProgressTopics(inProgress)
                    .notStartedTopics(notStarted)
                    .completionPct(completionPct)
                    .topics(topicDtos)
                    .build());
        }

        return result;
    }

    @Transactional
    public LearningTopicDto updateProgress(Long userId, Long topicId, LearningStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        LearningTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + topicId));

        LearningProgress progress = progressRepository.findByUserAndTopic(user, topic)
                .orElseGet(() -> LearningProgress.builder()
                        .user(user)
                        .topic(topic)
                        .build());

        progress.setStatus(status);
        if (status == LearningStatus.DONE) {
            progress.setCompletedAt(Instant.now());
        } else {
            progress.setCompletedAt(null);
        }

        progress = progressRepository.save(progress);

        return LearningTopicDto.builder()
                .id(topic.getId())
                .subject(topic.getSubject())
                .parentId(topic.getParentId())
                .title(topic.getTitle())
                .orderIndex(topic.getOrderIndex())
                .status(progress.getStatus())
                .completedAt(progress.getCompletedAt())
                .build();
    }

    @Transactional
    public LearningTopicDto createTopic(Long userId, String subject, String title, Integer orderIndex) {
        validateLeadRole(userId);

        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Subject name cannot be blank");
        }
        if (!StringUtils.hasText(title)) {
            throw new IllegalArgumentException("Topic title cannot be blank");
        }

        int index = orderIndex != null ? orderIndex : (int) (topicRepository.findBySubjectOrderByOrderIndexAsc(subject.trim()).size() + 1);
        LearningTopic topic = topicRepository.save(LearningTopic.builder()
                .subject(subject.trim())
                .title(title.trim())
                .orderIndex(index)
                .build());

        return LearningTopicDto.builder()
                .id(topic.getId())
                .subject(topic.getSubject())
                .parentId(topic.getParentId())
                .title(topic.getTitle())
                .orderIndex(topic.getOrderIndex())
                .status(LearningStatus.NOT_STARTED)
                .build();
    }

    @Transactional
    public LearningTopicDto updateTopic(Long userId, Long topicId, String subject, String title, Integer orderIndex) {
        validateLeadRole(userId);

        LearningTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + topicId));

        if (StringUtils.hasText(subject)) {
            topic.setSubject(subject.trim());
        }
        if (StringUtils.hasText(title)) {
            topic.setTitle(title.trim());
        }
        if (orderIndex != null) {
            topic.setOrderIndex(orderIndex);
        }

        topic = topicRepository.save(topic);

        return LearningTopicDto.builder()
                .id(topic.getId())
                .subject(topic.getSubject())
                .parentId(topic.getParentId())
                .title(topic.getTitle())
                .orderIndex(topic.getOrderIndex())
                .status(LearningStatus.NOT_STARTED)
                .build();
    }

    @Transactional
    public void deleteTopic(Long userId, Long topicId) {
        validateLeadRole(userId);

        LearningTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Topic not found: " + topicId));

        // Clean up progress records first
        progressRepository.deleteByTopic(topic);
        topicRepository.delete(topic);
    }

    @Transactional
    public LearningTopicDto createSubject(Long userId, String subject, String initialTopicTitle) {
        validateLeadRole(userId);

        if (!StringUtils.hasText(subject)) {
            throw new IllegalArgumentException("Subject name cannot be blank");
        }
        String topicTitle = StringUtils.hasText(initialTopicTitle) ? initialTopicTitle.trim() : "Introduction to " + subject.trim();

        LearningTopic topic = topicRepository.save(LearningTopic.builder()
                .subject(subject.trim())
                .title(topicTitle)
                .orderIndex(1)
                .build());

        return LearningTopicDto.builder()
                .id(topic.getId())
                .subject(topic.getSubject())
                .parentId(topic.getParentId())
                .title(topic.getTitle())
                .orderIndex(topic.getOrderIndex())
                .status(LearningStatus.NOT_STARTED)
                .build();
    }

    private void validateLeadRole(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        boolean isLead = teamMemberRepository.findFirstByUserAndIsActiveTrue(user)
                .map(tm -> tm.getRole() == Role.LEAD)
                .orElse(false);

        if (!isLead) {
            throw new AccessDeniedException("Access Denied: Only team Leads can manage the curriculum");
        }
    }
}
