# JVM CREW — Production Security Architecture & Policies

## 1. Executive Summary

JVM CREW is an enterprise-grade Team Operating System and AI Learning Platform. This document outlines the security architecture, threat model mitigations, access controls, rate limiting, and production hardening guidelines implemented across the application.

---

## 2. Threat Model & Mitigations Matrix

| Threat Category | Potential Risk | Implemented Defense | Verification |
| :--- | :--- | :--- | :--- |
| **Secret Exposure** | AI API keys or JWT secrets leaked in frontend bundles | All Gemini / AI API keys and JWT signing secrets reside exclusively in backend environment variables (`AI_API_KEY`, `JWT_SECRET`). Client has zero access to raw keys. | Automated grep & bundle scan |
| **Insecure Direct Object Reference (IDOR)** | User manipulating IDs to view/modify other teams' tasks, homework, standups, or follow-ups | Strict server-side verification: Every entity lookup cross-validates `principal.getTeamId()` against target `entity.getTeam().getId()`. | Cross-team test suite |
| **Privilege Escalation** | Regular member attempting Lead-only actions (creating tasks, assignments, reviews) | Spring Security `@PreAuthorize("hasRole('LEAD')")` coupled with server-side validation against active monthly `LeadershipAssignment`. | RBAC test suite |
| **Brute Force & Abuse** | Password guessing, AI token exhaustion, storage flooding | Thread-safe sliding window `RateLimitingFilter`: Auth (10 req/min), AI (30 req/min), Uploads (10 req/min), General (150 req/min) with HTTP 429 + `Retry-After`. | Automated load tests |
| **Path Traversal & Malicious Files** | Uploading `.exe`/scripts or using `../` in file paths | Strict MIME validation (`ALLOWED_AUDIO_MIME_TYPES`), UUID random filenames, team-scoped folder structure, and `Path.normalize()` traversal checks. | Traversal & MIME tests |
| **Clickjacking & XSS** | UI redressing, inline script injection | HTTP security headers: `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. | Header inspection |
| **Information Leakage** | Database stack traces or DB credentials in error responses | Sanitized `GlobalExceptionHandler` and `/health` endpoint returning generic safe messages without internal exception details. | Exception tests |
| **CORS Misconfiguration** | Malicious websites making authenticated cross-origin requests | Explicit origin whitelist (`http://localhost:3000`, configured domain), wildcard origin patterns prohibited when `allowCredentials(true)` is enabled. | CORS OPTIONS probe |

---

## 3. Authentication & Session Architecture

1. **Password Hashing**:
   - Uses Spring Security's `BCryptPasswordEncoder` with a default strength of 10 rounds.
   - Passwords must be at least 6 characters.

2. **Stateless JWT Tokens**:
   - Signed using HMAC-SHA256 with high-entropy secret key (`jwt.secret`).
   - Token payload contains `userId`, `email`, `teamId`, and active dynamic `role` (`LEAD`, `MEMBER`, or `ADMIN`).
   - Default expiration: 24 hours (`86,400,000 ms`).

3. **Dynamic Leadership Role Resolution**:
   - The platform supports monthly rotation of Team Leads.
   - On every request, `CustomUserDetailsService` and `LeadershipService` evaluate whether the user is the active designated Lead for the current calendar date (`LeadershipAssignment`).
   - If an assignment changes or expires, role privileges update dynamically without requiring account recreation.

---

## 4. Multi-Tenant Authorization & IDOR Protection

JVM CREW operates on a strict multi-tenant team isolation boundary:

1. **Entity Scoping**:
   - All primary entities (`Task`, `Homework`, `HomeworkSubmission`, `Standup`, `StandupPdf`, `Blocker`, `FollowUp`, `LeadMessage`) have a foreign key to `Team`.

2. **Service Verification Pattern**:
   - Every service method verifies ownership before reading, modifying, or deleting records:
     ```java
     if (!resource.getTeam().getId().equals(principal.getTeamId())) {
         throw new AccessDeniedException("Unauthorized access to resource from another team");
     }
     ```

3. **Restricted Cross-Team Visibility**:
   - `/api/teams/me`: Returns only the authenticated user's active team.
   - `/api/teams/{id}`: Requires the user to belong to that team or hold the `ADMIN` role.
   - `/api/teams`: Returns organization summaries (`OrganizationTeamSummaryDto`) with public cohort statistics without exposing member PII.

---

## 5. Rate Limiting Specifications

The backend implements `RateLimitingService` and `RateLimitingFilter` operating at the servlet filter level:

| Rate Limit Tier | Window | Threshold | Protected Endpoints | Exceeded Action |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH** | 60 seconds | 10 requests / IP | `/api/auth/login`, `/api/auth/register`, `/api/auth/change-password` | HTTP 429 (`Retry-After: 60`) |
| **AI** | 60 seconds | 30 requests / IP | `/api/interview-lab/**` | HTTP 429 (`Retry-After: 60`) |
| **UPLOAD** | 60 seconds | 10 requests / IP | `/api/standups/submit-voice`, `/api/standups/voice`, `/api/homework/**` | HTTP 429 (`Retry-After: 60`) |
| **GENERAL** | 60 seconds | 150 requests / IP | `/api/**` | HTTP 429 (`Retry-After: 60`) |

### Standard 429 Error Response Payload:
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please wait a moment before trying again.",
  "timestamp": "2026-09-05T20:25:00.000Z"
}
```

---

## 6. HTTP Security Headers & Network Security

In `SecurityConfig.java`, the following security response headers are configured on all HTTP responses:

- **`Content-Security-Policy`**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:8080 http://localhost:3000; frame-ancestors 'none';`
- **`X-Content-Type-Options`**: `nosniff`
- **`X-Frame-Options`**: `DENY`
- **`Referrer-Policy`**: `strict-origin-when-cross-origin`
- **Actuator Security**: `/actuator/health` and `/actuator/info` are permitted; sensitive metrics, environment, and heap dump endpoints are strictly blocked.

---

## 7. Storage & File Security

1. **Storage Isolation**:
   - Voice recordings are stored in structured paths: `uploads/audio/standups/{teamId}/{year}/{month}/{userId}/voice_{date}_{uuid}.webm`
2. **Traversal Prevention**:
   - All paths are resolved and checked using `targetPath.normalize().startsWith(rootPath)`.
3. **MIME & Extension Enforcement**:
   - Allowed MIME types: `audio/webm`, `audio/ogg`, `audio/wav`, `audio/x-wav`, `audio/mp4`, `audio/mpeg`, `audio/mp3`, `audio/aac`, `audio/x-m4a`, `video/webm`, `video/mp4`.
   - Any executable, script, or non-audio MIME type is immediately rejected with HTTP 400.

---

## 8. Production Deployment Checklist

Before deploying to production:

- [ ] **Generate Production Secrets**:
  - Set a 256-bit+ cryptographically secure secret for `JWT_SECRET`.
  - Set valid Gemini API key for `AI_API_KEY`.
  - Update `SPRING_DATASOURCE_PASSWORD`.
- [ ] **Configure Production CORS**:
  - Set `APP_CORS_ALLOWED_ORIGINS` to the exact production domain(s) (e.g., `https://jvmcrew.com`).
- [ ] **TLS / HTTPS**:
  - Terminate TLS at the reverse proxy (Nginx / Cloudflare / Load Balancer) with HTTP-to-HTTPS redirect.
- [ ] **Database Firewall**:
  - Restrict PostgreSQL port 5432 to backend container network only.
