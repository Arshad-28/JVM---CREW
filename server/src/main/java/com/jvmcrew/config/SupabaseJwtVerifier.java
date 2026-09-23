package com.jvmcrew.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class SupabaseJwtVerifier {

    private final String supabaseUrl;
    private final String expectedIssuer;
    private final SecretKey hmacKey;

    public SupabaseJwtVerifier(
            @Value("${app.supabase.url:https://flvddrrjeydnkmyeqiqn.supabase.co}") String supabaseUrl,
            @Value("${app.supabase.jwt-issuer:}") String jwtIssuer,
            @Value("${app.supabase.jwt-secret:${SUPABASE_JWT_SECRET:${jwt.secret:}}}") String jwtSecret
    ) {
        this.supabaseUrl = supabaseUrl != null ? supabaseUrl.replaceAll("/+$", "") : "";
        this.expectedIssuer = StringUtils.hasText(jwtIssuer) ? jwtIssuer : (this.supabaseUrl + "/auth/v1");

        SecretKey key = null;
        if (StringUtils.hasText(jwtSecret)) {
            try {
                // Try Base64 decoding first
                byte[] decoded = Decoders.BASE64.decode(jwtSecret.trim());
                if (decoded.length >= 32) {
                    key = Keys.hmacShaKeyFor(decoded);
                } else {
                    key = Keys.hmacShaKeyFor(jwtSecret.trim().getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                // Fallback to UTF-8 bytes if not standard Base64
                key = Keys.hmacShaKeyFor(jwtSecret.trim().getBytes(StandardCharsets.UTF_8));
            }
        }
        this.hmacKey = key;
        log.info("SupabaseJwtVerifier initialized for issuer: {}", this.expectedIssuer);
    }

    public record VerifiedSupabaseToken(UUID authUserId, String email, String role, Date expiration) {}

    /**
     * Verifies the Supabase JWT signature, issuer, audience, and expiration.
     * Returns the verified claims or null if invalid.
     */
    public VerifiedSupabaseToken verifyToken(String token) {
        if (!StringUtils.hasText(token)) {
            return null;
        }

        try {
            JwtParserBuilder parserBuilder = Jwts.parser();

            if (hmacKey != null) {
                parserBuilder.verifyWith(hmacKey);
            }

            Claims claims = parserBuilder.build()
                    .parseSignedClaims(token.trim())
                    .getPayload();

            // 1. Validate Expiration
            if (claims.getExpiration() != null && claims.getExpiration().before(new Date())) {
                log.warn("Supabase JWT has expired at {}", claims.getExpiration());
                return null;
            }

            // 2. Validate Subject (UUID)
            String sub = claims.getSubject();
            if (!StringUtils.hasText(sub)) {
                log.warn("Supabase JWT missing 'sub' claim");
                return null;
            }

            UUID authUserId;
            try {
                authUserId = UUID.fromString(sub.trim());
            } catch (IllegalArgumentException e) {
                log.warn("Supabase JWT 'sub' claim is not a valid UUID: {}", sub);
                return null;
            }

            // 3. Validate Audience ("authenticated")
            Object audObj = claims.get("aud");
            String aud = audObj != null ? audObj.toString() : null;
            if (aud != null && !aud.contains("authenticated") && !aud.contains("anon")) {
                log.warn("Supabase JWT audience mismatch: {}", aud);
                return null;
            }

            // 4. Validate Issuer if present
            String iss = claims.getIssuer();
            if (StringUtils.hasText(iss) && StringUtils.hasText(expectedIssuer)) {
                String cleanIss = iss.replaceAll("/+$", "");
                String cleanExp = expectedIssuer.replaceAll("/+$", "");
                if (!cleanIss.equalsIgnoreCase(cleanExp) && !cleanIss.contains("supabase.co")) {
                    log.warn("Supabase JWT issuer mismatch. Expected {}, found {}", expectedIssuer, iss);
                    return null;
                }
            }

            String email = claims.get("email", String.class);
            if (!StringUtils.hasText(email)) {
                // If email is not directly in claims, check user_metadata or fallback
                Object metaObj = claims.get("user_metadata");
                if (metaObj instanceof java.util.Map<?, ?> metaMap) {
                    Object metaEmail = metaMap.get("email");
                    if (metaEmail != null) email = metaEmail.toString();
                }
            }

            String role = claims.get("role", String.class);

            return new VerifiedSupabaseToken(authUserId, email != null ? email.toLowerCase().trim() : null, role, claims.getExpiration());
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Supabase JWT verification failed: {}", e.getMessage());
            return null;
        }
    }
}
