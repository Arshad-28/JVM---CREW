package com.jvmcrew.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;

@Service("localStorageService")
@Slf4j
public class LocalStorageService implements StorageService {

    @Value("${app.audio.upload-dir:uploads/audio}")
    private String uploadDirProperty;

    private Path rootStoragePath;

    @PostConstruct
    public void init() {
        try {
            this.rootStoragePath = Paths.get(uploadDirProperty).toAbsolutePath().normalize();
            Files.createDirectories(this.rootStoragePath);
            log.info("Local filesystem storage initialized at: {}", this.rootStoragePath);
        } catch (IOException e) {
            log.error("Could not initialize local storage directory at: {}", uploadDirProperty, e);
            throw new RuntimeException("Could not initialize local storage directory", e);
        }
    }

    private String cleanPath(String path) {
        if (!StringUtils.hasText(path)) return "";
        String cleaned = path.trim().replace('\\', '/');
        // Remove leading slashes
        while (cleaned.startsWith("/")) {
            cleaned = cleaned.substring(1);
        }
        // Strip duplicate upload directory prefixes if present
        if (cleaned.startsWith("server/uploads/audio/")) {
            cleaned = cleaned.substring("server/uploads/audio/".length());
        } else if (cleaned.startsWith("uploads/audio/")) {
            cleaned = cleaned.substring("uploads/audio/".length());
        }
        return cleaned;
    }

    private Path resolveCandidatePath(String storagePath) {
        String clean = cleanPath(storagePath);
        if (!StringUtils.hasText(clean)) return null;

        // 1. Check primary root storage path
        if (this.rootStoragePath != null) {
            Path p1 = this.rootStoragePath.resolve(clean).normalize();
            if (Files.exists(p1)) return p1;
        }

        // 2. Check candidate alternative roots
        Path[] candidateRoots = new Path[] {
                Paths.get("server/uploads/audio").toAbsolutePath().normalize(),
                Paths.get("uploads/audio").toAbsolutePath().normalize(),
                Paths.get("../server/uploads/audio").toAbsolutePath().normalize(),
                Paths.get(uploadDirProperty).toAbsolutePath().normalize()
        };

        for (Path root : candidateRoots) {
            try {
                Path candidate = root.resolve(clean).normalize();
                if (Files.exists(candidate)) {
                    return candidate;
                }
            } catch (Exception ignored) {}
        }

        // 3. Check if clean path itself is already an absolute path
        try {
            Path directPath = Paths.get(storagePath).normalize();
            if (Files.exists(directPath)) {
                return directPath;
            }
        } catch (Exception ignored) {}

        // Fallback to primary root location
        return this.rootStoragePath != null ? this.rootStoragePath.resolve(clean).normalize() : Paths.get(clean).toAbsolutePath().normalize();
    }

    @Override
    public void store(String storagePath, byte[] data, String contentType) {
        if (!StringUtils.hasText(storagePath)) {
            throw new IllegalArgumentException("Storage path cannot be empty.");
        }
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("File content cannot be empty.");
        }

        try {
            String clean = cleanPath(storagePath);
            Path targetLocation = this.rootStoragePath.resolve(clean).normalize();
            if (!targetLocation.startsWith(this.rootStoragePath)) {
                throw new SecurityException("Cannot store file outside target directory: " + storagePath);
            }

            Path parentDir = targetLocation.getParent();
            if (parentDir != null && !Files.exists(parentDir)) {
                Files.createDirectories(parentDir);
            }

            Files.write(targetLocation, data, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            log.info("Saved file locally at: {} (size: {} bytes)", storagePath, data.length);
        } catch (IOException ex) {
            log.error("Failed to store file locally at {}: {}", storagePath, ex.getMessage(), ex);
            throw new RuntimeException("Could not save file to local disk.", ex);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            throw new IllegalArgumentException("Storage path is missing.");
        }
        try {
            Path filePath = resolveCandidatePath(storagePath);
            if (filePath != null && Files.exists(filePath) && Files.isReadable(filePath)) {
                return new UrlResource(filePath.toUri());
            } else {
                throw new com.jvmcrew.exception.StorageFileNotFoundException("File not found or not readable: " + storagePath);
            }
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("Malformed path for file: " + storagePath, e);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            return false;
        }
        try {
            Path filePath = resolveCandidatePath(storagePath);
            if (filePath != null && Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted local file: {}", filePath);
                return true;
            }
        } catch (Exception e) {
            log.warn("Could not delete local file {}: {}", storagePath, e.getMessage());
        }
        return false;
    }

    @Override
    public boolean exists(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            return false;
        }
        try {
            Path filePath = resolveCandidatePath(storagePath);
            return filePath != null && Files.exists(filePath);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "LOCAL";
    }

    public Path getRootStoragePath() {
        return rootStoragePath;
    }
}
