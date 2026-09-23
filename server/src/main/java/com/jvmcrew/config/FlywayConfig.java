package com.jvmcrew.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            log.info("Executing Flyway repair to clean any failed schema migration history...");
            try {
                flyway.repair();
                log.info("Flyway schema repair completed successfully.");
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue (proceeding with migrate): {}", e.getMessage());
            }
            log.info("Executing Flyway migration...");
            flyway.migrate();
            log.info("Flyway migration completed successfully.");
        };
    }
}
