# EngineerSpace — Security Policy & Threat Model

## 1. Security Architecture Overview
EngineerSpace adheres to defense-in-depth security principles. The platform protects sensitive user information, team source code submissions, voice recordings, and AI evaluation data across every layer of the technology stack.

---

## 2. Authentication & Identity Management

### 2.1 Password Hashing & Storage
- Passwords are never stored in plaintext.
- BCrypt hashing with configurable strength (default: 10 rounds) is applied to all passwords before persistence.
- Password change requires verification of the existing password.

### 2.2 JWT (JSON Web Tokens) Implementation
- Signed using HMAC-SHA256 (`HS256`) algorithm with a secure, 256-bit+ secret key.
- Token claims include: `sub` (user email), `userId`, `teamId`, `role`, `iat` (issued at), `exp` (expiration).
- Access tokens have a bounded validity period (24 hours standard).
- Expired or malformed tokens are immediately rejected with HTTP 401.

### 2.3 Role-Based Access Control (RBAC) & Dynamic Leadership
- Roles: `Role.MEMBER` (SDE Intern), `Role.LEAD` (Team Lead), `Role.ADMIN` (Administrator).
- Dynamic role evaluation: On each authenticated request, `CustomUserDetailsService` queries `LeadershipAssignmentRepository` for active calendar leadership assignments, dynamically elevating an SDE Intern to Lead status during their scheduled rotation month without requiring database user schema alteration.

---

## 3. Multi-Tenant Isolation & IDOR Defense

Insecure Direct Object References (IDOR) are strictly mitigated at the persistence layer:
1. **Tenant Filtering**: All queries for tasks, homework, standups, curriculum progress, and notifications include `WHERE team_id = :teamId`.
2. **Principal Verification**: Controllers extract the authenticated `UserPrincipal` directly from `SecurityContextHolder`. Client-supplied user IDs or team IDs in request bodies are validated against the authenticated principal.
3. **Cross-Tenant Blockers**: Attempting to read, update, or delete another team's entity results in HTTP 404 Not Found or HTTP 403 Forbidden.

---

## 4. File Upload & Media Storage Security

### 4.1 Standup Voice Audio
- Uploads are accepted only via authenticated `POST /api/standups/voice`.
- Allowed MIME types: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/ogg`, `audio/mpeg`.
- Max upload size: 25MB per voice recording.
- Storage paths are generated deterministically by the backend: `standups/{teamId}/{year}/{month}/{week}/{fileName}`. Client-supplied file paths are never used.
- Stored assets in Supabase Storage or local disk are served as non-executable binary streams.

### 4.2 Local Storage Fallback Path Traversal Mitigation
When running in local fallback mode:
```java
Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();
if (!targetLocation.startsWith(this.fileStorageLocation)) {
    throw new SecurityException("Cannot store file outside target directory: " + fileName);
}
```

---

## 5. Network & Edge Security

### 5.1 Rate Limiting (`RateLimitingFilter`)
- In-memory token bucket rate limiter tracking requests per IP address.
- Sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/interview-lab/generate`) have strict rate limits (e.g., 20 requests per minute) to prevent credential stuffing and API quota exhaustion.
- Exceeding the rate limit returns HTTP 429 Too Many Requests with `Retry-After` header.

### 5.2 CORS (Cross-Origin Resource Sharing)
- Production CORS whitelist allows requests strictly from the verified frontend domain (`https://engineerspace.netlify.app`) and local development origins (`http://localhost:3000`, `http://localhost:5173`).
- Wildcard `*` origins are strictly forbidden in production mode.

### 5.3 HTTP Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 6. Secrets Management

- **Zero Secrets in Version Control**: `.env` and `application.yml` referencing live secrets are added to `.gitignore`.
- Production credentials are injected via environment variables:
  - `JWT_SECRET`
  - `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY` / `OPENAI_API_KEY`
  - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
  - `SPRING_DATASOURCE_URL` / `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`
- Sanitized template is documented in `.env.example`.

---

## 7. Vulnerability Reporting & Response
If you discover a security vulnerability within EngineerSpace, please report it to the maintainers immediately. All reports will be acknowledged within 24 hours, and patches will be deployed according to severity.\n