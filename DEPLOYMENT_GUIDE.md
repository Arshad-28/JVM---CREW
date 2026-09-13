# JVM CREW — Production Deployment Guide
**Architecture**: Netlify (Frontend) → Render (Backend) → Supabase (PostgreSQL & Persistent Storage)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│               User Browser (HTTPS)                     │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  Netlify SPA    │         │  Render Backend │
    │  (React / Vite) │────────▶│  (Spring Boot)  │
    └─────────────────┘  /api   └────────┬────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │                               │
                         ▼                               ▼
               ┌───────────────────┐           ┌───────────────────┐
               │ Supabase Database │           │  Supabase Storage │
               │   (PostgreSQL)    │           │  (Voice Standups) │
               └───────────────────┘           └───────────────────┘
```

---

## 1. Supabase Setup (Database & Storage)

### A. Create Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Set your Project Name (e.g., `jvmcrew-prod`) and a secure Database Password.
3. Select your preferred region (e.g., `South Asia (Mumbai) - ap-south-1` or closest to users).

### B. Retrieve Database Connection Details
1. Go to **Project Settings** → **Database**.
2. Under **Connection Pooling**, select **Session Mode** (port `6543`) or **Direct connection** (port `5432`).
3. Note the host, port, database (`postgres`), username (`postgres.<project-ref>`), and your database password.
4. The JDBC URL format:
   ```
   jdbc:postgresql://<pooler-host>:6543/postgres?sslmode=require
   ```

### C. Create Audio Storage Bucket
1. In Supabase dashboard, click **Storage** → **Create a new bucket**.
2. Bucket name: `jvmcrew-audio`
3. Privacy: **Private** (recommended; access is securely authenticated and mediated by the Spring Boot backend).
4. Go to **Project Settings** → **API**.
5. Copy your **Project URL** (`https://<project-ref>.supabase.co`) and **`service_role` (secret) key**.
   > [!IMPORTANT]
   > The `service_role` secret key is only entered in Render backend environment variables and is never exposed to the frontend.

---

## 2. Render Setup (Spring Boot Backend)

### A. Create Web Service
1. Log in to [Render](https://render.com) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/Arshad-28/JVM---CREW`.
3. Configure the service settings:
   - **Name**: `jvmcrew-backend`
   - **Root Directory**: `server`
   - **Runtime / Environment**: `Docker` (Render will build `server/Dockerfile`)
   - **Region**: Same region as Supabase (or closest)
   - **Instance Type**: Free (or Starter)
   - **Health Check Path**: `/health`

### B. Backend Environment Variables (Render Dashboard)
Add the following environment variables in the Render **Environment** tab:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Assigned automatically by Render |
| `SERVER_ADDRESS` | `0.0.0.0` | Binds to all network interfaces |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<pooler-host>:6543/postgres?sslmode=require` | Supabase PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` | Supabase database user |
| `SPRING_DATASOURCE_PASSWORD` | `<your-supabase-db-password>` | Supabase database password |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `validate` | Validates schema against Flyway migrations |
| `SPRING_FLYWAY_ENABLED` | `true` | Automatically executes all 20 schema migrations on startup |
| `JWT_SECRET` | `<64-char-hex-key>` | Secure random secret for JWT signing |
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.netlify.app` | Comma-separated allowed frontend origins |
| `STORAGE_PROVIDER` | `supabase` | Enables persistent cloud storage |
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` | Supabase API endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | `<supabase-service-role-secret>` | Backend secret for private bucket operations |
| `SUPABASE_STORAGE_BUCKET` | `jvmcrew-audio` | Storage bucket name |
| `AI_PROVIDER` | `gemini` | AI provider for Interview Lab |
| `AI_API_KEY` | `<your-gemini-api-key>` | Google Gemini API key |
| `AI_MODEL` | `gemini-3.6-flash` | Gemini model name |

---

## 3. Netlify Setup (React / Vite Frontend)

### A. Create Site
1. Log in to [Netlify](https://netlify.com) and click **Add new site** → **Import an existing project**.
2. Connect your GitHub repository: `https://github.com/Arshad-28/JVM---CREW`.
3. Netlify will auto-detect the root `netlify.toml` file:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### B. Frontend Environment Variables (Netlify Dashboard)
In Netlify **Site configuration** → **Environment variables**:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://jvmcrew-backend.onrender.com/api` | Direct HTTPS API endpoint to Render backend |

*(Alternatively, if you prefer Netlify proxying without CORS, leave `VITE_API_BASE_URL` unset and add a proxy rule in `client/public/_redirects`).*

---

## 4. Free-Tier Considerations & Best Practices

1. **Render Free Instance Sleep**:
   - Render Free Web Services spin down after 15 minutes of inactivity.
   - The initial request after sleep takes 30–50 seconds while the Java container boots.
   - Once awake, response times return to standard sub-100ms.
2. **Supabase Inactivity Pausing**:
   - Supabase free tier databases pause after 7 days of inactivity. Simply unpause via dashboard if needed.
3. **Data & File Persistence**:
   - Standup voice recordings are stored in Supabase Storage (`jvmcrew-audio`), ensuring zero data loss during Render container restarts or redeploys.
   - Standup PDFs, Homework submissions, and solutions are stored directly in PostgreSQL tables (`standup_pdfs`, `homework_submissions`).

---

## 5. Local Development vs Production

Local development remains 100% Docker Compose-based:
```bash
# Start local stack with local PostgreSQL and local filesystem storage
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Local PostgreSQL: `localhost:5432`
- Storage: Local filesystem directory `./uploads/audio`
