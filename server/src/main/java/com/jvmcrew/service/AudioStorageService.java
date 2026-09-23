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
        String lowerFilename = originalFilename != null ? originalFilename.toLowerCase().trim() : "";

        boolean isValidAudio = lowerMime.startsWith("audio/")
                || lowerMime.startsWith("video/webm")
                || lowerMime.startsWith("video/mp4")
                || lowerMime.startsWith("video/ogg")
                || lowerMime.startsWith("video/3gpp")
                || "application/octet-stream".equals(lowerMime)
                || lowerFilename.endsWith(".webm")
                || lowerFilename.endsWith(".ogg")
                || lowerFilename.endsWith(".wav")
                || lowerFilename.endsWith(".mp3")
                || lowerFilename.endsWith(".m4a")
                || lowerFilename.endsWith(".mp4")
                || lowerFilename.endsWith(".aac")
                || lowerFilename.endsWith(".caf")
                || lowerFilename.endsWith(".3gp")
                || lowerFilename.endsWith(".weba");

        if (!isValidAudio) {
            log.warn("Rejected audio upload with mime='{}', filename='{}'", contentType, originalFilename);
            throw new IllegalArgumentException("Invalid file type: '" + contentType + "'. Only standard audio recordings are allowed.");
        }

        // Determine file extension and normalized content type
        String extension = ".webm";
        if (lowerMime.contains("mp4") || lowerMime.contains("m4a") || lowerMime.contains("aac") || lowerFilename.endsWith(".mp4") || lowerFilename.endsWith(".m4a") || lowerFilename.endsWith(".aac")) {
            extension = ".mp4";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/mp4";
        } else if (lowerMime.contains("ogg") || lowerFilename.endsWith(".ogg")) {
            extension = ".ogg";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/ogg";
        } else if (lowerMime.contains("wav") || lowerFilename.endsWith(".wav")) {
            extension = ".wav";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/wav";
        } else if (lowerMime.contains("mp3") || lowerMime.contains("mpeg") || lowerFilename.endsWith(".mp3")) {
            extension = ".mp3";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/mpeg";
        } else if (lowerMime.contains("3gp") || lowerFilename.endsWith(".3gp")) {
            extension = ".3gp";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/3gpp";
        } else if (lowerMime.contains("caf") || lowerFilename.endsWith(".caf")) {
            extension = ".caf";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/x-caf";
        } else {
            extension = ".webm";
            if ("application/octet-stream".equals(lowerMime)) contentType = "audio/webm";
        }

        LocalDate targetDate = date != null ? date : LocalDate.now();
        String safeDateStr = targetDate.toString();
        int year = targetDate.getYear();
        int month = targetDate.getMonthValue();
        int day = targetDate.getDayOfMonth();
        long safeTeamId = teamId != null ? teamId : 0L;

        String relativeFolder = String.format("standups/%d/%d/%02d/%02d", safeTeamId, year, month, day);
        String uniqueFileName = String.format("voice_%s_%s%s", safeDateStr, UUID.randomUUID().toString().substring(0, 8), extension);
        String storagePath = relativeFolder + "/" + uniqueFileName;

        try {
            byte[] fileBytes = file.getBytes();

            // 1. Local Cache/Mirror first for zero-latency local playback and guaranteed offline safety
            boolean localSaved = false;
            try {
                localStorageService.store(storagePath, fileBytes, contentType);
                localSaved = true;
                log.info("Cached voice recording locally: {} (size: {} bytes)", storagePath, fileBytes.length);
            } catch (Exception ex) {
                log.warn("Local storage cache write failed for {}: {}", storagePath, ex.getMessage());
            }

            // 2. Persistent Cloud Storage: Supabase (safely isolated with try-catch so network/quota issues never fail user submission)
            boolean supabaseSaved = false;
            if (supabaseStorageService.isConfigured()) {
                try {
                    supabaseStorageService.store(storagePath, fileBytes, contentType);
                    supabaseSaved = true;
                    log.info("Successfully persisted voice recording to Supabase Storage: {} (size: {} bytes)", storagePath, fileBytes.length);
                } catch (Exception ex) {
                    log.error("Supabase Storage upload failed for {} (will rely on local storage): {}", storagePath, ex.getMessage(), ex);
                }
            }

            if (!localSaved && !supabaseSaved) {
                throw new IOException("Failed to save audio recording to both local disk and cloud storage providers.");
            }

            return StoredAudioMetadata.builder()
                    .fileName(uniqueFileName)
                    .storagePath(storagePath)
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .build();
        } catch (IOException ex) {
            log.error("Failed to process audio file bytes for team {} user {}: {}", safeTeamId, userId, ex.getMessage(), ex);
            throw new RuntimeException("Could not process audio upload: " + ex.getMessage(), ex);
        }
    }

    public StoredAudioMetadata storeAudioFile(MultipartFile file, Long userId, LocalDate date) {
        return storeAudioFile(file, 0L, userId, date);
    }

    public boolean exists(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            return false;
        }
        if (localStorageService.exists(relativePath)) {
            return true;
        }
        return supabaseStorageService.isConfigured() && supabaseStorageService.exists(relativePath);
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
                boolean cloudDeleted = supabaseStorageService.delete(relativePath);
                if (cloudDeleted) {
                    deleted = true;
                }
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
            } catch (com.jvmcrew.exception.StorageFileNotFoundException ex) {
                log.warn("Recording not found in Supabase Storage: {}", relativePath);
                throw ex;
            } catch (Exception ex) {
                log.warn("Supabase cloud storage load failed for '{}': {}", relativePath, ex.getMessage());
            }
        }

        throw new com.jvmcrew.exception.StorageFileNotFoundException("Voice recording not found in storage for path: " + relativePath);
    }
}
