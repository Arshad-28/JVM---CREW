package com.jvmcrew.service;

import com.jvmcrew.dto.TeamMemberStreakDto;
import com.jvmcrew.dto.UserStreakDto;
import com.jvmcrew.model.*;
import com.jvmcrew.model.enums.AttemptStatus;
import com.jvmcrew.model.enums.LearningStatus;
import com.jvmcrew.model.enums.TaskStatus;
import com.jvmcrew.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StreakService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final StandupRepository standupRepository;
    private final HomeworkSubmissionRepository homeworkSubmissionRepository;
    private final TaskRepository taskRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final LearningProgressRepository learningProgressRepository;

    private static final ZoneId APP_ZONE_ID = ZoneId.systemDefault();

    /**
     * Calculates detailed real activity streak for a specific user as of a target date.
     */
    @Transactional(readOnly = true)
    public UserStreakDto getUserStreak(User user, LocalDate targetDate) {
        LocalDate today = targetDate != null ? targetDate : LocalDate.now(APP_ZONE_ID);
        Map<LocalDate, List<String>> dailyActivities = getDailyActivities(user);
        return buildStreakDtoFromActivities(user, dailyActivities, today);
    }

    /**
     * Batch calculation of real activity streaks for multiple users in a single operation.
     * Executes at most 5 batch queries across the entire team, reducing 50+ DB round-trips to 5.
     */
    @Transactional(readOnly = true)
    public Map<Long, UserStreakDto> getBatchUserStreaks(List<User> users, LocalDate targetDate) {
        if (users == null || users.isEmpty()) {
            return Collections.emptyMap();
        }

        LocalDate today = targetDate != null ? targetDate : LocalDate.now(APP_ZONE_ID);

        // Map of UserId -> Date -> Activities
        Map<Long, Map<LocalDate, List<String>>> userDailyActivities = new HashMap<>();
        for (User u : users) {
            userDailyActivities.put(u.getId(), new HashMap<>());
        }

        // 1. Batch Standups
        List<Standup> standups = standupRepository.findByUserInOrderByDateDesc(users);
        for (Standup s : standups) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getDate() != null && s.getUser() != null) {
                Long uid = s.getUser().getId();
                Map<LocalDate, List<String>> userMap = userDailyActivities.get(uid);
                if (userMap != null) {
                    String desc = (s.getSubmissionType() != null && s.getSubmissionType().equals("VOICE"))
                            ? "Voice Standup (" + (s.getAudioDurationSeconds() != null ? s.getAudioDurationSeconds() + "s" : "Recorded") + ")"
                            : "Daily Standup";
                    userMap.computeIfAbsent(s.getDate(), k -> new ArrayList<>()).add(desc);
                }
            }
        }

        // 2. Batch Homework Submissions
        List<HomeworkSubmission> homeworks = homeworkSubmissionRepository.findByUserInOrderBySubmittedAtDesc(users);
        for (HomeworkSubmission hw : homeworks) {
            if (hw.getSubmittedAt() != null && hw.getUser() != null) {
                Long uid = hw.getUser().getId();
                Map<LocalDate, List<String>> userMap = userDailyActivities.get(uid);
                if (userMap != null) {
                    LocalDate d = hw.getSubmittedAt().atZone(APP_ZONE_ID).toLocalDate();
                    String title = hw.getHomework() != null ? hw.getHomework().getTitle() : "Homework Assignment";
                    userMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Submitted Homework: " + title);
                }
            }
        }

        // 3. Batch Completed Tasks
        List<Task> tasks = taskRepository.findByAssigneeInOrderByCreatedAtDesc(users);
        for (Task t : tasks) {
            if (t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null && t.getAssignee() != null) {
                Long uid = t.getAssignee().getId();
                Map<LocalDate, List<String>> userMap = userDailyActivities.get(uid);
                if (userMap != null) {
                    LocalDate d = t.getCreatedAt().atZone(APP_ZONE_ID).toLocalDate();
                    userMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Completed Task: " + t.getTitle());
                }
            }
        }

        // 4. Batch Problem Attempts
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUserIn(users);
        for (ProblemAttempt pa : attempts) {
            if (pa.getStatus() == AttemptStatus.SOLVED && pa.getSolvedAt() != null && pa.getUser() != null) {
                Long uid = pa.getUser().getId();
                Map<LocalDate, List<String>> userMap = userDailyActivities.get(uid);
                if (userMap != null) {
                    LocalDate d = pa.getSolvedAt().atZone(APP_ZONE_ID).toLocalDate();
                    String pTitle = pa.getProblem() != null ? pa.getProblem().getName() : "Algorithm Problem";
                    userMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Solved Problem: " + pTitle);
                }
            }
        }

        // 5. Batch Learning Progress
        List<LearningProgress> progresses = learningProgressRepository.findByUserIn(users);
        for (LearningProgress lp : progresses) {
            if (lp.getStatus() == LearningStatus.DONE && lp.getCompletedAt() != null && lp.getUser() != null) {
                Long uid = lp.getUser().getId();
                Map<LocalDate, List<String>> userMap = userDailyActivities.get(uid);
                if (userMap != null) {
                    LocalDate d = lp.getCompletedAt().atZone(APP_ZONE_ID).toLocalDate();
                    String tTitle = lp.getTopic() != null ? lp.getTopic().getTitle() : "Learning Topic";
                    userMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Completed Topic: " + tTitle);
                }
            }
        }

        // Build UserStreakDto for each user in memory
        Map<Long, UserStreakDto> resultMap = new HashMap<>();
        for (User u : users) {
            Map<LocalDate, List<String>> dailyActivities = userDailyActivities.getOrDefault(u.getId(), Collections.emptyMap());
            resultMap.put(u.getId(), buildStreakDtoFromActivities(u, dailyActivities, today));
        }

        return resultMap;
    }

    private UserStreakDto buildStreakDtoFromActivities(User user, Map<LocalDate, List<String>> dailyActivities, LocalDate today) {
        Set<LocalDate> activeDates = dailyActivities.keySet();

        boolean hasActivityToday = activeDates.contains(today);
        List<String> todayActivities = dailyActivities.getOrDefault(today, Collections.emptyList());
        int todayActivityCount = todayActivities.size();

        // 1. Calculate Current Streak
        int currentStreak = 0;
        if (hasActivityToday) {
            currentStreak = 1;
            int offset = 1;
            while (activeDates.contains(today.minusDays(offset))) {
                currentStreak++;
                offset++;
            }
        } else {
            LocalDate yesterday = today.minusDays(1);
            if (activeDates.contains(yesterday)) {
                currentStreak = 1;
                int offset = 1;
                while (activeDates.contains(yesterday.minusDays(offset))) {
                    currentStreak++;
                    offset++;
                }
            } else {
                currentStreak = 0;
            }
        }

        // 2. Calculate Longest Streak
        int longestStreak = calculateLongestStreak(activeDates);
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // 3. Find Last Active Date
        LocalDate lastActiveDate = activeDates.stream()
                .filter(d -> !d.isAfter(today))
                .max(LocalDate::compareTo)
                .orElse(null);

        // 4. Last 14 days active dates for visual calendar dots
        List<LocalDate> recentActiveDates = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            if (activeDates.contains(d)) {
                recentActiveDates.add(d);
            }
        }

        // 5. Status Message
        String statusMsg;
        if (hasActivityToday) {
            statusMsg = "✓ Standup completed today";
        } else if (currentStreak > 0) {
            statusMsg = "Waiting for today's standup";
        } else {
            statusMsg = "Start your standup streak today";
        }

        TeamMember tm = teamMemberRepository.findFirstByUserAndIsActiveTrue(user).orElse(null);
        String serialNumber = tm != null && tm.getSerialNumber() != null
                ? tm.getSerialNumber()
                : (tm != null && tm.getTeam() != null ? String.format("%s-%03d", tm.getTeam().getCrewIdPrefix(), user.getId()) : "MEMBER");

        return UserStreakDto.builder()
                .userId(user.getId())
                .userName(user.getName())
                .serialNumber(serialNumber)
                .currentStreak(currentStreak)
                .longestStreak(longestStreak)
                .hasActivityToday(hasActivityToday)
                .todayActivityCount(todayActivityCount)
                .lastActiveDate(lastActiveDate)
                .todayActivities(todayActivities)
                .recentActiveDates(recentActiveDates)
                .statusMessage(statusMsg)
                .build();
    }

    /**
     * Retrieves streak details for all members of the Lead's team.
     */
    @Transactional(readOnly = true)
    public List<TeamMemberStreakDto> getTeamStreaksForLead(Long leadUserId, LocalDate targetDate) {
        User leadUser = userRepository.findById(leadUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + leadUserId));

        TeamMember leadMember = teamMemberRepository.findFirstByUserAndIsActiveTrue(leadUser)
                .orElseThrow(() -> new IllegalStateException("Lead does not belong to any active team"));

        Team team = leadMember.getTeam();
        List<TeamMember> members = teamMemberRepository.findByTeamAndIsActiveTrueOrderByJoinedAtAsc(team);

        LocalDate today = targetDate != null ? targetDate : LocalDate.now(APP_ZONE_ID);

        List<User> userList = members.stream().map(TeamMember::getUser).collect(Collectors.toList());
        Map<Long, UserStreakDto> streakMap = getBatchUserStreaks(userList, today);

        List<TeamMemberStreakDto> result = new ArrayList<>();
        for (TeamMember tm : members) {
            User u = tm.getUser();
            UserStreakDto streak = streakMap.getOrDefault(u.getId(), UserStreakDto.builder().currentStreak(0).longestStreak(0).build());

            result.add(TeamMemberStreakDto.builder()
                    .userId(u.getId())
                    .name(u.getName())
                    .serialNumber(tm.getSerialNumber() != null ? tm.getSerialNumber() : String.format("%s-%03d", team.getCrewIdPrefix(), u.getId()))
                    .role(tm.getRole().name())
                    .position(tm.getPosition() != null ? tm.getPosition() : "SDE Intern")
                    .currentStreak(streak.getCurrentStreak())
                    .longestStreak(streak.getLongestStreak())
                    .hasActivityToday(streak.isHasActivityToday())
                    .todayActivityCount(streak.getTodayActivityCount())
                    .lastActiveDate(streak.getLastActiveDate())
                    .statusMessage(streak.getStatusMessage())
                    .build());
        }

        return result;
    }

    /**
     * Gathers all real qualifying activities for a user grouped by calendar date.
     */
    public Map<LocalDate, List<String>> getDailyActivities(User user) {
        Map<LocalDate, List<String>> dateMap = new HashMap<>();

        // 1. Standups (text or voice)
        List<Standup> standups = standupRepository.findByUserOrderByDateDesc(user);
        for (Standup s : standups) {
            if (Boolean.TRUE.equals(s.getIsCompleted()) && s.getDate() != null) {
                String desc = (s.getSubmissionType() != null && s.getSubmissionType().equals("VOICE"))
                        ? "Voice Standup (" + (s.getAudioDurationSeconds() != null ? s.getAudioDurationSeconds() + "s" : "Recorded") + ")"
                        : "Daily Standup";
                dateMap.computeIfAbsent(s.getDate(), k -> new ArrayList<>()).add(desc);
            }
        }

        // 2. Homework Submissions
        List<HomeworkSubmission> homeworks = homeworkSubmissionRepository.findByUserOrderBySubmittedAtDesc(user);
        for (HomeworkSubmission hw : homeworks) {
            if (hw.getSubmittedAt() != null) {
                LocalDate d = hw.getSubmittedAt().atZone(APP_ZONE_ID).toLocalDate();
                String title = hw.getHomework() != null ? hw.getHomework().getTitle() : "Homework Assignment";
                dateMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Submitted Homework: " + title);
            }
        }

        // 3. Completed Tasks (status == DONE)
        List<Task> tasks = taskRepository.findByAssigneeOrderByCreatedAtDesc(user);
        for (Task t : tasks) {
            if (t.getStatus() == TaskStatus.DONE && t.getCreatedAt() != null) {
                LocalDate d = t.getCreatedAt().atZone(APP_ZONE_ID).toLocalDate();
                dateMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Completed Task: " + t.getTitle());
            }
        }

        // 4. DSA Solved Problems
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUser(user);
        for (ProblemAttempt pa : attempts) {
            if (pa.getStatus() == AttemptStatus.SOLVED && pa.getSolvedAt() != null) {
                LocalDate d = pa.getSolvedAt().atZone(APP_ZONE_ID).toLocalDate();
                String pTitle = pa.getProblem() != null ? pa.getProblem().getName() : "Algorithm Problem";
                dateMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Solved Problem: " + pTitle);
            }
        }

        // 5. Completed Curriculum Topics
        List<LearningProgress> progresses = learningProgressRepository.findByUser(user);
        for (LearningProgress lp : progresses) {
            if (lp.getStatus() == LearningStatus.DONE && lp.getCompletedAt() != null) {
                LocalDate d = lp.getCompletedAt().atZone(APP_ZONE_ID).toLocalDate();
                String tTitle = lp.getTopic() != null ? lp.getTopic().getTitle() : "Learning Topic";
                dateMap.computeIfAbsent(d, k -> new ArrayList<>()).add("Completed Topic: " + tTitle);
            }
        }

        return dateMap;
    }

    private int calculateLongestStreak(Set<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) return 0;
        List<LocalDate> sorted = dates.stream().sorted().collect(Collectors.toList());

        int max = 0;
        int current = 0;
        LocalDate expectedNext = null;

        for (LocalDate d : sorted) {
            if (expectedNext == null || d.equals(expectedNext)) {
                current++;
            } else if (!d.equals(expectedNext.minusDays(1))) { // not same day
                current = 1;
            }
            expectedNext = d.plusDays(1);
            if (current > max) {
                max = current;
            }
        }

        return max;
    }
}
