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

    @Override
    public void store(String storagePath, byte[] data, String contentType) {
        if (!StringUtils.hasText(storagePath)) {
            throw new IllegalArgumentException("Storage path cannot be empty.");
        }
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("File content cannot be empty.");
        }

        try {
            Path targetLocation = this.rootStoragePath.resolve(storagePath).normalize();
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
            Path filePath = this.rootStoragePath.resolve(storagePath).normalize();
            if (!filePath.startsWith(this.rootStoragePath)) {
                throw new SecurityException("Access denied: Invalid storage path " + storagePath);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found or not readable: " + storagePath);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed path for file: " + storagePath, e);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        if (!StringUtils.hasText(storagePath)) {
            return false;
        }
        try {
            Path filePath = this.rootStoragePath.resolve(storagePath).normalize();
            if (!filePath.startsWith(this.rootStoragePath)) {
                log.warn("Security rejection: Attempted to delete outside root: {}", storagePath);
                return false;
            }
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted local file: {}", storagePath);
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
            Path filePath = this.rootStoragePath.resolve(storagePath).normalize();
            return filePath.startsWith(this.rootStoragePath) && Files.exists(filePath);
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
