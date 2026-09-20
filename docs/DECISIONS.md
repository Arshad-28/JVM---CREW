# EngineerSpace — Architecture Decision Records (ADRs)

This document records the key architectural, technical, and design decisions made throughout the lifecycle of EngineerSpace.

---

### ADR-001: Java 21 LTS & Spring Boot 3.3.4 for Backend
- **Context**: Needed a high-throughput, enterprise-grade backend to handle multi-tenant authentication, real-time audio persistence, AI proxying, and transactional integrity for engineering teams.
- **Decision**: Adopt Java 21 LTS with Spring Boot 3.3.4.
- **Consequences**:
  - High performance with modern Java features (pattern matching, virtual threads readiness).
  - Robust ecosystem for Spring Security, Spring Data JPA, and Flyway.
  - Strong typing and compile-time verification across all business services.

---

### ADR-002: React 18 + Vite + Tailwind CSS for Frontend
- **Context**: Required a responsive, fast-loading, highly customizable UI with developer-friendly dark mode and rapid component development.
- **Decision**: Use React 18 single-page application built with Vite and styled with Tailwind CSS.
- **Consequences**:
  - Instant hot-module replacement (HMR) during development.
  - Utility-first CSS allowing strict container and token standardization without bloated stylesheets.
  - Decoupled deployment from backend (hosted on Netlify CDN).

---

### ADR-003: PostgreSQL on Supabase with Flyway Schema Versioning
- **Context**: Multi-tenant relational data (users, teams, tasks, homework, curriculum progress, standups) requires strict referential integrity and transactional safety.
- **Decision**: Use managed PostgreSQL on Supabase as the production database, with Flyway managing all schema migrations (`V1__` through `V23__`).
- **Consequences**:
  - Fully automated, reproducible database migrations across local Docker, staging, and production.
  - Rock-solid relational constraints (foreign keys, cascading rules, unique indexes).

---

### ADR-004: Supabase Storage for Audio with Local Disk Fallback
- **Context**: Standup voice recordings require durable, cloud-accessible media storage with byte-range streaming support, while local offline development should work without internet access.
- **Decision**: Implement a pluggable `StorageService` with `SupabaseStorageService` (bucket: `jvmcrew-files`) as primary production handler and `LocalStorageService` (`uploads/`) as local fallback.
- **Consequences**:
  - Standup recordings persist permanently in Supabase Cloud Storage.
  - Local development runs seamlessly without external cloud credentials.

---

### ADR-005: Stateless JWT Authentication with Dynamic Monthly Leadership
- **Context**: Team Leads rotate on a monthly calendar schedule among SDE Interns. Changing the database user role permanently would cause historical audit loss and complex re-assignment.
- **Decision**: Keep base user roles clean while dynamically evaluating active `LeadershipAssignment` records for the current date inside `CustomUserDetailsService`.
- **Consequences**:
  - Stateless JWT token flow remains clean.
  - Scheduled leadership rotations take effect automatically on the first day of the month without manual database updates.

---

### ADR-006: Dual AI Engine (Gemini 1.5 Flash + OpenAI Fallback)
- **Context**: The Interview Lab requires high-speed, structured JSON generation for technical interview questions, coding feedback, and rubric evaluation.
- **Decision**: Integrate Google Gemini (`gemini-1.5-flash`) as the primary AI engine, with an OpenAI-compatible client as automated fallback.
- **Consequences**:
  - Sub-second question generation and low latency.
  - Redundancy ensures the Interview Lab remains operational if one AI provider encounters rate limits or outages.

---

### ADR-007: Web Push via VAPID Protocol & Service Worker
- **Context**: SDE Interns need immediate notifications for task assignments, homework reviews, and standup reminders across desktop and mobile browsers.
- **Decision**: Implement standard W3C Web Push using VAPID keys and a native browser Service Worker (`sw.js`).
- **Consequences**:
  - Zero third-party proprietary push SDK lock-in.
  - Works natively across Chrome, Firefox, Edge, and mobile Android browsers.

---

### ADR-008: Strict Server-Side Multi-Tenant Query Scoping
- **Context**: Multiple engineering teams share the same database instance. Data leakage between teams is unacceptable.
- **Decision**: Enforce team scoping (`WHERE team_id = :teamId`) on every JPA query and authenticate team membership inside service layer methods.
- **Consequences**:
  - Zero risk of cross-tenant data leakage or IDOR vulnerabilities.
  - Security is verified at the server boundary regardless of frontend client behavior.

---

### ADR-009: Decoupled Cloud Deployments (Netlify + Render)
- **Context**: The platform needs independent frontend and backend scaling, fast global CDN edge caching for static assets, and low-cost backend hosting.
- **Decision**: Deploy React frontend to Netlify (`engineerspace.netlify.app`) and Spring Boot backend to Render (`jvm-crew.onrender.com`).
- **Consequences**:
  - Frontend deploys in seconds with global edge CDN distribution.
  - Backend runs in containerized Linux environment with automated HTTPS.

---

### ADR-010: Zero Mock Data Governance for Production Telemetry
- **Context**: Development environments often inject dummy telemetry, placeholder percentages, or mock user lists, which can accidentally leak into production dashboards.
- **Decision**: Mandate that all dashboards (My Day, Team Cockpit, Curriculum Mastery, Standups) display strictly real, verified database records or clean empty states.
- **Consequences**:
  - Total truthfulness in engineering productivity metrics.
  - Clear user trust in streak counters, task boards, and mastery percentages.\n