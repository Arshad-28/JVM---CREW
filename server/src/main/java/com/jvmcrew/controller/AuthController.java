package com.jvmcrew.controller;

import com.jvmcrew.config.UserPrincipal;
import com.jvmcrew.dto.AuthRequest;
import com.jvmcrew.dto.AuthResponse;
import com.jvmcrew.dto.RegisterRequest;
import com.jvmcrew.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getCurrentUser(principal));
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.jvmcrew.dto.UpdateAccountRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.updateAccount(principal, request));
    }

    @PostMapping("/change-password")
    public ResponseEntity<java.util.Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody com.jvmcrew.dto.ChangePasswordRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        authService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(java.util.Map.of("message", "Password changed successfully"));
    }
}
