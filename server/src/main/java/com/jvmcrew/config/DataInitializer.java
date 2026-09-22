package com.jvmcrew.config;

import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        log.info("JVM CREW Multi-Team Platform started. Initializing background connection pool pre-warming...");
        CompletableFuture.runAsync(() -> {
            try {
                // Pre-warm Hikari connection pool and Hibernate metadata
                jdbcTemplate.execute("SELECT 1");
                userRepository.count();
                log.info("Database connection pool pre-warmed successfully.");
            } catch (Exception e) {
                log.warn("Non-fatal database pre-warm notice: {}", e.getMessage());
            }
        });
    }
}
