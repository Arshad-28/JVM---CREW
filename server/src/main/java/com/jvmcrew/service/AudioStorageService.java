package com.jvmcrew.service;

import com.jvmcrew.service.storage.LocalStorageService;
import com.jvmcrew.service.storage.StorageService;
import com.jvmcrew.service.storage.SupabaseStorageService;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

@Service
@Slf4j
public class AudioStorageService {

    @Value("${app.storage.provider:auto}")
    private String configuredProvider;

    private final LocalStorageService localStorageService;
    private final SupabaseStorageService supabaseStorageService;
    private StorageService activeStorageService;

    public AudioStorageService(LocalStorageService localStorageService, SupabaseStorageService supabaseStorageService) {
        this.localStorageService = localStorageService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StoredAudioMetadata {
        private String fileName;
        private String storagePath;
        private String contentType;
        private long fileSize;
    }

    @PostConstruct
    public void init() {
        String provider = configuredProvider != null ? configuredProvider.trim().toLowerCase() : "auto";
        if ("supabase".equals(provider) || ("auto".equals(provider) && supabaseStorageService.isConfigured())) {
            this.activeStorageService = supabaseStorageService;
            log.info("AudioStorageService initialized with SUPABASE persistent cloud storage");
        } else {
            this.activeStorageService = localStorageService;
            log.info("AudioStorageService initialized with LOCAL filesystem storage");
        }
    }

    public StorageService getActiveStorageService() {
        return activeStorageService != null ? activeStorageService : localStorageService;
    }

    private static final java.util.Set<String> ALLOWED_AUDIO_MIME_TYPES = java.util.Set.of(
            "audio/webm",
            "audio/ogg",
            "audio/wav",
            "audio/x-wav",
            "audio/mp4",
            "audio/mpeg",
            "audio/mp3",
            "audio/aac",
            "audio/x-m4a",
            "video/webm",
            "video/mp4"
    );

    public StoredAudioMetadata storeAudioFile(MultipartFile file, Long teamId, Long userId, LocalDate date) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio recording file is empty or missing.");
        }

        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType)) {
            contentType = "audio/webm";
        }

        String lowerMime = contentType.toLowerCase().split(";")[0].trim();
        if (!ALLOWED_AUDIO_MIME_TYPES.contains(lowerMime)) {
            throw new IllegalArgumentException("Invalid file type: '" + contentType + "'. Only standard audio recordings are allowed.");
        }

        String extension = ".webm";
        if (contentType.contains("mp4") || (originalFilename != null && originalFilename.endsWith(".mp4"))) {
            extension = ".mp4";
        } else if (contentType.contains("ogg") || (originalFilename != null && originalFilename.endsWith(".ogg"))) {
            extension = ".ogg";
        } else if (contentType.contains("wav") || (originalFilename != null && originalFilename.endsWith(".wav"))) {
            extension = ".wav";
        } else if (contentType.contains("webm") || (originalFilename != null && originalFilename.endsWith(".webm"))) {
            extension = ".webm";
        }

        LocalDate targetDate = date != null ? date : LocalDate.now();
        String safeDateStr = targetDate.toString();
        int year = targetDate.getYear();
        int month = targetDate.getMonthValue();
        long safeTeamId = teamId != null ? teamId : 0L;
        long safeUserId = userId != null ? userId : 0L;

        String relativeFolder = String.format("standups/%d/%d/%02d/%d", safeTeamId, year, month, safeUserId);
        String uniqueFileName = String.format("voice_%s_%s%s", safeDateStr, UUID.randomUUID().toString().substring(0, 8), extension);
        String storagePath = relativeFolder + "/" + uniqueFileName;

        try {
            byte[] fileBytes = file.getBytes();

            // 1. Always store in local filesystem for immediate zero-latency playback
            try {
                localStorageService.store(storagePath, fileBytes, contentType);
                log.info("Stored voice recording locally: {} (size: {} bytes)", storagePath, fileBytes.length);
            } catch (Exception ex) {
                log.warn("Failed to store voice recording locally at {}: {}", storagePath, ex.getMessage());
            }

            // 2. Also store in Supabase persistent cloud storage if configured
            if (supabaseStorageService.isConfigured()) {
                try {
                    supabaseStorageService.store(storagePath, fileBytes, contentType);
                    log.info("Stored voice recording in Supabase: {} (size: {} bytes)", storagePath, fileBytes.length);
                } catch (Exception ex) {
                    log.warn("Supabase persistent cloud storage upload failed for {}: {}", storagePath, ex.getMessage());
                }
            }

            return StoredAudioMetadata.builder()
                    .fileName(uniqueFileName)
                    .storagePath(storagePath)
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .build();
        } catch (IOException ex) {
            log.error("Failed to read audio file bytes for team {} user {}: {}", safeTeamId, safeUserId, ex.getMessage(), ex);
            throw new RuntimeException("Could not process audio upload: " + ex.getMessage(), ex);
        }
    }

    public StoredAudioMetadata storeAudioFile(MultipartFile file, Long userId, LocalDate date) {
        return storeAudioFile(file, 0L, userId, date);
    }

    public boolean deleteAudioFile(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            return false;
        }
        boolean deleted = false;
        if (localStorageService.exists(relativePath)) {
            try {
                localStorageService.delete(relativePath);
                deleted = true;
            } catch (Exception e) {
                log.warn("Local storage delete failed for path {}: {}", relativePath, e.getMessage());
            }
        }
        if (supabaseStorageService.isConfigured()) {
            try {
                supabaseStorageService.delete(relativePath);
                deleted = true;
            } catch (Exception e) {
                log.warn("Supabase delete failed for path {}: {}", relativePath, e.getMessage());
            }
        }
        return deleted;
    }

    public Resource loadAudioAsResource(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            throw new IllegalArgumentException("Audio path is missing.");
        }

        // 1. Try local disk first (fastest)
        if (localStorageService.exists(relativePath)) {
            try {
                return localStorageService.loadAsResource(relativePath);
            } catch (Exception ex) {
                log.warn("Local storage resource load failed for '{}': {}", relativePath, ex.getMessage());
            }
        }

        // 2. Try Supabase cloud storage
        if (supabaseStorageService.isConfigured()) {
            try {
                Resource resource = supabaseStorageService.loadAsResource(relativePath);
                if (resource != null && resource.exists()) {
                    // Cache locally for subsequent fast plays
                    try {
                        byte[] bytes = resource.getInputStream().readAllBytes();
                        if (bytes.length > 0) {
                            localStorageService.store(relativePath, bytes, "audio/webm");
                        }
                    } catch (Exception ignored) {}
                    return resource;
                }
            } catch (Exception ex) {
                log.warn("Supabase cloud storage load failed for '{}': {}", relativePath, ex.getMessage());
            }
        }

        throw new IllegalStateException("Voice recording could not be loaded from storage. Please verify or re-record.");
    }
}
