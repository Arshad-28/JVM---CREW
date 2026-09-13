package com.jvmcrew.config.ratelimit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@Slf4j
public class RateLimitingService {

    public enum RateLimitType {
        AUTH(30, 60),          // 30 requests per 60 seconds (Login, Register, Password changes)
        AI(30, 60),            // 30 requests per 60 seconds (Interview Lab AI generation)
        UPLOAD(10, 60),        // 10 requests per 60 seconds (Voice recordings & file uploads)
        GENERAL(150, 60);      // 150 requests per 60 seconds (General API fallback)

        private final int maxRequests;
        private final int windowSeconds;

        RateLimitType(int maxRequests, int windowSeconds) {
            this.maxRequests = maxRequests;
            this.windowSeconds = windowSeconds;
        }

        public int getMaxRequests() {
            return maxRequests;
        }

        public int getWindowSeconds() {
            return windowSeconds;
        }
    }

    private final Map<String, ConcurrentLinkedQueue<Long>> requestWindows = new ConcurrentHashMap<>();
    private final Map<String, Long> lastAccessTimes = new ConcurrentHashMap<>();

    /**
     * Checks if a request for the given key and rate limit type is allowed.
     * Uses a thread-safe sliding window algorithm.
     *
     * @param key Unique client identifier (e.g., client IP or User ID)
     * @param type The type of rate limit tier to apply
     * @return true if the request is within limit, false if rate limit is exceeded
     */
    public boolean tryAcquire(String key, RateLimitType type) {
        if (key == null || key.isBlank()) {
            key = "unknown";
        }

        String bucketKey = type.name() + ":" + key;
        long now = Instant.now().toEpochMilli();
        long windowMillis = (long) type.getWindowSeconds() * 1000L;
        long windowStart = now - windowMillis;

        ConcurrentLinkedQueue<Long> timestamps = requestWindows.computeIfAbsent(bucketKey, k -> new ConcurrentLinkedQueue<>());
        lastAccessTimes.put(bucketKey, now);

        // Evict timestamps outside current sliding window
        while (!timestamps.isEmpty()) {
            Long oldest = timestamps.peek();
            if (oldest != null && oldest < windowStart) {
                timestamps.poll();
            } else {
                break;
            }
        }

        // Check if within allowed threshold
        synchronized (timestamps) {
            if (timestamps.size() < type.getMaxRequests()) {
                timestamps.add(now);
                return true;
            } else {
                log.warn("Rate limit exceeded for bucket '{}' (Limit: {} req / {}s)", bucketKey, type.getMaxRequests(), type.getWindowSeconds());
                return false;
            }
        }
    }

    /**
     * Cleans up idle entries to prevent unbounded memory growth.
     */
    public void cleanupExpiredEntries() {
        long now = Instant.now().toEpochMilli();
        long maxRetentionMillis = 300_000L; // 5 minutes

        lastAccessTimes.forEach((key, lastAccess) -> {
            if (now - lastAccess > maxRetentionMillis) {
                requestWindows.remove(key);
                lastAccessTimes.remove(key);
            }
        });
    }

    /**
     * Helper to resolve the appropriate rate limit type from HTTP method and request URI.
     */
    public RateLimitType resolveRateLimitType(String method, String uri) {
        if (uri == null) {
            return RateLimitType.GENERAL;
        }

        String lowerUri = uri.toLowerCase();

        // 1. Authentication endpoints (Strict brute-force prevention)
        if (lowerUri.startsWith("/api/auth/login") ||
            lowerUri.startsWith("/api/auth/register") ||
            lowerUri.startsWith("/api/auth/change-password")) {
            return RateLimitType.AUTH;
        }

        // 2. AI generation endpoints (Gemini / LLM abuse prevention)
        if (lowerUri.startsWith("/api/interview-lab")) {
            return RateLimitType.AI;
        }

        // 3. File upload & voice endpoints (Disk / Resource exhaustion prevention)
        if (lowerUri.startsWith("/api/standups/submit-voice") ||
            lowerUri.startsWith("/api/standups/voice") ||
            (lowerUri.startsWith("/api/homework") && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)))) {
            return RateLimitType.UPLOAD;
        }

        // 4. Default general tier
        return RateLimitType.GENERAL;
    }
}
