package com.jvmcrew.repository;

import com.jvmcrew.model.PushSubscription;
import com.jvmcrew.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserAndActiveTrue(User user);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    @Modifying
    @Query("UPDATE PushSubscription p SET p.active = false, p.updatedAt = :now WHERE p.endpoint = :endpoint")
    void deactivateEndpoint(@Param("endpoint") String endpoint, @Param("now") Instant now);

    @Modifying
    @Query("UPDATE PushSubscription p SET p.lastUsedAt = :now, p.updatedAt = :now WHERE p.id = :id")
    void touchSubscription(@Param("id") Long id, @Param("now") Instant now);

    void deleteByEndpoint(String endpoint);
}
