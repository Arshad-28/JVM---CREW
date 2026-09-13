package com.jvmcrew.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("JVM CREW Multi-Team Platform started. On-demand registration is active. Zero seeded/dummy data loaded.");
    }
}
