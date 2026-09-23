package com.jvmcrew.config;

import com.jvmcrew.model.LeadershipAssignment;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.LeadershipAssignmentRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SupabaseJwtVerifier supabaseJwtVerifier;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final LeadershipAssignmentRepository leadershipAssignmentRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                UserPrincipal userPrincipal = null;

                // 1. Primary: Verify as Supabase Auth Token
                SupabaseJwtVerifier.VerifiedSupabaseToken supabaseToken = supabaseJwtVerifier.verifyToken(jwt);
                if (supabaseToken != null) {
                    userPrincipal = resolvePrincipalFromSupabase(supabaseToken);
                }

                // 2. Secondary fallback for legacy/internal tokens during migration
                if (userPrincipal == null && tokenProvider.validateToken(jwt)) {
                    userPrincipal = tokenProvider.getUserPrincipalFromToken(jwt);
                }

                if (userPrincipal != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userPrincipal, null, userPrincipal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private UserPrincipal resolvePrincipalFromSupabase(SupabaseJwtVerifier.VerifiedSupabaseToken token) {
        // Find existing user by Supabase auth_user_id
        Optional<User> userOpt = userRepository.findByAuthUserId(token.authUserId());

        // If not linked yet, find by email to link existing user account
        if (userOpt.isEmpty() && StringUtils.hasText(token.email())) {
            userOpt = userRepository.findByEmail(token.email())
                    .or(() -> userRepository.findByEmailIgnoreCase(token.email()));

            if (userOpt.isPresent()) {
                User existingUser = userOpt.get();
                if (existingUser.getAuthUserId() == null) {
                    existingUser.setAuthUserId(token.authUserId());
                    userRepository.save(existingUser);
                    log.info("Linked existing application user {} (ID: {}) to Supabase Auth UUID {}",
                            existingUser.getEmail(), existingUser.getId(), token.authUserId());
                }
            }
        }

        if (userOpt.isEmpty()) {
            log.warn("Supabase Auth user {} not found in application database", token.authUserId());
            return null;
        }

        User user = userOpt.get();

        // Resolve active TeamMember
        TeamMember teamMember = teamMemberRepository.findActiveWithTeamByUser(user)
                .orElseGet(() -> teamMemberRepository.findFirstByUser(user).orElse(null));

        Long teamId = (teamMember != null && teamMember.getTeam() != null) ? teamMember.getTeam().getId() : null;

        // Dynamic Role Resolution: Check current active leadership assignment for today
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

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
