# SmartTaskTracker — Frontend

A role-based project and task management application built with **Angular 21** and **Angular Material**. It connects to a deployed REST API backend and supports time tracking, user administration, and analytics charts.

- **Backend**: `smartTaskTracker.API` — ASP.NET Core Web API with JWT authentication (.NET 10), deployed on Azure App Service
- **Frontend**: Angular SPA deployed on **Azure Static Web Apps**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21.2.5 (standalone components) |
| UI Library | Angular Material 21.2.5 |
| Charts | Chart.js 4 |
| Auth | JWT (jwt-decode 4) |
| HTTP | Angular HttpClient + functional interceptor |
| Styling | SCSS / CSS |
| Testing | Vitest 4 |
| Language | TypeScript ~5.9.2 |

---

## Features

- **Authentication** — JWT-based login and registration with token expiry validation
- **Role-based access** — Three roles: `Admin`, `Manager`, `Developer`, each with different permissions
- **Projects** — Create, edit, archive projects
- **Tasks** — Create, edit, delete, archive tasks scoped to a project (`/projects/:projectId/tasks`)
- **Time Tracking** — Start/stop time tracking per task; view total time per task and project
- **Dashboard** — Analytics with 4 live charts (task status, priority breakdown, tasks per project, project completion %)
- **Admin Panel** — User management: view, edit, archive, delete users (Admin only)

---

## Roles & Permissions

| Feature | Admin | Manager | Developer |
|---|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ |
| View Projects | ✅ | ✅ | ✅ |
| Create / Edit Projects | ✅ | ✅ | ❌ |
| Create / Delete Tasks | ❌ | ✅ | ❌ |
| Edit Tasks | ✅ | ✅ | ❌ |
| Track Time | ❌ | ❌ | ✅ |
| Admin Panel | ✅ | ❌ | ❌ |

---

## Project Structure

```
src/app/
├── guards/
│   ├── auth-guard.ts          # Redirects unauthenticated users to /login
│   └── role-guard-guard.ts    # Enforces role-based route access
├── interceptors/
│   └── auth-interceptor.ts    # Attaches JWT token to every HTTP request
├── interfaces/
│   ├── UserDTO.ts
│   ├── ProjectDTO.ts
│   ├── TaskDTO.ts
│   └── jwt-payload.ts
├── pages/
│   ├── login/
│   ├── register/
│   ├── layout/                # Shell with sidebar navigation
│   ├── dashboard/             # Charts and stats overview
│   ├── projects/              # Project list and management
│   ├── tasks/                 # Task list with time tracking (routed via /projects/:projectId/tasks)
│   ├── admin/                 # User management (Admin only)
│   └── *-dialog/              # Create/Edit dialogs for tasks, projects, users
└── services/
    ├── auth.ts                # Login, register, JWT decode helpers
    ├── task-service.ts
    ├── project-service.ts
    ├── admin.ts
    ├── time-tracking.ts
    ├── status-service.ts
    └── priority-service.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+
- Angular CLI 21: `npm install -g @angular/cli`

### Installation

```bash
git clone https://github.com/Brisco15/smart-task-tracker-ui.git
cd smart-task-tracker-ui
npm install
```

### Run Development Server

```bash
npm start
```

Navigate to `http://localhost:4200`. The app redirects to `/login` by default.

### Build for Production

```bash
npm run build
```

Output is placed in `dist/`.

### Run Tests

```bash
npm test
```

---

## Backend API

The app connects to the deployed API at:

```
https://smart-task-tracker-api-4114.azurewebsites.net/api
```

Key endpoints used:

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | Login, returns JWT |
| `POST /api/auth/register` | Register new user |
| `GET /api/projects` | Get all projects |
| `GET /api/tasks/project/{projectId}` | Get tasks for a project |
| `POST /api/tasks` | Create task |
| `PUT /api/tasks/{taskId}` | Update task |
| `DELETE /api/tasks/{id}` | Delete task |
| `PATCH /api/tasks/{id}/archive` | Archive task |
| `POST /api/timetracking/start/{taskId}` | Start time tracking |
| `POST /api/timetracking/stop/{taskId}` | Stop time tracking |
| `GET /api/users` | Get all users (Admin only) |
| `PUT /api/users/{id}` | Update user (Admin only) |
| `PATCH /api/users/{id}/archive` | Archive user (Admin only) |
| `DELETE /api/users/{id}` | Delete user (Admin only) |

To change the API base URL, update `apiUrl` in `src/environments/environment.ts` (development) and `src/environments/environment.prod.ts` (production).

---

## Deployment

The frontend is configured for **Azure Static Web Apps** via `staticwebapp.config.json`. All routes fall back to `index.html` to support Angular's client-side routing.
