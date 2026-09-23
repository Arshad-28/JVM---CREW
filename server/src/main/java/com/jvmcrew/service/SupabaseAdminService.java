package com.jvmcrew.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class SupabaseAdminService {

    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public SupabaseAdminService(
            @Value("${app.supabase.url:${SUPABASE_URL:https://flvddrrjeydnkmyeqiqn.supabase.co}}") String supabaseUrl,
            @Value("${app.supabase.key:${SUPABASE_SERVICE_ROLE_KEY:${SUPABASE_KEY:}}}") String serviceRoleKey,
            ObjectMapper objectMapper
    ) {
        this.supabaseUrl = supabaseUrl != null ? supabaseUrl.replaceAll("/+$", "") : "";
        this.serviceRoleKey = serviceRoleKey != null ? serviceRoleKey.trim() : "";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isConfigured() {
        return StringUtils.hasText(supabaseUrl) && StringUtils.hasText(serviceRoleKey);
    }

    /**
     * Creates a new user in Supabase Auth using the server-side Admin API.
     * Returns the created Supabase Auth user UUID if successful.
     */
    public Optional<UUID> createAuthUser(String email, String password, String name) {
        if (!isConfigured()) {
            log.warn("Supabase Service Role Key is not configured. Skipping remote Supabase user creation.");
            return Optional.empty();
        }

        try {
            String endpoint = supabaseUrl + "/auth/v1/admin/users";

            Map<String, Object> payload = new HashMap<>();
            payload.put("email", email.trim().toLowerCase());
            if (StringUtils.hasText(password)) {
                payload.put("password", password.trim());
            }
            payload.put("email_confirm", true);
            if (StringUtils.hasText(name)) {
                payload.put("user_metadata", Map.of("name", name.trim()));
            }

            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("apikey", serviceRoleKey)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode idNode = root.get("id");
                if (idNode != null && StringUtils.hasText(idNode.asText())) {
                    UUID authId = UUID.fromString(idNode.asText());
                    log.info("Created Supabase Auth user for {} with UUID {}", email, authId);
                    return Optional.of(authId);
                }
            } else {
                log.warn("Failed to create Supabase Auth user for {}. Status: {}, Response: {}",
                        email, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Error creating Supabase Auth user for {}: {}", email, e.getMessage());
        }

        return Optional.empty();
    }
}
