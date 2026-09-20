# EngineerSpace — Global Design System & UI/UX Standards

## 1. Design System Philosophy
EngineerSpace provides a cohesive, high-density, and accessible developer workspace. The UI is designed to feel like a modern, professional engineering terminal with clean dark surfaces, high-contrast typography, and purposeful micro-interactions.

---

## 2. Layout & Container Architecture

To maintain strict visual alignment across all views, every page in EngineerSpace adheres to standardized container widths:

| Container Spec | Tailwind Class | Max Width | Usage Context |
| :--- | :--- | :--- | :--- |
| **Standard Container** | `max-w-7xl mx-auto` | `1280px` | Default for most views: My Day, Homework, Curriculum, Notifications, Profile |
| **Wide Container** | `max-w-[1440px] mx-auto` | `1440px` | High-density data views: Tasks Kanban Board, Team Cockpit, Coding Arena |
| **Narrow Container** | `max-w-4xl mx-auto` | `896px` | Focused reading & editing: Standup Studio, Homework Submission Form, Auth views |

### 2.1 Standard Gutters & Padding
Every page container must use consistent horizontal padding across breakpoints:
```html
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
  {/* Page Content */}
</div>
```

---

## 3. Color Tokens & Palette

### 3.1 Dark Mode Surfaces (Primary Theme)
- **Background Base**: `#0B0F17` (Deep space slate) — Page background.
- **Surface Layer 1**: `#111827` (Tailwind `gray-900` / `zinc-900`) — Cards, navigation bars, sidebars.
- **Surface Layer 2**: `#1F2937` (Tailwind `gray-800`) — Modals, popovers, elevated panels.
- **Surface Layer 3**: `#374151` (Tailwind `gray-700`) — Input fields, active tabs, hovered items.
- **Border Default**: `rgba(255, 255, 255, 0.08)` or Tailwind `border-white/10` / `border-gray-800`.
- **Border Active**: `rgba(255, 255, 255, 0.20)` or Tailwind `border-white/20`.

### 3.2 Accent & Brand Colors
- **Primary Accent**: Emerald (`#10B981` / `emerald-500`) — Primary actions, active streaks, success indicators.
- **Secondary Accent**: Cyan (`#06B6D4` / `cyan-500`) — Technical metrics, code highlights, secondary badges.
- **Tertiary Accent**: Indigo (`#6366F1` / `indigo-500`) — Interview Lab, AI coaching, cognitive features.

### 3.3 Status & Semantic Tokens
- **Success**: `#22C55E` (`green-500`) — Completed tasks, passing tests, reviewed homework.
- **Warning**: `#F59E0B` (`amber-500`) — In-review tasks, pending submissions, blockers detected.
- **Danger / Error**: `#EF4444` (`red-500`) — High priority alerts, failing test cases, deletion actions.
- **Info**: `#3B82F6` (`blue-500`) — System announcements, informative callouts.

---

## 4. Typography & Font Hierarchy

### 4.1 Font Family
- **Primary Sans**: `Inter`, `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif.
- **Monospace (Code & Metrics)**: `JetBrains Mono`, `Fira Code`, `ui-monospace`, monospace.

### 4.2 Type Scale
- **H1 (Page Titles)**: `text-2xl sm:text-3xl font-bold tracking-tight text-white`
- **H2 (Section Headings)**: `text-xl sm:text-2xl font-semibold tracking-tight text-white`
- **H3 (Card & Panel Headings)**: `text-base sm:text-lg font-medium text-white`
- **Body Regular**: `text-sm text-gray-300 leading-relaxed`
- **Body Small / Meta**: `text-xs text-gray-400 font-medium`
- **Code Snippets**: `font-mono text-xs bg-black/40 px-1.5 py-0.5 rounded border border-white/5`

---

## 5. UI Component Standards

### 5.1 Buttons
All interactive buttons must have explicit states (`default`, `hover`, `focus-visible`, `disabled`, `loading`):
- **Primary Button**: `bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`
- **Secondary Button**: `bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-medium px-4 py-2 rounded-lg transition-colors`
- **Ghost Button**: `hover:bg-gray-800/60 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors`
- **Danger Button**: `bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition-colors`

### 5.2 Cards & Containers
- Cards use unified borders and subtle dark gradients:
  `bg-gray-900/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 shadow-lg hover:border-white/20 transition-all`

### 5.3 Modals & Overlays
- Centered on screen with fixed position, `z-50` index.
- Backdrop blur: `fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4`.
- Modal panel: `bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative`.
- Always support closing via `Escape` key and clicking the backdrop.

### 5.4 Form Inputs & Selects
- Inputs must have explicit labels, consistent height (`h-10`), and accessible focus rings:
  `bg-gray-800/80 border border-gray-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all`

---

## 6. Animation & Motion Guidelines

- Use subtle, spring-based transitions via Framer Motion for interactive polish.
- Page Enter Transitions: Smooth fade and slide up (`initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}`).
- Micro-interactions: Scale on hover for interactive badges and cards (`whileHover={{ scale: 1.01 }}`).
- Audio Visualizer: Real-time frequency bars with smooth height easing.
- Respect `prefers-reduced-motion`: Disable non-essential animations when requested by system settings.

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Grid Layout Standard |
| :--- | :--- | :--- |
| **Mobile (`< 640px`)** | 320px–639px | Single column (1 col), full width buttons, compact header |
| **Tablet (`640px–1023px`)** | 640px–1023px | 2-column grid, expandable sidebar navigation |
| **Desktop (`>= 1024px`)** | 1024px–1279px | 3-column grid or sidebar + main content |
| **Wide Screen (`>= 1280px`)**| 1280px+ | Multi-column Kanban board, dual-pane editor layouts |

---

## 8. Truthful Empty States & Error Handling

- Never display fabricated statistics or placeholder charts when data is absent.
- Standard Empty State Pattern:
  - Central icon in muted gray circle (`w-12 h-12 text-gray-500 bg-gray-800/50 rounded-full p-3`).
  - Clear heading explaining the empty condition (e.g., "No tasks in progress").
  - Informative subtext explaining how to populate data (e.g., "Tasks moved from backlog will appear here.").
  - Actionable CTA button when permitted by user role (e.g., "Create First Task").\n