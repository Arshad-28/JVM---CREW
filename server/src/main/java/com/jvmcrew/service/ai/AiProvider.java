package com.jvmcrew.service.ai;

public interface AiProvider {
    String generateContent(String systemPrompt, String userPrompt);
    String generateStructuredJson(String systemPrompt, String userPrompt);
    boolean isAvailable();
}
