package com.jvmcrew;

import com.jvmcrew.dto.StandupResponse;
import com.jvmcrew.model.Team;
import com.jvmcrew.model.TeamMember;
import com.jvmcrew.model.User;
import com.jvmcrew.model.enums.Role;
import com.jvmcrew.repository.StandupRepository;
import com.jvmcrew.repository.TeamMemberRepository;
import com.jvmcrew.repository.TeamRepository;
import com.jvmcrew.repository.UserRepository;
import com.jvmcrew.service.AudioStorageService;
import com.jvmcrew.service.StandupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class StandupVoicePersistenceIntegrationTest {

    @Autowired
    private StandupService standupService;

    @Autowired
    private AudioStorageService audioStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private StandupRepository standupRepository;

    private User testUser;
    private Team testTeam;
    private TeamMember testMember;

    @BeforeEach
    void setUp() {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        testUser = userRepository.save(User.builder()
                .email("voice_dev_" + unique + "@test.com")
                .passwordHash("")
                .name("Voice Tester " + unique)
                .build());

        testTeam = teamRepository.save(Team.builder()
                .name("Voice Team " + unique)
                .build());

        testMember = teamMemberRepository.save(TeamMember.builder()
                .user(testUser)
                .team(testTeam)
                .role(Role.MEMBER)
                .isActive(true)
                .build());
    }

    @Test
    void testSubmitVoiceStandup_PersistsMetadataAndAudioFile() {
        byte[] audioBytes = new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0x01, 0x02, 0x03, 0x04};
        MockMultipartFile audioFile = new MockMultipartFile(
                "voice",
                "recording.webm",
                "audio/webm;codecs=opus",
                audioBytes
        );

        LocalDate standupDate = LocalDate.of(2026, 9, 18);
        StandupResponse response = standupService.submitVoiceStandup(
                testUser.getId(),
                audioFile,
                45,
                standupDate,
                "Need guidance on connection pool timeouts",
                5,
                "5/5 - Very confident"
        );

        assertNotNull(response);
        assertNotNull(response.getId());
        assertTrue(Boolean.TRUE.equals(response.getHasVoiceRecording()));
        assertEquals("VOICE", response.getSubmissionType());
        assertEquals(45, response.getAudioDurationSeconds());
        assertEquals("audio/webm;codecs=opus", response.getAudioContentType());
        assertEquals(audioBytes.length, response.getAudioFileSize());
        assertNotNull(response.getAudioUrl());
        assertEquals("/api/standups/" + response.getId() + "/voice", response.getAudioUrl());

        // Verify entity in PostgreSQL
        var standupEntity = standupRepository.findById(response.getId()).orElseThrow();
        assertNotNull(standupEntity.getAudioStoragePath());
        assertTrue(standupEntity.getAudioStoragePath().startsWith("standups/" + testTeam.getId() + "/2026/09/18/"));
        assertTrue(standupEntity.getAudioStoragePath().endsWith(".webm"));

        // Verify reading back the audio stream
        StandupService.VoiceRecordingData recordingData = standupService.getVoiceRecording(response.getId(), testUser.getId());
        assertNotNull(recordingData);
        assertNotNull(recordingData.getResource());
        assertTrue(recordingData.getResource().exists());
        assertEquals("audio/webm;codecs=opus", recordingData.getContentType());
    }

    @Test
    void testSubmitVoiceStandup_ReplacementSafelyCleansUpPreviousFile() {
        byte[] audioBytes1 = new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0x01};
        MockMultipartFile audioFile1 = new MockMultipartFile("voice", "rec1.webm", "audio/webm", audioBytes1);
        LocalDate standupDate = LocalDate.of(2026, 9, 18);

        StandupResponse response1 = standupService.submitVoiceStandup(
                testUser.getId(), audioFile1, 30, standupDate, null, 4, "4/5"
        );
        String path1 = standupRepository.findById(response1.getId()).orElseThrow().getAudioStoragePath();
        assertTrue(audioStorageService.exists(path1));

        // Re-record with new audio
        byte[] audioBytes2 = new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0x02, 0x03};
        MockMultipartFile audioFile2 = new MockMultipartFile("voice", "rec2.webm", "audio/webm", audioBytes2);

        StandupResponse response2 = standupService.submitVoiceStandup(
                testUser.getId(), audioFile2, 60, standupDate, "New question", 5, "5/5"
        );
        assertEquals(response1.getId(), response2.getId());

        String path2 = standupRepository.findById(response2.getId()).orElseThrow().getAudioStoragePath();
        assertNotEquals(path1, path2);
        assertTrue(audioStorageService.exists(path2));
        assertFalse(audioStorageService.exists(path1), "Old audio recording file should be deleted after re-recording");
    }

    @Test
    void testGetVoiceRecording_TeamIsolationEnforced() {
        byte[] audioBytes = new byte[]{0x1a, 0x45, (byte) 0xdf, (byte) 0xa3};
        MockMultipartFile audioFile = new MockMultipartFile("voice", "rec.webm", "audio/webm", audioBytes);
        StandupResponse response = standupService.submitVoiceStandup(
                testUser.getId(), audioFile, 20, LocalDate.now(), null, 4, "4/5"
        );

        // Create another user in a DIFFERENT team
        String otherUnique = UUID.randomUUID().toString().substring(0, 8);
        User otherUser = userRepository.save(User.builder()
                .email("other_" + otherUnique + "@test.com")
                .passwordHash("")
                .name("Other Team Member")
                .build());

        Team otherTeam = teamRepository.save(Team.builder()
                .name("Other Team " + otherUnique)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .user(otherUser)
                .team(otherTeam)
                .role(Role.MEMBER)
                .isActive(true)
                .build());

        assertThrows(AccessDeniedException.class, () ->
                standupService.getVoiceRecording(response.getId(), otherUser.getId())
        );
    }

    @Test
    void testGetVoiceRecording_MissingStandupThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                standupService.getVoiceRecording(999999L, testUser.getId())
        );
    }
}