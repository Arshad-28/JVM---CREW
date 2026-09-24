package com.jvmcrew.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Proactive keep-alive scheduler.
 * Sends periodic inbound heartbeats via Render's public edge router every 9 minutes.
 * This resets Render's 15-minute inactivity timer, preventing the free tier container
 * from spinning down into cold sleep.
 */
@Component
@Slf4j
@ConditionalOnProperty(name = "app.keep-alive.enabled", havingValue = "true", matchIfMissing = true)
public class KeepAliveScheduler {

    @Value("${app.keep-alive.url:${RENDER_EXTERNAL_URL:https://jvm-crew.onrender.com}}")
    private String keepAliveUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    /**
     * Heartbeat runs every 9 minutes (540,000 ms), with initial delay of 1 minute (60,000 ms).
     * Render free tier inactivity spin-down occurs at 15 minutes, so 9 minutes ensures
     * uninterrupted 24/7 availability.
     */
    @Scheduled(fixedRate = 540000, initialDelay = 60000)
    public void executeHeartbeat() {
        if (keepAliveUrl == null || keepAliveUrl.isBlank()) {
            return;
        }

        String target = keepAliveUrl.trim();
        if (target.endsWith("/")) {
            target = target.substring(0, target.length() - 1);
        }
        if (!target.endsWith("/health") && !target.endsWith("/api/health")) {
            target = target + "/health";
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(target))
                    .timeout(Duration.ofSeconds(25))
                    .header("User-Agent", "JvmCrew-SelfKeepAlive/1.0")
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Keep-alive heartbeat succeeded for {} [HTTP {}]", target, response.statusCode());
            } else {
                log.warn("Keep-alive heartbeat returned non-2xx status for {} [HTTP {}]", target, response.statusCode());
            }
        } catch (Throwable t) {
            log.warn("Keep-alive heartbeat non-critical warning for {}: {}", target, t.getMessage());
        }
    }
}
