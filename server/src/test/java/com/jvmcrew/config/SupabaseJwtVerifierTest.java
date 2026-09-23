package com.jvmcrew.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SupabaseJwtVerifierTest {

    private static final String TEST_SECRET = "super-secret-jwt-key-for-testing-purposes-1234567890";
    private static final String SUPABASE_URL = "https://flvddrrjeydnkmyeqiqn.supabase.co";

    private SupabaseJwtVerifier verifier;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        verifier = new SupabaseJwtVerifier(SUPABASE_URL, "", TEST_SECRET);
        signingKey = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void testValidSupabaseToken() {
        UUID expectedUserId = UUID.randomUUID();
        String expectedEmail = "engineer@example.com";

        String token = Jwts.builder()
                .subject(expectedUserId.toString())
                .claim("email", expectedEmail)
                .claim("role", "authenticated")
                .claim("aud", "authenticated")
                .issuer(SUPABASE_URL + "/auth/v1")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(signingKey)
                .compact();

        SupabaseJwtVerifier.VerifiedSupabaseToken result = verifier.verifyToken(token);

        assertNotNull(result);
        assertEquals(expectedUserId, result.authUserId());
        assertEquals(expectedEmail, result.email());
        assertEquals("authenticated", result.role());
    }

    @Test
    void testExpiredSupabaseToken() {
        UUID expectedUserId = UUID.randomUUID();

        String expiredToken = Jwts.builder()
                .subject(expectedUserId.toString())
                .claim("email", "expired@example.com")
                .claim("aud", "authenticated")
                .issuer(SUPABASE_URL + "/auth/v1")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(signingKey)
                .compact();

        SupabaseJwtVerifier.VerifiedSupabaseToken result = verifier.verifyToken(expiredToken);
        assertNull(result, "Expired token must be rejected");
    }

    @Test
    void testInvalidSignature() {
        SecretKey wrongKey = Keys.hmacShaKeyFor("different-super-secret-key-that-does-not-match-00000".getBytes(StandardCharsets.UTF_8));

        String token = Jwts.builder()
                .subject(UUID.randomUUID().toString())
                .claim("email", "attacker@example.com")
                .claim("aud", "authenticated")
                .issuer(SUPABASE_URL + "/auth/v1")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(wrongKey)
                .compact();

        SupabaseJwtVerifier.VerifiedSupabaseToken result = verifier.verifyToken(token);
        assertNull(result, "Token with mismatched signature must be rejected");
    }

    @Test
    void testNonUuidSubjectRejected() {
        String token = Jwts.builder()
                .subject("not-a-valid-uuid")
                .claim("email", "invalid@example.com")
                .claim("aud", "authenticated")
                .issuer(SUPABASE_URL + "/auth/v1")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(signingKey)
                .compact();

        SupabaseJwtVerifier.VerifiedSupabaseToken result = verifier.verifyToken(token);
        assertNull(result, "Token with non-UUID subject must be rejected");
    }

    @Test
    void testNullAndEmptyToken() {
        assertNull(verifier.verifyToken(null));
        assertNull(verifier.verifyToken(""));
        assertNull(verifier.verifyToken("   "));
        assertNull(verifier.verifyToken("invalid.token.structure"));
    }
}
