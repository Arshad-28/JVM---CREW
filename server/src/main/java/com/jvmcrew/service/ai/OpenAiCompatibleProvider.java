package com.jvmcrew.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class OpenAiCompatibleProvider implements AiProvider {

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleProvider(String apiKey, String model, String baseUrl, int timeoutSeconds) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "gpt-4o-mini";
        String normalizedBaseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl.trim() : "https://api.openai.com/v1";
        if (normalizedBaseUrl.endsWith("/")) {
            normalizedBaseUrl = normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1);
        }
        this.baseUrl = normalizedBaseUrl;
        this.objectMapper = new ObjectMapper();
        this.restClient = RestClient.builder()
                .baseUrl(this.baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String generateContent(String systemPrompt, String userPrompt) {
        return executeOpenAi(systemPrompt, userPrompt, false);
    }

    @Override
    public String generateStructuredJson(String systemPrompt, String userPrompt) {
        return executeOpenAi(systemPrompt, userPrompt, true);
    }

    private String executeOpenAi(String systemPrompt, String userPrompt, boolean jsonMode) {
        if (!isAvailable()) {
            throw new AiServiceUnavailableException("Interview Lab is temporarily unavailable. Please try again.");
        }

        try {
            List<Map<String, String>> messages = new ArrayList<>();
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                messages.add(Map.of("role", "system", "content", systemPrompt));
            }
            messages.add(Map.of("role", "user", "content", userPrompt));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.4);

            if (jsonMode) {
                requestBody.put("response_format", Map.of("type", "json_object"));
            }

            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            if (responseBody == null || responseBody.isBlank()) {
                throw new AiServiceUnavailableException("Interview Lab is temporarily unavailable. Please try again.");
            }

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode message = choices.get(0).path("message");
                String content = message.path("content").asText();
                if (content != null && !content.isBlank()) {
                    return content;
                }
            }

            log.warn("OpenAI API returned unexpected structure: {}", responseBody);
            throw new AiServiceUnavailableException("Interview Lab is temporarily unavailable. Please try again.");
        } catch (AiServiceUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OpenAI compatible API invocation failed: {}", ex.getMessage(), ex);
            throw new AiServiceUnavailableException("Interview Lab is temporarily unavailable. Please try again.", ex);
        }
    }
}
