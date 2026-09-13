package com.jvmcrew.service.storage;

import org.springframework.core.io.Resource;

public interface StorageService {

    /**
     * Stores binary data under the specified relative storage path.
     *
     * @param storagePath  Relative path (e.g. standups/1/2026/09/5/voice_2026-09-13_abcd1234.webm)
     * @param data         Binary file content
     * @param contentType  MIME type (e.g. audio/webm)
     */
    void store(String storagePath, byte[] data, String contentType);

    /**
     * Loads the stored file as a Spring Resource.
     *
     * @param storagePath  Relative path
     * @return Spring Resource (ByteArrayResource or UrlResource)
     */
    Resource loadAsResource(String storagePath);

    /**
     * Deletes the stored file from storage.
     *
     * @param storagePath  Relative path
     * @return true if deleted or not found, false on failure
     */
    boolean delete(String storagePath);

    /**
     * Checks if the file exists in storage.
     *
     * @param storagePath  Relative path
     * @return true if exists
     */
    boolean exists(String storagePath);

    /**
     * Returns the name of the active storage provider (e.g., "LOCAL", "SUPABASE").
     */
    String getProviderName();
}
