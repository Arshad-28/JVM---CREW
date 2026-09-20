# EngineerSpace — Permanent Engineering Rules for AI & Human Developers

These 30 permanent rules govern all architectural decisions, code changes, testing procedures, and operational practices in EngineerSpace. Every rule is mandatory.

---

### Category I: Architectural & Scope Boundaries
1. **Never Rewrite or Replace Working Architecture**: Respect the existing Java 21 / Spring Boot backend and React / Vite frontend. Do not migrate framework stacks without explicit user instruction.
2. **Designation Fidelity**: The designation is strictly **SDE Intern** (or Team Lead). Never invent corporate titles (e.g., Senior VP, Director of Engineering, Staff Architect).
3. **No Mock Telemetry or Fabricated Metrics**: Never inject mock data, fake charts, or hardcoded fake users into production code paths. If a user or team has 0 records, render a truthful empty state.
4. **Preserve Flyway Schema Migration Sequence**: Never modify an existing, applied Flyway migration file (`V1__` through `V23__`). Always create a new versioned file (`V24__...`) for schema changes.
5. **Keep Frontend Framework Intact**: The frontend uses standard React with Vite and Tailwind CSS. Do not introduce competing CSS frameworks or incompatible build systems.

---

### Category II: Security & Multi-Tenancy
6. **Server-Side Authorization Boundary**: All security and multi-tenant scoping must be strictly enforced on the backend. Never rely on frontend filtering for data access or permissions.
7. **Strict Team Isolation**: Every query accessing team-specific data (`tasks`, `homework`, `standups`, `curriculum`, `notifications`) must filter by the authenticated user's `team_id`.
8. **Stateless JWT Validation**: Validate token signatures, issuer, and expiration on every protected HTTP request via `JwtAuthenticationFilter`.
9. **Dynamic Leadership Resolution**: Always evaluate active leadership through `LeadershipAssignmentRepository` for the current date to determine role authorization.
10. **Zero Hardcoded Secrets**: Secrets (JWT secret, Supabase service keys, Gemini API keys, VAPID private keys) must strictly be loaded from environment variables or Spring configuration properties.
11. **Path Traversal Protection**: Any file-system operation (such as local storage fallback) must sanitize and normalize paths using `normalize()` and verify boundaries using `startsWith()`.
12. **MIME Type & File Size Validation**: Audio and attachment uploads must be validated for allowed MIME types and file size limits before processing or persisting.

---

### Category III: Storage & Standup Voice System
13. **Real Cloud Storage Persistence**: Standup voice recordings must be uploaded to the Supabase Storage bucket (`jvmcrew-files`) with real metadata saved in the database.
14. **Audio Streaming & Byte-Range Support**: Audio streaming endpoints must handle HTTP `Range` headers (`Accept-Ranges: bytes`) for smooth seekable browser playback.
15. **Local Storage Fallback Integrity**: If Supabase storage is unavailable in local offline dev mode, the fallback local storage provider must store files in `uploads/` without corrupting streams.

---

### Category IV: Backend Coding Standards
16. **Jakarta Bean Validation**: Validate all incoming DTOs using `@Valid`, `@NotNull`, `@NotBlank`, `@Size`, and return clear structured validation error responses.
17. **Transactional Consistency**: Annotate service methods that mutate multiple entities with `@Transactional(rollbackFor = Exception.class)`.
18. **Explicit HTTP Status Codes**: Return standard REST response codes (200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Too Many Requests).
19. **Global Exception Handling**: All exceptions must be caught and transformed into standard `ApiResponse<T>` error payloads via `@RestControllerAdvice`.
20. **Audit Trail Logging**: Crucial security and workflow events (role changes, task deletions, leadership rotations) must be recorded in audit tables.

---

### Category V: Frontend Coding Standards
21. **Standardized Layout Containers**: Use standard container widths across all views (`max-w-7xl` for regular, `max-w-[1440px]` for Kanban/Cockpit, `max-w-4xl` for forms/standups) with `px-4 sm:px-6 lg:px-8` horizontal gutters.
22. **Consistent Dark Surfaces**: Follow the global dark color palette (`#0B0F17` base, `#111827` surface 1, `#1F2937` surface 2, `#10B981` primary emerald accent).
23. **Unified Error & Loading UX**: Every asynchronous page and component must handle loading skeletons/spinners, empty states, and error alerts gracefully.
24. **No Broken Links or Anchors**: All navigation links, avatar clicks, and dossier URLs (GitHub, LinkedIn) must be validated, sanitized, and open securely (`rel="noopener noreferrer"`).
25. **Responsive Integrity**: Every UI component must render cleanly without overflow or clipped controls on mobile (320px+), tablet, and desktop viewports.

---

### Category VI: Testing, Quality & Documentation
26. **Automated Verification Before Commit**: Run automated test suites and verify successful builds (`mvn test` and `npm run build`) before publishing changes.
27. **Preserve Documentation Sync**: When introducing an API endpoint, entity change, or configuration variable, update `docs/ARCHITECTURE.md`, `docs/PRD.md`, and `.env.example` in the same commit.
28. **Maintain Clean Git History**: Write descriptive, atomic commit messages detailing rationale rather than generic summaries.
29. **Zero Regression Guarantee**: Any bug fix or refactoring must preserve existing workflows for tasks, standups, homework, curriculum, and interview prep.
30. **Maintain Memory & Decision Logs**: Document all significant design choices in `docs/DECISIONS.md` (ADRs) and update `docs/MEMORY.md` with operational lessons learned.\n