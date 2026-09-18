package com.jvmcrew.repository;

import com.jvmcrew.model.NotificationPreference;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {

    Optional<NotificationPreference> findByUser(User user);
}
