package com.jvmcrew.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service("supabaseStorageService")
@Slf4j
public class SupabaseStorageService implements StorageService {

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.supabase.key:}")
    private String supabaseKey;

    @Value("${app.supabase.bucket:jvmcrew-audio}")
    private String supabaseBucket;

    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        if (isConfigured()) {
            log.info("Supabase Storage active: endpoint={}, bucket={}", supabaseUrl, getEffectiveBucket());
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(supabaseUrl) && StringUtils.hasText(supabaseKey);
    }

    public String getEffectiveBucket() {
        return StringUtils.hasText(supabaseBucket) ? supabaseBucket.trim() : "jvmcrew-audio";
    }

    @Override
    public void store(String storagePath, byte[] data, String contentType) {
        if (!isConfigured()) {
            throw new IllegalStateException("Supabase storage is not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
        }
        if (!StringUtils.hasText(storagePath)) {
            throw new IllegalArgumentException("Storage path cannot be empty.");
        }
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("File content cannot be empty.");
        }

        try {
            String normalizedBase = supabaseUrl.trim().replaceAll("/+$", "");
            String targetUrl = normalizedBase + "/storage/v1/object/" + getEffectiveBucket() + "/" + storagePath;
            String effectiveMime = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .header("Content-Type", effectiveMime)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Uploaded object to Supabase Storage: bucket={}, path={}, size={} bytes",
                        getEffectiveBucket(), storagePath, data.length);
            } else {
                log.error("Supabase Storage upload returned HTTP {}: {}", response.statusCode(), response.body());
                throw new RuntimeException("Supabase Storage upload failed with status " + response.statusCode());
            }
        } catch (Exception ex) {
            log.error("Failed to store file in Supabase Storage at {}: {}", storagePath, ex.getMessage(), ex);
            throw new RuntimeException("Could not save file to Supabase cloud storage: " + ex.getMessage(), ex);
        }
    }

    @Override
    public Resource loadAsResource(String storagePath) {
        if (!isConfigured()) {
            throw new IllegalStateException("Supabase storage is not configured.");
        }
        if (!StringUtils.hasText(storagePath)) {
            throw new IllegalArgumentException("Storage path is missing.");
        }

        try {
            String normalizedBase = supabaseUrl.trim().replaceAll("/+$", "");
            String targetUrl = normalizedBase + "/storage/v1/object/authenticated/" + getEffectiveBucket() + "/" + storagePath;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .GET()
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return new ByteArrayResource(response.body(), "Supabase: " + storagePath);
            } else {
                log.error("Supabase Storage fetch returned HTTP {} for path: {}", response.statusCode(), storagePath);
                throw new RuntimeException("File not found in Supabase Storage: " + storagePath);
            }
        } catch (Exception ex) {
            log.error("Failed to load file from Supabase Storage at {}: {}", storagePath, ex.getMessage(), ex);
            throw new RuntimeException("Could not load file from Supabase cloud storage: " + ex.getMessage(), ex);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        if (!isConfigured() || !StringUtils.hasText(storagePath)) {
            return false;
        }

        try {
            String normalizedBase = supabaseUrl.trim().replaceAll("/+$", "");
            String targetUrl = normalizedBase + "/storage/v1/object/" + getEffectiveBucket() + "/" + storagePath;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .DELETE()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Deleted object from Supabase Storage: bucket={}, path={}", getEffectiveBucket(), storagePath);
                return true;
            } else {
                log.warn("Supabase Storage delete returned HTTP {} for path: {}", response.statusCode(), storagePath);
            }
        } catch (Exception e) {
            log.warn("Could not delete file from Supabase Storage {}: {}", storagePath, e.getMessage());
        }
        return false;
    }

    @Override
    public boolean exists(String storagePath) {
        if (!isConfigured() || !StringUtils.hasText(storagePath)) {
            return false;
        }
        try {
            String normalizedBase = supabaseUrl.trim().replaceAll("/+$", "");
            String targetUrl = normalizedBase + "/storage/v1/object/authenticated/" + getEffectiveBucket() + "/" + storagePath;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + supabaseKey.trim())
                    .header("apikey", supabaseKey.trim())
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "SUPABASE";
    }
}
