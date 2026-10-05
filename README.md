# studEZ — Unified CampusOS & AI Education Platform

> A modern, multi-role campus management platform engineered for **Students**, **Teachers**, and **Administrators** with real-time academic workflows, SQLite single source of truth, open-source AI tutoring agent, and React Bits WebGL visual effects.

---

## Key Features

### 1. Robust Multi-Role Authorization & Access Control
- **Strict Role Lockdown**: Dedicated interfaces and permissions for **Admin**, **Teacher**, and **Student**.
- **No In-Session Role Switching**: Direct role manipulation on active sessions is disallowed (`403 Forbidden`). Users must sign out and log in with their required account credentials.
- **Role Isolation**:
  - **Teacher**: Course-assigned records, mark student attendance, review assignments, grade submissions.
  - **Student**: View personalized attendance percentages, download notes, submit assignments, study planner.
  - **Admin**: Full campus CRUD for users, departments, courses, announcements, and global settings.

### 2. Single Source of Truth Relational Database
- Powered by embedded SQLite / LibSQL client.
- Zero mock or `localStorage` data for critical workflows.
- Immediate real-time reflection of changes across all dashboards.

### 3. Open-Source AI Agent (Gemma / Google AI)
- Intelligent campus tutor for course queries, study planning, code debugging, and concept explanations.
- Streaming responses with Markdown, syntax highlighting, and conversational memory.

### 4. React Bits WebGL Visual Effects
- **`<LightTunnel />`**: High-performance WebGL2 fibre-optic tunnel background radiating pulses through the vanishing point.
- **`<GlowCursor />`**: Fluid glowing particle cursor trail following pointer interactions with `screen` blend mode.
- **Performance Optimized**: Capped device pixel ratio (`1.25x`), `pointer-events-none` on interactive layers, and automatic animation pausing on background tabs via `IntersectionObserver` & `visibilitychange`.

---

## Demo Credentials

All accounts use the default password: **`password123`**

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Teacher** | `teacher@campus.edu` | `password123` | Teacher Dashboard, Student Records, Attendance, Assignments |
| **Student** | `student@campus.edu` | `password123` | Student Dashboard, Planner, Attendance View, AI Chat |
| **Admin** | `admin@campus.edu` | `password123` | Admin Portal, User Management, Global Subjects & Announcements |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React, Glassmorphism
- **Database**: SQLite / LibSQL
- **Graphics**: OGL (WebGL2 shaders)
- **AI Engine**: Google Gemma / Gemini API

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/studez.git
cd studez
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```
Add your AI API key (e.g. Gemini / Gemma API key) in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The database will automatically initialize and seed default accounts on first launch.

---

## Project Structure

```
studez/
├── src/
│   ├── app/
│   │   ├── (admin)/         # Admin dashboard routes
│   │   ├── (auth)/          # Authentication & login routes
│   │   ├── (dashboard)/     # Student & Teacher shared dashboard
│   │   ├── api/             # Secure API endpoints (auth, attendance, ai, etc.)
│   │   └── layout.tsx       # Root layout with AmbientVisuals
│   ├── components/
│   │   ├── effects/         # Ambient visual components (LightTunnel, GlowCursor)
│   │   ├── layout/          # Sidebar, Topbar, Navigation
│   │   └── ui/              # Reusable UI primitives & React Bits shaders
│   ├── hooks/               # Custom React hooks (useUser, useData)
│   ├── lib/
│   │   ├── server/          # SQLite database connection & auth logic
│   │   └── data-service.ts  # Client-side API abstraction
│   └── types/               # TypeScript interfaces
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
