package com.jvmcrew.service;

import com.jvmcrew.dto.ForgotPasswordRequest;
import com.jvmcrew.dto.ForgotPasswordResponse;
import com.jvmcrew.dto.ResetPasswordRequest;
import com.jvmcrew.dto.ValidateResetTokenResponse;
import com.jvmcrew.model.PasswordResetToken;
import com.jvmcrew.model.User;
import com.jvmcrew.repository.PasswordResetTokenRepository;
import com.jvmcrew.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final int EXPIRATION_MINUTES = 30;

    /**
     * Process forgot password request.
     * Generates a cryptographically secure token, stores its SHA-256 hash in PostgreSQL,
     * and sends the reset link via EmailService.
     */
    @Transactional
    public ForgotPasswordResponse processForgotPassword(ForgotPasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getEmail())) {
            return ForgotPasswordResponse.builder()
                    .message("If an account exists for this email, a password reset link will be provided.")
                    .emailSent(false)
                    .build();
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.info("Password reset requested for non-existent email: {}", email);
            return ForgotPasswordResponse.builder()
                    .message("If an account exists for this email, a password reset link will be provided.")
                    .emailSent(false)
                    .build();
        }

        User user = userOpt.get();

        // Generate 256-bit secure URL-safe random token
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);

        // Invalidate any existing unused reset tokens for this user
        List<PasswordResetToken> existingTokens = passwordResetTokenRepository.findAllByUser(user);
        for (PasswordResetToken t : existingTokens) {
            if (t.getUsedAt() == null) {
                t.setUsedAt(Instant.now());
            }
        }
        passwordResetTokenRepository.saveAll(existingTokens);

        // Save new single-use token with token_hash
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .createdAt(Instant.now())
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetLink = emailService.getFrontendUrl() + "/reset-password?token=" + rawToken;
        boolean emailSent = emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetLink);

        ForgotPasswordResponse.ForgotPasswordResponseBuilder responseBuilder = ForgotPasswordResponse.builder()
                .message("If an account exists for this email, a password reset link will be provided.")
                .emailSent(emailSent);

        if (!emailSent) {
            if (!emailService.isConfigured()) {
                responseBuilder.note("SMTP email service is not configured in the environment. Password reset link generated.");
                responseBuilder.resetLink(resetLink);
            } else {
                responseBuilder.note("Unable to deliver email via SMTP. Please verify mail server connectivity.");
            }
        }

        return responseBuilder.build();
    }

    /**
     * Validate if a reset token is present, non-expired, and unused.
     */
    @Transactional(readOnly = true)
    public ValidateResetTokenResponse validateToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            return ValidateResetTokenResponse.builder()
                    .valid(false)
                    .message("Reset token is required.")
                    .build();
        }

        String tokenHash = hashToken(rawToken.trim());
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByTokenHash(tokenHash);

        if (tokenOpt.isEmpty()) {
            return ValidateResetTokenResponse.builder()
                    .valid(false)
                    .message("Reset link is invalid.")
                    .build();
        }

        PasswordResetToken token = tokenOpt.get();

        if (token.isUsed()) {
            return ValidateResetTokenResponse.builder()
                    .valid(false)
                    .message("Reset link has already been used.")
                    .build();
        }

        if (token.isExpired()) {
            return ValidateResetTokenResponse.builder()
                    .valid(false)
                    .message("Reset link has expired. Please request a new one.")
                    .build();
        }

        return ValidateResetTokenResponse.builder()
                .valid(true)
                .message("Token is valid.")
                .build();
    }

    /**
     * Reset password using a valid, non-expired token.
     * ONLY modifies the passwordHash field of the existing user.
     * Preserves user ID, email, role, team ID, memberships, and all other data.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || !StringUtils.hasText(request.getToken())) {
            throw new IllegalArgumentException("Reset token is required.");
        }

        if (!StringUtils.hasText(request.getNewPassword()) || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters.");
        }

        String tokenHash = hashToken(request.getToken().trim());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid."));

        if (token.isUsed()) {
            throw new IllegalArgumentException("Reset link has already been used. Please request a new one.");
        }

        if (token.isExpired()) {
            throw new IllegalArgumentException("Reset link has expired. Please request a new one.");
        }

        User user = token.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Associated user not found.");
        }

        // Hash new password using BCrypt and update ONLY passwordHash
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);

        // Mark token as used
        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        log.info("Password reset successfully completed for user ID: {}, email: {}", user.getId(), user.getEmail());
    }

    /**
     * Compute SHA-256 hash of raw token for secure database storage.
     */
    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
