# EngineerSpace — Master Test Plan & QA Strategy

## 1. Overview & Test Objectives
This document establishes the end-to-end verification strategy for EngineerSpace. It covers unit testing, integration testing, security authorization verification, audio persistence validation, and automated regression testing.

---

## 2. Testing Layers & Tools

```
+-------------------------------------------------------------+
|               End-to-End & Acceptance Tests                 |
|               (Playwright / Manual Scenarios)               |
+-------------------------------------------------------------+
|               Frontend Component & Unit Tests               |
|               (Vitest + React Testing Library)              |
+-------------------------------------------------------------+
|              Backend Controller & Integration               |
|              (Spring Boot Test, MockMvc, H2/Testcontainers) |
+-------------------------------------------------------------+
|                  Backend Unit & Domain Tests                |
|                  (JUnit 5, Mockito, AssertJ)                |
+-------------------------------------------------------------+
```

---

## 3. Backend Test Matrix

### 3.1 Authentication & Authorization Tests (`AuthControllerTest`, `SecurityTest`)
- [x] User registration generates valid BCrypt hash and default `Role.LEAD` for team creator.
- [x] Login with valid credentials returns signed JWT containing `userId`, `email`, `teamId`, `role`.
- [x] Login with invalid password returns HTTP 401 Unauthorized.
- [x] Request with expired JWT returns HTTP 401 Unauthorized with token expired header.
- [x] Request with tampered signature returns HTTP 401 Unauthorized.
- [x] Dynamic leadership rotation correctly switches effective role to `LEAD` for active month and reverts to `MEMBER` thereafter.

### 3.2 Multi-Tenant Team Isolation Tests (`TeamIsolationTest`)
- [x] Member of Team A cannot retrieve tasks belonging to Team B (returns HTTP 404 or 403).
- [x] Member of Team A cannot view or submit homework belonging to Team B.
- [x] Member of Team A cannot stream standup audio recorded by Team B.
- [x] Lead of Team A cannot modify curriculum topics belonging to Team B.

### 3.3 Task Management Lifecycle Tests (`TaskServiceTest`)
- [x] Lead creates task -> Task enters `BACKLOG` with assigned member ID and team ID.
- [x] Member moves task from `BACKLOG` -> `IN_PROGRESS` -> `IN_REVIEW`.
- [x] Lead moves task from `IN_REVIEW` -> `DONE`.
- [x] Member attempt to delete task returns HTTP 403 Forbidden.
- [x] Lead deletes task -> Task removed, audit event logged.

### 3.4 Standup & Audio Storage Tests (`StandupServiceTest`, `StorageServiceTest`)
- [x] Standup submission without audio saves text check-in successfully.
- [x] Voice standup upload validates MIME type (`audio/webm`, `audio/wav`).
- [x] Disallowed MIME types (e.g. `application/x-sh`, `image/png`) rejected with HTTP 400 Bad Request.
- [x] Supabase Storage upload stores binary at `standups/{teamId}/{year}/{month}/{week}/{fileName}`.
- [x] Audio streaming endpoint supports `Range: bytes=0-1024` with HTTP 206 Partial Content.
- [x] Local storage fallback correctly stores and retrieves audio if cloud storage is disabled.

### 3.5 Homework & Grading Tests (`HomeworkServiceTest`)
- [x] Lead creates homework assignment in `DRAFT` state.
- [x] Lead publishes homework -> Broadcast notification triggered to all team members.
- [x] Member submits code and repository URL before deadline -> Submission state set to `SUBMITTED`.
- [x] Lead grades submission with score (0–100) and review feedback -> Status set to `REVIEWED`.
- [x] Solution remains hidden to member until published by Lead.

### 3.6 Interview Lab & AI Coaching Tests (`InterviewLabServiceTest`, `AIServiceTest`)
- [x] Requesting mock interview generates structured questions via Gemini AI.
- [x] If Gemini fails or times out, fallback to secondary provider or pre-compiled question set.
- [x] Practice question evaluation accurately scores candidate answer (0–100) with key strengths and improvement areas.
- [x] Coding arena test runner executes candidate code against visible and hidden test cases.

---

## 4. Frontend Verification Suite

### 4.1 Automated Component & State Tests (Vitest + RTL)
- `AuthContext`: Persists token on login, clears storage on logout, handles expired token redirect.
- `TaskBoard`: Renders 4 columns (`BACKLOG`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), allows drag-and-drop state changes for authorized roles.
- `StandupStudio`: Handles microphone permission request, displays real-time recording timer and audio visualizer, triggers audio upload.
- `HomeworkCenter`: Displays submission badge, reveals solution only when marked published.
- `NotificationBell`: Updates unread badge count, opens interactive dropdown, registers Web Push service worker.

### 4.2 Responsive Layout Verification
- **Mobile Viewport (375px x 667px)**:
  - Sidebar collapses into accessible mobile drawer.
  - Kanban board offers horizontal scroll or tabbed column selector.
  - Buttons maintain minimum 44px touch targets.
- **Tablet Viewport (768px x 1024px)**:
  - Two-column grid for My Day widgets and Homework cards.
- **Desktop Viewport (1440px x 900px)**:
  - Full wide-screen display with zero horizontal overflow.

---

## 5. Security & Penetration Checklist

| Test Item | Attack Vector / Check | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **IDOR Check** | Member requests `/api/tasks/999` (other team's task) | HTTP 404 / 403 | PASS |
| **Privilege Escalation** | Member calls `POST /api/homework` (create assignment) | HTTP 403 Forbidden | PASS |
| **SQL Injection** | Input `' OR 1=1 --` into search/filter fields | Parameterized via JPA | PASS |
| **XSS Prevention** | Submit `<script>alert(1)</script>` in task comments | Escaped by React / sanitized | PASS |
| **Path Traversal** | Request `/api/standups/audio/..%2F..%2Fetc%2Fpasswd` | Path normalized & blocked | PASS |
| **Rate Limiting** | 100 rapid login requests from single IP | HTTP 429 Too Many Requests | PASS |
| **CORS Policy** | Request from unauthorized domain `evil.com` | Blocked by CORS filter | PASS |

---

## 6. Execution Commands

### Run Backend Tests
```bash
cd server
./mvnw clean test
```

### Run Backend Tests with Coverage Report
```bash
cd server
./mvnw clean test jacoco:report
```

### Run Frontend Build & Typecheck
```bash
cd client
npm run build
```\n