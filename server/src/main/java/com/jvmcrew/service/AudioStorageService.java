package com.jvmcrew.service;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.UUID;

@Service
@Slf4j
public class AudioStorageService {

    @Value("${app.audio.upload-dir:uploads/audio}")
    private String uploadDirProperty;

    private Path rootAudioPath;

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
        try {
            this.rootAudioPath = Paths.get(uploadDirProperty).toAbsolutePath().normalize();
            Files.createDirectories(this.rootAudioPath);
            log.info("Standup audio storage initialized at: {}", this.rootAudioPath);
        } catch (IOException e) {
            log.error("Could not initialize audio storage directory at: {}", uploadDirProperty, e);
            throw new RuntimeException("Could not initialize audio storage directory", e);
        }
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

        String relativeFolder = String.format("standups/%d/%d/%02d/%d", safeTeamId, year, month, userId);
        String uniqueFileName = String.format("voice_%s_%s%s", safeDateStr, UUID.randomUUID().toString().substring(0, 8), extension);
        String storagePath = relativeFolder + "/" + uniqueFileName;

        try {
            Path targetDir = this.rootAudioPath.resolve(relativeFolder).normalize();
            if (!targetDir.startsWith(this.rootAudioPath)) {
                throw new SecurityException("Cannot store audio file outside target directory.");
            }
            Files.createDirectories(targetDir);

            Path targetLocation = targetDir.resolve(uniqueFileName).normalize();
            if (!targetLocation.startsWith(this.rootAudioPath)) {
                throw new SecurityException("Cannot store audio file outside target directory.");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("Stored team-scoped standup voice recording: {} (size: {} bytes, type: {})", storagePath, file.getSize(), contentType);

            return StoredAudioMetadata.builder()
                    .fileName(uniqueFileName)
                    .storagePath(storagePath)
                    .contentType(contentType)
                    .fileSize(file.getSize())
                    .build();

        } catch (IOException ex) {
            log.error("Failed to save voice recording for team {} user {}: {}", safeTeamId, userId, ex.getMessage(), ex);
            throw new RuntimeException("Could not save voice recording file on server.", ex);
        }
    }

    public StoredAudioMetadata storeAudioFile(MultipartFile file, Long userId, LocalDate date) {
        return storeAudioFile(file, 0L, userId, date);
    }

    public boolean deleteAudioFile(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            return false;
        }
        try {
            Path filePath = this.rootAudioPath.resolve(relativePath).normalize();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted previous standup voice file: {}", relativePath);
                return true;
            }
        } catch (Exception e) {
            log.warn("Could not delete audio file {}: {}", relativePath, e.getMessage());
        }
        return false;
    }

    public Resource loadAudioAsResource(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            throw new IllegalArgumentException("Audio path is missing.");
        }
        try {
            Path filePath = this.rootAudioPath.resolve(relativePath).normalize();
            if (!filePath.startsWith(this.rootAudioPath)) {
                throw new SecurityException("Access denied: Invalid audio path");
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Audio file not found or not readable: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed path for audio file: " + relativePath, e);
        }
    }

    public Path getAudioPath(String relativePath) {
        if (!StringUtils.hasText(relativePath)) {
            throw new IllegalArgumentException("Audio path is missing.");
        }
        Path filePath = this.rootAudioPath.resolve(relativePath).normalize();
        if (!filePath.startsWith(this.rootAudioPath)) {
            throw new SecurityException("Access denied: Invalid audio path");
        }
        return filePath;
    }
}

