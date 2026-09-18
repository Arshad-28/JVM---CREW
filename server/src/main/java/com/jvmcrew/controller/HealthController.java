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
            boolean isValid = connection.isValid(1);
            statusMap.put("database", isValid ? "CONNECTED" : "DISCONNECTED");
        } catch (Exception e) {
            log.warn("Database health probe non-critical warning: {}", e.getMessage());
            statusMap.put("database", "DOWN");
        }

        return ResponseEntity.ok(statusMap);
    }

    @GetMapping({"/readiness", "/api/readiness"})
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> statusMap = new HashMap<>();
        statusMap.put("status", "READY");
        statusMap.put("timestamp", Instant.now().toString());

        try (Connection connection = dataSource.getConnection()) {
            boolean isValid = connection.isValid(1);
            if (isValid) {
                statusMap.put("ready", true);
                return ResponseEntity.ok(statusMap);
            } else {
                statusMap.put("ready", false);
                return ResponseEntity.status(503).body(statusMap);
            }
        } catch (Exception e) {
            statusMap.put("ready", false);
            return ResponseEntity.status(503).body(statusMap);
        }
    }
}
