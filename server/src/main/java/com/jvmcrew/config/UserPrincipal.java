package com.jvmcrew.config;

import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final User user;
    private final TeamMember teamMember;
    private final Long id;
    private final String name;
    private final String email;
    private final Long teamId;
    private final Role role;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user, Long teamId, Role role) {
        this(user, null, teamId, role);
    }

    public UserPrincipal(User user, TeamMember teamMember, Long teamId, Role role) {
        this.user = user;
        this.teamMember = teamMember;
        this.id = user != null ? user.getId() : null;
        this.name = user != null ? user.getName() : "";
        this.email = user != null ? user.getEmail() : "";
        this.teamId = teamId != null ? teamId : (teamMember != null && teamMember.getTeam() != null ? teamMember.getTeam().getId() : null);
        this.role = role != null ? role : Role.MEMBER;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    public UserPrincipal(Long id, String email, String name, Long teamId, Role role) {
        this.user = null;
        this.teamMember = null;
        this.id = id;
        this.email = email != null ? email : "";
        this.name = name != null ? name : "";
        this.teamId = teamId;
        this.role = role != null ? role : Role.MEMBER;
        this.authorities = List.of(new SimpleGrantedAuthority("ROLE_" + this.role.name()));
    }

    public Long getId() {
        return id != null ? id : (user != null ? user.getId() : null);
    }

    public String getName() {
        return name != null && !name.isEmpty() ? name : (user != null ? user.getName() : "");
    }

    @Override
    public String getUsername() {
        return email != null && !email.isEmpty() ? email : (user != null ? user.getEmail() : "");
    }

    @Override
    public String getPassword() {
        return user != null ? user.getPasswordHash() : "";
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
