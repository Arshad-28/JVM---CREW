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

    @Value("${app.supabase.bucket:jvmcrew-files}")
    private String supabaseBucket;

    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(20))
                .build();

        if (isConfigured()) {
            log.info("Supabase Storage active: endpoint={}, bucket={}", supabaseUrl, getEffectiveBucket());
        }
    }

    private String getCleanUrl() {
        String raw = supabaseUrl;
        if (!StringUtils.hasText(raw)) {
            raw = "https://flvddrrjeydnkmyeqiqn.supabase.co";
        }
        String url = raw.trim().replaceAll("^[\"']|[\"']$", "").replaceAll("/+$", "");
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            if (url.contains(".")) {
                url = "https://" + url;
            } else {
                url = "https://" + url + ".supabase.co";
            }
        }
        return url;
    }

    private String getCleanKey() {
        if (!StringUtils.hasText(supabaseKey)) return "";
        return supabaseKey.replaceAll("\\s+", "")
                .replaceAll("^[\"']|[\"']$", "")
                .replaceFirst("^(?i)bearer\\s*", "");
    }

    public boolean isConfigured() {
        return StringUtils.hasText(getCleanUrl()) && StringUtils.hasText(getCleanKey());
    }

    public String getEffectiveBucket() {
        if (!StringUtils.hasText(supabaseBucket)) return "jvmcrew-files";
        return supabaseBucket.trim().replaceAll("^[\"']|[\"']$", "");
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
            String cleanUrl = getCleanUrl();
            String cleanBucket = getEffectiveBucket();
            String targetUrl = cleanUrl + "/storage/v1/object/" + cleanBucket + "/" + storagePath;
            String effectiveMime = StringUtils.hasText(contentType) ? contentType : "application/octet-stream";
            String cleanKey = getCleanKey();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .header("Content-Type", effectiveMime)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(data))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Uploaded object to Supabase Storage: bucket={}, path={}, size={} bytes",
                        cleanBucket, storagePath, data.length);
            } else if (response.statusCode() == 404) {
                log.error("Supabase Storage upload failed (HTTP 404): Bucket '{}' or endpoint not found. Response: {}", cleanBucket, responseBody);
                throw new IllegalStateException("Storage bucket '" + cleanBucket + "' not found. Please verify the Supabase bucket configuration.");
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                log.error("Supabase Storage upload failed (HTTP {}): Authorization failed for bucket '{}'. Response: {}", response.statusCode(), cleanBucket, responseBody);
                throw new IllegalStateException("Storage authorization failed for bucket '" + cleanBucket + "'. Please verify Supabase service role credentials.");
            } else if (response.statusCode() == 413) {
                log.error("Supabase Storage upload failed (HTTP 413): Payload too large ({} bytes). Response: {}", data.length, responseBody);
                throw new IllegalArgumentException("The uploaded file exceeds the maximum allowed storage upload size.");
            } else {
                log.error("Supabase Storage upload failed with HTTP {}: bucket={}, path={}, response={}", response.statusCode(), cleanBucket, storagePath, responseBody);
                throw new RuntimeException("Supabase storage upload failed with status " + response.statusCode() + ": " + responseBody);
            }
        } catch (IllegalArgumentException | IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Supabase Storage upload failed for path '{}'", storagePath, ex);
            String message = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            throw new RuntimeException("Could not save file to Supabase cloud storage: " + message, ex);
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
            String cleanUrl = getCleanUrl();
            String cleanBucket = getEffectiveBucket();
            String cleanKey = getCleanKey();

            // 1. Try standard Supabase object endpoint with auth headers
            String standardUrl = cleanUrl + "/storage/v1/object/" + cleanBucket + "/" + storagePath;
            HttpRequest stdRequest = HttpRequest.newBuilder()
                    .uri(URI.create(standardUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .GET()
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<byte[]> stdResponse = httpClient.send(stdRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (stdResponse.statusCode() >= 200 && stdResponse.statusCode() < 300) {
                return new ByteArrayResource(stdResponse.body(), "Supabase: " + storagePath);
            }

            // 2. Try authenticated endpoint
            String authUrl = cleanUrl + "/storage/v1/object/authenticated/" + cleanBucket + "/" + storagePath;
            HttpRequest authRequest = HttpRequest.newBuilder()
                    .uri(URI.create(authUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<byte[]> authResponse = httpClient.send(authRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (authResponse.statusCode() >= 200 && authResponse.statusCode() < 300) {
                return new ByteArrayResource(authResponse.body(), "Supabase Authenticated: " + storagePath);
            }

            // 3. Try public endpoint as fallback
            String publicUrl = cleanUrl + "/storage/v1/object/public/" + cleanBucket + "/" + storagePath;
            HttpRequest pubRequest = HttpRequest.newBuilder()
                    .uri(URI.create(publicUrl))
                    .GET()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<byte[]> pubResponse = httpClient.send(pubRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (pubResponse.statusCode() >= 200 && pubResponse.statusCode() < 300) {
                return new ByteArrayResource(pubResponse.body(), "Supabase Public: " + storagePath);
            }

            log.warn("Supabase Storage fetch returned HTTP {} for path: {}", stdResponse.statusCode(), storagePath);
            throw new com.jvmcrew.exception.StorageFileNotFoundException("Voice recording not found in Supabase storage: " + storagePath);
        } catch (com.jvmcrew.exception.StorageFileNotFoundException ex) {
            throw ex;
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Supabase Storage load failed for path '{}': {}", storagePath, ex.getMessage());
            String message = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
            throw new RuntimeException("Could not load file from Supabase cloud storage: " + message, ex);
        }
    }

    @Override
    public boolean delete(String storagePath) {
        if (!isConfigured() || !StringUtils.hasText(storagePath)) {
            return false;
        }

        try {
            String cleanUrl = getCleanUrl();
            String cleanBucket = getEffectiveBucket();
            String cleanKey = getCleanKey();
            String targetUrl = cleanUrl + "/storage/v1/object/" + cleanBucket + "/" + storagePath;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .DELETE()
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Deleted object from Supabase Storage: bucket={}, path={}", cleanBucket, storagePath);
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
            String cleanUrl = getCleanUrl();
            String cleanBucket = getEffectiveBucket();
            String cleanKey = getCleanKey();

            String targetUrl = cleanUrl + "/storage/v1/object/" + cleanBucket + "/" + storagePath;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            }

            String authUrl = cleanUrl + "/storage/v1/object/authenticated/" + cleanBucket + "/" + storagePath;
            HttpRequest authRequest = HttpRequest.newBuilder()
                    .uri(URI.create(authUrl))
                    .header("Authorization", "Bearer " + cleanKey)
                    .header("apikey", cleanKey)
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<Void> authResponse = httpClient.send(authRequest, HttpResponse.BodyHandlers.discarding());
            return authResponse.statusCode() >= 200 && authResponse.statusCode() < 300;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "SUPABASE";
    }
}
