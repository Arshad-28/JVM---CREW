# EngineerSpace — Living Project Memory & Operational Runbook

## 1. System Identity & Overview
- **Product Name**: EngineerSpace
- **Domain / Host**: `https://engineerspace.netlify.app`
- **Backend API**: `https://jvm-crew.onrender.com`
- **Database**: PostgreSQL on Supabase (`jvmcrew-files` bucket for media storage)
- **Repository Structure**:
  - `client/`: React 18, Vite, TypeScript, Tailwind CSS
  - `server/`: Java 21, Spring Boot 3.3.4, Spring Data JPA, Flyway (V1..V23)
  - `docs/`: Complete project governance, architecture, design, security, and test plan docs
  - `docker-compose.yml`: Multi-container local orchestration (Postgres, Backend, Frontend)

---

## 2. Verified Active Features
- **Authentication**: JWT login, registration, password change, profile dossier management.
- **My Day**: Personal command center, daily streak tracker, active task strip, homework milestones, lead brief.
- **Tasks (Kanban)**: 4-stage workflow (Backlog, In Progress, In Review, Done), drag & drop, task comments, audit log.
- **Homework Center**: Assignment publishing, solution reveal controls, code/link submissions, grading rubric (0–100).
- **Curriculum Roadmap**: Hierarchical subjects & topics, progress states (Not Started, In Progress, Done), real calculated mastery %.
- **Daily Standups & Audio Studio**: Check-in form, in-browser audio recorder (WebM/Opus), Supabase Cloud Storage persistence, byte-range streaming, PDF export.
- **Interview Lab**: AI mock interviews (Gemini 1.5 Flash + OpenAI fallback), practice questions with hints, coding arena challenge runner.
- **Team Cockpit & Digital Identity**: Team member roster, monthly leadership rotation management, 3D collectible character cards, avatar selector.
- **Notifications**: In-app inbox, VAPID Web Push notifications via Service Worker.

---

## 3. Critical Component Locations
| Purpose | Key File / Path |
| :--- | :--- |
| **API Client** | `client/src/services/api.ts` |
| **Auth Context** | `client/src/context/AuthContext.tsx` |
| **App Routing** | `client/src/App.tsx` |
| **Vite Config & Proxy** | `client/vite.config.ts` |
| **Security Config** | `server/src/main/java/com/jvmcrew/config/SecurityConfig.java` |
| **JWT Token Provider** | `server/src/main/java/com/jvmcrew/security/JwtTokenProvider.java` |
| **User Details Service** | `server/src/main/java/com/jvmcrew/security/CustomUserDetailsService.java` |
| **Rate Limiter Filter** | `server/src/main/java/com/jvmcrew/security/RateLimitingFilter.java` |
| **Storage Service** | `server/src/main/java/com/jvmcrew/service/SupabaseStorageService.java` |
| **AI Integration** | `server/src/main/java/com/jvmcrew/service/AIService.java` |
| **Flyway Migrations** | `server/src/main/resources/db/migration/` (V1 to V23) |
| **Application Config** | `server/src/main/resources/application.yml` |

---

## 4. Known Gotchas & Operational Notes
1. **Render Free Tier Cold Starts**: The backend on Render may take 30–50 seconds to wake up from idle on the free tier. The client includes adaptive timeout handling and a warming ping.
2. **Audio MIME Types**: Different browsers record audio with different MIME types (Chrome/Firefox: `audio/webm;codecs=opus`, Safari: `audio/mp4` or `audio/wav`). The backend validator supports all standard audio types.
3. **PowerShell Special Characters**: In local Windows PowerShell environments, inline commands containing `&`, `|`, or `+` must be wrapped in scripts or here-strings.
4. **Flyway Migration Immutability**: Never alter an existing applied migration file. Always create a new sequential file `V{N+1}__description.sql`.
5. **Role Designation**: The default intern title is strictly **SDE Intern**; team creators hold the rotating **Team Lead** role.\n