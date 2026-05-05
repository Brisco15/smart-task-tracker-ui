# SmartTaskTracker — Frontend

A role-based project and task management application built with **Angular 21** and **Angular Material**. It connects to a REST API backend and supports time tracking, user administration, and analytics charts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21.2.5 (standalone components) |
| UI Library | Angular Material 21.2.5 |
| Charts | Chart.js 4 |
| Auth | JWT (jwt-decode) |
| HTTP | Angular HttpClient + interceptor |
| Styling | SCSS / CSS |
| Testing | Vitest |

---

## Features

- **Authentication** — JWT-based login and registration with token expiry validation
- **Role-based access** — Three roles: `Admin`, `Manager`, `Developer`, each with different permissions
- **Projects** — Create, edit, archive projects
- **Tasks** — Create, edit, delete, archive tasks per project
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
│   ├── tasks/                 # Task list with time tracking
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
- Backend API running on `http://localhost:5260`

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

The app expects a REST API at `http://localhost:5260/api`. Key endpoints used:

| Endpoint | Description |
|---|---|
| `POST /api/auth/login` | Login, returns JWT |
| `POST /api/auth/register` | Register new user |
| `GET /api/projects` | Get all projects |
| `GET /api/projects/{id}/tasks` | Get tasks for a project |
| `POST /api/tasks` | Create task |
| `PUT /api/projects/{id}/tasks/{taskId}` | Update task |
| `DELETE /api/tasks/{id}` | Delete task |
| `POST /api/timetracking/start/{taskId}` | Start time tracking |
| `POST /api/timetracking/stop/{taskId}` | Stop time tracking |
| `GET /api/users` | Get all users (Admin) |

To change the API base URL, update the `apiUrl` property in each service file under `src/app/services/`.

```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
