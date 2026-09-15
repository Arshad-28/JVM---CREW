package com.jvmcrew.config;

import com.jvmcrew.model.LeadershipAssignment;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LeadershipAssignmentRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String cleanEmail = email != null ? email.trim() : "";
        User user = userRepository.findByEmail(cleanEmail)
                .or(() -> userRepository.findByEmailIgnoreCase(cleanEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        TeamMember teamMember = teamMemberRepository.findActiveWithTeamByUser(user)
                .orElseGet(() -> teamMemberRepository.findFirstByUser(user).orElse(null));

        Long teamId = teamMember != null && teamMember.getTeam() != null ? teamMember.getTeam().getId() : null;

        // Dynamic Role Resolution: Check if user is the designated active Lead for today
        LocalDate today = LocalDate.now();
        boolean isActiveLead = false;
        if (teamMember != null && teamMember.getTeam() != null) {
            List<LeadershipAssignment> activeList = leadershipAssignmentRepository
                    .findActiveAssignmentsForTeamAndDate(teamMember.getTeam(), today);
            if (!activeList.isEmpty()) {
                isActiveLead = activeList.get(0).getUser().getId().equals(user.getId());
            } else {
                isActiveLead = teamMember.getRole() == Role.LEAD;
            }
        }

        Role role = isActiveLead ? Role.LEAD : Role.MEMBER;

        return new UserPrincipal(user, teamMember, teamId, role);
    }
}

