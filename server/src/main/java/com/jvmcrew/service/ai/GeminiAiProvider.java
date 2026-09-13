package com.jvmcrew.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.ResourceAccessException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
public class GeminiAiProvider implements AiProvider {

    private final String apiKey;
    private final String model;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiAiProvider(String apiKey, String model, int timeoutSeconds) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "gemini-3.6-flash";
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds > 0 ? timeoutSeconds : 30));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String generateContent(String systemPrompt, String userPrompt) {
        return executeGemini(systemPrompt, userPrompt, false);
    }

    @Override
    public String generateStructuredJson(String systemPrompt, String userPrompt) {
        return executeGemini(systemPrompt, userPrompt, true);
    }

    private String executeGemini(String systemPrompt, String userPrompt, boolean jsonMode) {
        if (!isAvailable()) {
            throw new AiServiceUnavailableException("AI provider is not configured. Please configure the AI_API_KEY in the .env file.");
        }

        List<String> candidateModels = new ArrayList<>();
        if (model != null && !model.isBlank() && !model.contains("2.5") && !model.contains("1.5") && !model.contains("2.0")) {
            candidateModels.add(model);
        }
        for (String m : List.of("gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest")) {
            if (!candidateModels.contains(m)) {
                candidateModels.add(m);
            }
        }
        if (candidateModels.isEmpty()) {
            candidateModels.add("gemini-3.5-flash-lite");
        }

        int lastStatusCode = 0;
        String lastErrorBody = null;

        for (String currentModel : candidateModels) {
            try {
                return callModel(currentModel, systemPrompt, userPrompt, jsonMode);
            } catch (GeminiHttpException ex) {
                lastStatusCode = ex.getStatusCode();
                lastErrorBody = ex.getResponseBody();
                log.warn("Gemini model '{}' returned HTTP {}: {}", currentModel, lastStatusCode, lastErrorBody);

                // Failover to next candidate model if current model is deprecated (404), temporarily high demand (503), or rate limited (429)
                if (lastStatusCode == 404 || lastStatusCode == 503 || lastStatusCode == 429) {
                    try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                    continue;
                }
                handleHttpError(lastStatusCode, lastErrorBody, currentModel);
            } catch (RestClientResponseException ex) {
                lastStatusCode = ex.getStatusCode().value();
                lastErrorBody = ex.getResponseBodyAsString();
                log.warn("Gemini model '{}' returned HTTP {}: {}", currentModel, lastStatusCode, lastErrorBody);

                if (lastStatusCode == 404 || lastStatusCode == 503 || lastStatusCode == 429) {
                    try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                    continue;
                }
                handleHttpError(lastStatusCode, lastErrorBody, currentModel);
            } catch (Exception ex) {
                log.error("Google Gemini connection error on model '{}': {}", currentModel, ex.getMessage());
                try { Thread.sleep(500); } catch (InterruptedException ignored) {}
                continue;
            }
        }

        if (lastStatusCode != 0) {
            handleHttpError(lastStatusCode, lastErrorBody, model);
        }
        throw new AiServiceUnavailableException("Failed to generate AI content with configured Gemini model. Please try again.");
    }

    private String callModel(String targetModel, String systemPrompt, String userPrompt, boolean jsonMode) {
        Map<String, Object> contentObj = Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)));

        Map<String, Object> generationConfig = jsonMode
                ? Map.of("temperature", 0.4, "responseMimeType", "application/json")
                : Map.of("temperature", 0.4);

        Map<String, Object> requestBody;
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            requestBody = Map.of(
                    "contents", List.of(contentObj),
                    "systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                    "generationConfig", generationConfig
            );
        } else {
            requestBody = Map.of(
                    "contents", List.of(contentObj),
                    "generationConfig", generationConfig
            );
        }

        log.info("Sending request to Google Gemini API (model: {}, jsonMode: {})", targetModel, jsonMode);

        String uri = String.format("/models/%s:generateContent?key=%s", targetModel, apiKey);

        String responseBody = restClient.post()
                .uri(uri)
                .body(requestBody)
                .exchange((clientReq, clientRes) -> {
                    int status = clientRes.getStatusCode().value();
                    byte[] bytes = clientRes.getBody().readAllBytes();
                    String raw = (bytes != null && bytes.length > 0)
                            ? new String(bytes, java.nio.charset.StandardCharsets.UTF_8)
                            : "";
                    if (status >= 400) {
                        throw new GeminiHttpException(status, raw, targetModel);
                    }
                    return raw;
                });

        if (responseBody == null || responseBody.isBlank()) {
            throw new AiServiceUnavailableException("Gemini returned an empty response. Please try again.");
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        } catch (Exception ex) {
            log.error("Failed to parse Gemini response JSON: {}", ex.getMessage());
        }

        log.warn("Gemini returned unexpected response structure: {}", responseBody);
        throw new AiServiceUnavailableException("AI provider returned an unexpected response structure. Please try again.");
    }

    private static class GeminiHttpException extends RuntimeException {
        private final int statusCode;
        private final String responseBody;
        private final String model;

        public GeminiHttpException(int statusCode, String responseBody, String model) {
            super("Gemini HTTP " + statusCode);
            this.statusCode = statusCode;
            this.responseBody = responseBody;
            this.model = model;
        }

        public int getStatusCode() { return statusCode; }
        public String getResponseBody() { return responseBody; }
        public String getModel() { return model; }
    }

    private void handleHttpError(int statusCode, String errBody, String targetModel) {
        if (statusCode == 400) {
            if (errBody != null && (errBody.contains("API_KEY_INVALID") || errBody.contains("API key not valid"))) {
                throw new AiServiceUnavailableException("AI provider authentication failed. Please check the configured API key.");
            }
            throw new AiServiceUnavailableException("Invalid AI request format or model configuration.");
        } else if (statusCode == 401 || statusCode == 403) {
            throw new AiServiceUnavailableException("AI provider authentication failed. Please check the configured API key.");
        } else if (statusCode == 404) {
            throw new AiServiceUnavailableException("The configured AI model '" + targetModel + "' was not found or is unavailable.");
        } else if (statusCode == 429 || (errBody != null && errBody.contains("RESOURCE_EXHAUSTED"))) {
            throw new AiServiceUnavailableException("AI provider rate limit reached. Please try again in a few moments.");
        } else if (statusCode >= 500) {
            throw new AiServiceUnavailableException("Google Gemini service is temporarily unavailable. Please try again shortly.");
        }
        throw new AiServiceUnavailableException("AI provider error (" + statusCode + "). Please try again.");
    }
}
