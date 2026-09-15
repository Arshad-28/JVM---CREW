package com.jvmcrew.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final DataSource dataSource;

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> statusMap = new HashMap<>();
        statusMap.put("status", "UP");
        statusMap.put("service", "jvmcrew-server");
        statusMap.put("timestamp", Instant.now().toString());
        statusMap.put("version", "1.0.0");

        try (Connection connection = dataSource.getConnection()) {
            boolean isValid = connection.isValid(2);
            statusMap.put("database", isValid ? "CONNECTED" : "DISCONNECTED");
        } catch (Exception e) {
            log.error("Database health check probe failed", e);
            statusMap.put("database", "DOWN");
            // Do not leak raw exception messages or credentials in public health response
        }

        return ResponseEntity.ok(statusMap);
    }
}
