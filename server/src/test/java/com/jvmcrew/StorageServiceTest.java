package com.jvmcrew;

import com.jvmcrew.service.AudioStorageService;
import com.jvmcrew.service.storage.LocalStorageService;
import com.jvmcrew.service.storage.SupabaseStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.nio.file.Path;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class StorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void testLocalStorageService_StoreLoadDeleteCycle() throws Exception {
        LocalStorageService local = new LocalStorageService();
        ReflectionTestUtils.setField(local, "uploadDirProperty", tempDir.toString());
        local.init();

        assertEquals("LOCAL", local.getProviderName());

        String relativePath = "standups/1/2026/09/10/voice_sample.webm";
        byte[] content = "test audio binary data".getBytes();

        assertFalse(local.exists(relativePath));

        local.store(relativePath, content, "audio/webm");
        assertTrue(local.exists(relativePath));

        Resource resource = local.loadAsResource(relativePath);
        assertNotNull(resource);
        assertTrue(resource.exists());
        assertEquals(content.length, resource.contentLength());

        boolean deleted = local.delete(relativePath);
        assertTrue(deleted);
        assertFalse(local.exists(relativePath));
    }

    @Test
    void testLocalStorageService_SecurityPathTraversal_IsRejected() {
        LocalStorageService local = new LocalStorageService();
        ReflectionTestUtils.setField(local, "uploadDirProperty", tempDir.toString());
        local.init();

        String evilPath = "../../../etc/passwd";
        byte[] content = "malicious payload".getBytes();

        assertThrows(SecurityException.class, () -> local.store(evilPath, content, "audio/webm"));
        assertThrows(SecurityException.class, () -> local.loadAsResource(evilPath));
    }

    @Test
    void testSupabaseStorageService_Unconfigured_ThrowsException() {
        SupabaseStorageService supabase = new SupabaseStorageService();
        supabase.init();

        assertFalse(supabase.isConfigured());
        assertEquals("SUPABASE", supabase.getProviderName());
        assertEquals("jvmcrew-audio", supabase.getEffectiveBucket());

        assertThrows(IllegalStateException.class, () -> supabase.store("path/to/file.webm", new byte[]{1, 2, 3}, "audio/webm"));
        assertThrows(IllegalStateException.class, () -> supabase.loadAsResource("path/to/file.webm"));
    }

    @Test
    void testAudioStorageService_WithLocalStorage_Integration() {
        LocalStorageService local = new LocalStorageService();
        ReflectionTestUtils.setField(local, "uploadDirProperty", tempDir.toString());
        local.init();

        SupabaseStorageService supabase = new SupabaseStorageService();
        supabase.init();

        AudioStorageService audioStorageService = new AudioStorageService(local, supabase);
        audioStorageService.init();

        assertEquals("LOCAL", audioStorageService.getActiveStorageService().getProviderName());

        MockMultipartFile file = new MockMultipartFile(
                "voice",
                "voice.webm",
                "audio/webm",
                new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0x01, 0x02}
        );

        AudioStorageService.StoredAudioMetadata metadata = audioStorageService.storeAudioFile(file, 1L, 10L, LocalDate.now());
        assertNotNull(metadata);
        assertNotNull(metadata.getStoragePath());
        assertTrue(metadata.getStoragePath().startsWith("standups/1/"));
        assertEquals("audio/webm", metadata.getContentType());
        assertEquals(6L, metadata.getFileSize());

        Resource res = audioStorageService.loadAudioAsResource(metadata.getStoragePath());
        assertNotNull(res);
        assertTrue(res.exists());

        boolean deleted = audioStorageService.deleteAudioFile(metadata.getStoragePath());
        assertTrue(deleted);
    }

    @Test
    void testAudioStorageService_MimeValidation_RejectsInvalidFiles() {
        LocalStorageService local = new LocalStorageService();
        ReflectionTestUtils.setField(local, "uploadDirProperty", tempDir.toString());
        local.init();

        SupabaseStorageService supabase = new SupabaseStorageService();
        supabase.init();

        AudioStorageService audioStorageService = new AudioStorageService(local, supabase);
        audioStorageService.init();

        MockMultipartFile exeFile = new MockMultipartFile(
                "voice",
                "malware.exe",
                "application/x-msdownload",
                new byte[]{0x4d, 0x5a}
        );

        assertThrows(IllegalArgumentException.class, () ->
                audioStorageService.storeAudioFile(exeFile, 1L, 10L, LocalDate.now())
        );
    }
}
