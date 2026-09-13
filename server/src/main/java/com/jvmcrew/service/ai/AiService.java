package com.jvmcrew.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AiService {

    @Value("${ai.provider:gemini}")
    private String configuredProvider;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:gemini-3.6-flash}")
    private String model;

    @Value("${ai.base-url:}")
    private String baseUrl;

    @Value("${ai.timeout-seconds:60}")
    private int timeoutSeconds;

    private AiProvider aiProvider;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<Long, Long> lastUserRequestTimestamp = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        String effectiveProvider = configuredProvider != null ? configuredProvider.trim().toLowerCase() : "gemini";
        
        // Auto-detect if provider is not explicitly set to openai but key starts with sk- or baseUrl is set
        if (apiKey != null && apiKey.startsWith("AIza")) {
            effectiveProvider = "gemini";
        } else if (apiKey != null && (apiKey.startsWith("sk-") || (baseUrl != null && !baseUrl.isBlank()))) {
            effectiveProvider = "openai";
        }

        if ("openai".equals(effectiveProvider) || "groq".equals(effectiveProvider) || "openrouter".equals(effectiveProvider) || "ollama".equals(effectiveProvider)) {
            log.info("Initializing OpenAI compatible AI Provider (model: {}, baseUrl: {})", model, baseUrl);
            this.aiProvider = new OpenAiCompatibleProvider(apiKey, model, baseUrl, timeoutSeconds);
        } else {
            log.info("Initializing Google Gemini AI Provider (model: {})", model);
            this.aiProvider = new GeminiAiProvider(apiKey, model, timeoutSeconds);
        }
    }

    public void checkRateLimit(Long userId) {
        if (!isAvailable()) {
            throw new AiServiceUnavailableException("AI provider is not configured. Please configure the AI_API_KEY in the .env file.");
        }
        if (userId == null) return;
        long now = System.currentTimeMillis();
        Long lastTime = lastUserRequestTimestamp.get(userId);
        if (lastTime != null && (now - lastTime) < 500) { // 500ms debounce to avoid rapid double-clicks
            throw new AiServiceUnavailableException("Please wait a moment before sending another request.");
        }
        lastUserRequestTimestamp.put(userId, now);
    }

    public boolean isAvailable() {
        return aiProvider != null && aiProvider.isAvailable();
    }

    public String generateText(String systemPrompt, String userPrompt) {
        if (!isAvailable()) {
            throw new AiServiceUnavailableException("AI provider is not configured. Please configure the AI_API_KEY in the .env file.");
        }
        return aiProvider.generateContent(systemPrompt, userPrompt);
    }

    public JsonNode generateStructuredJson(String systemPrompt, String userPrompt) {
        if (!isAvailable()) {
            throw new AiServiceUnavailableException("AI provider is not configured. Please configure the AI_API_KEY in the .env file.");
        }

        String rawJson = aiProvider.generateStructuredJson(systemPrompt, userPrompt);
        if (rawJson == null || rawJson.isBlank()) {
            throw new AiServiceUnavailableException("AI provider returned an empty response. Please try again.");
        }

        try {
            // Clean up any markdown code fences if provider returned them
            String cleaned = rawJson.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            return objectMapper.readTree(cleaned);
        } catch (Exception ex) {
            log.error("Failed to parse structured JSON from AI response: rawContent={}", rawJson, ex);
            throw new AiServiceUnavailableException("AI provider returned an unparseable response format. Please try again.", ex);
        }
    }

    public ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}
