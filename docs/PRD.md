# EngineerSpace — Product Requirement Document (PRD)

## 1. Product Overview
- **Product Name**: EngineerSpace (Engineering Team Operating System & AI Learning Platform)
- **Production URL**: https://engineerspace.netlify.app
- **Backend API URL**: https://jvm-crew.onrender.com
- **Target Audience**: Engineering interns (SDE Interns) and rotating Team Leads.
- **Capacity**: Multi-tenant architecture supporting ~50 interns across ~10 teams (~5 members per team) with monthly Team Lead rotation.

---

## 2. Product Purpose
EngineerSpace is a unified engineering productivity and technical learning workspace for software engineering cohorts. It provides daily workflow management, task assignment, homework tracking, curriculum roadmaps, standups with audio voice recordings, peer collaboration, digital identity profiles, and AI-powered technical interview preparation.

---

## 3. Core Product Modules

### 3.1 Authentication & Session Management
- **User Registration**: New Team Leads can register a unique team with an organization name, full name, email, and password. The registrant is automatically assigned TEAMNAME-001 Crew ID, Role.LEAD, and active monthly leadership status.
- **User Login**: Secure authentication with email and BCrypt password hash. Returns a signed JWT token containing userId, email, 	eamId, and dynamic 
ole.
- **Dynamic Role Resolution**: Evaluates active LeadershipAssignment for the current calendar date on every request.
- **Account & Security Settings**: Self-service profile editing (name, phone, college, internship organization, bio, social links, avatars), password change, and notification preferences.

### 3.2 My Day (Command Center & Workspace)
- **Member Workspace**:
  - Daily mission checklist and streak counter.
  - Quick action to open/submit Daily Standup (text or audio).
  - Assigned active tasks strip with priority levels (HIGH, MEDIUM, LOW).
  - Homework submissions progress and deadlines.
  - Interview preparation momentum and quick start prompts.
- **Lead Daily Brief**:
  - Morning operational summary for the active Team Lead.
  - Live standup submission rate and active member count.
  - Team blocker alerts and pending homework reviews.
  - Quick actions to trigger team reminders or review submissions.

### 3.3 Tasks (Kanban Board & Mission Control)
- **4-Stage Workflow**: BACKLOG → IN_PROGRESS → IN_REVIEW → DONE.
- **Role Permissions**:
  - **Team Lead**: Full CRUD — Create tasks, assign to members, edit priority/milestones, move stages, and delete tasks.
  - **Member**: Views assigned tasks, updates task progress stages, and submits comments.
- **Audit & History**: Task comments and event history tracking all stage movements.
- **Team Isolation**: Tasks are strictly bound to 	eam_id. Members cannot access or modify tasks belonging to other teams.

### 3.4 Homework Center
- **Assignment Lifecycle**: DRAFT → PUBLISHED → SUBMITTED → REVIEWED.
- **Submission Formats**: Code submissions, repository links, text summaries, and feedback.
- **Solution Visibility**: Solution guides remain hidden until explicitly published by the Lead or after review completion.
- **Lead Controls**: Create assignments, publish solutions, grade/review submissions with score (0–100) and feedback, send reminder notifications to unsubmitted members.

### 3.5 SDE Curriculum Tracker
- **Hierarchical Structure**: Major Subjects (e.g., *Java Foundations*, *Data Structures*, *System Design*) containing ordered Learning Topics.
- **Personal Mastery States**: NOT_STARTED → IN_PROGRESS → DONE.
- **Real-Time Dynamic Metrics**: Overall mastery percentage and topic completion counts derived strictly from real user database records (no fake progress metrics).
- **Lead Controls**: Add subjects, add topics, reorder index, and delete topics.

### 3.6 Daily Standup System (Written & Audio Studio)
- **Check-In Structure**: Accomplishments (Yesterday), Planned Work (Today), Learnings, Blockers, Confidence Rating (1–5), Question for Lead.
- **Voice Audio Studio**:
  - Direct in-browser audio recording (Opus/WebM, AAC, WAV).
  - Live audio visualizer and duration counter.
  - Uploaded to persistent Supabase Cloud Storage (jvmcrew-files) with local fallback.
  - Audio streaming endpoint with byte-range support for seekable in-browser playback.
- **PDF Generation**: Automated PDF generation for individual standups and aggregate daily team standup summaries.
- **Lead Interaction**: Lead can review submissions, answer questions directly, and log follow-up actions.

### 3.7 Interview Lab & AI Coaching
- **Mock Interviews**: Interactive AI technical interviews across topics (Java Core, Spring Boot, DSA, System Design).
- **Practice Questions**: AI-generated conceptual questions with progressive hint levels and AI evaluation.
- **Coding Arena**: In-browser coding challenges with test case verification, complexity analysis, and AI feedback.
- **Weakness & Recommendation Engine**: Tracks user attempt scores and generates personalized focus recommendations.
- **Provider Redundancy**: Dual AI provider engine supporting Google Gemini (gemini-3.6-flash) and OpenAI-compatible endpoints with graceful degradation when AI is unavailable.

### 3.8 Team Cockpit & Telemetry (Lead View)
- **Member Roster**: Real-time overview of all enrolled members, active topics, standup compliance, and task completion.
- **Leadership Rotation Management**: Schedule upcoming monthly Lead assignments, rotate leadership, and maintain historical rotation records.
- **Monthly Lecturer Reports**: Comprehensive report generator compiling monthly team metrics, attendance, and project completions.

### 3.9 Meet the Crew & Digital Identity Cards
- **3D Collectible Character Cards**: Interactive 3D cards displaying member avatar, serial number (TEAM-001), role, college, bio, and social dossier links.
- **Avatar Gallery**: Categorized avatar selector (anime styles, professional icons).
- **Dossier Links**: Validated and normalized GitHub and LinkedIn URLs.

### 3.10 Notification System
- **Multi-Channel**: Real-time in-app notification center + Web Push notifications via Service Worker (sw.js) and VAPID keys.
- **Triggers**: Task assignments, homework published, homework reviewed, standup reminders, lead announcements.
- **User Preferences**: Granular toggle controls for each notification category.

---

## 4. Role & Permission Matrix

| Feature / Action | SDE Intern (MEMBER) | Team Lead (LEAD) | Administrator (ADMIN) |
| :--- | :---: | :---: | :---: |
| View My Day & Personal Tasks | ✅ | ✅ | ✅ |
| Submit Daily Standup (Voice / Text) | ✅ | ✅ | ✅ |
| Update Personal Task Status | ✅ | ✅ | ✅ |
| Create / Edit / Delete Tasks | ❌ | ✅ | ✅ |
| Submit Homework | ✅ | ✅ | ✅ |
| Create / Review Homework | ❌ | ✅ | ✅ |
| Advance Personal Curriculum | ✅ | ✅ | ✅ |
| Create / Edit Curriculum Topics | ❌ | ✅ | ✅ |
| Use Interview Lab & AI Coach | ✅ | ✅ | ✅ |
| View Team Roster & Cockpit | Read Only | ✅ | ✅ |
| Manage Team Members & Roles | ❌ | ✅ | ✅ |
| Schedule Leadership Rotation | ❌ | ✅ | ✅ |
| Edit Personal Profile & Card | ✅ | ✅ | ✅ |

---

## 5. Non-Functional Requirements
- **Security Boundary**: All team data authorization enforced server-side. Never rely on frontend filtering.
- **Truthful Telemetry**: Zero mock data or fabricated metrics. Empty states must truthfully communicate when data does not exist.
- **Responsive Standard**: Flawless layout and interaction across mobile (320px, 375px, 430px), tablet (768px), and desktop (1024px, 1280px, 1440px).
- **Performance**: Sub-100ms API response times under standard load; client-side adaptive timeout with friendly UX states for cloud backend cold starts.
