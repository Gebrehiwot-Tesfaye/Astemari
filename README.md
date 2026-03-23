# Astemari — Teacher Recruitment Platform

Astemari is a full-stack teacher recruitment platform built for Ethiopian schools and teachers. Schools can post job openings, invite qualified teachers, and manage the entire hiring pipeline. Teachers can build profiles, browse jobs, apply, and respond to invitations. Admins have full oversight of the platform including analytics, user management, and activity logs.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Database Setup](#database-setup)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Environment Variables](#environment-variables)
9. [Running the App](#running-the-app)
10. [User Roles & Access](#user-roles--access)
11. [API Overview](#api-overview)
12. [File Uploads](#file-uploads)
13. [Email Notifications](#email-notifications)
14. [AI Chatbot](#ai-chatbot)
15. [Common Issues](#common-issues)
16. [Contributing](#contributing)

---

## Features

- **Authentication** — JWT-based login and registration with role-based access control
- **Teacher Profiles** — Full profile builder with education, experience, certifications, CV upload, and profile photo
- **Job Postings** — Schools post jobs with subject, grade level, location, salary, and requirements
- **Applications** — Teachers apply to jobs; schools review, accept, or reject applications
- **Invitations** — Schools can directly invite teachers; teachers accept or decline
- **Notifications** — In-app notifications for application status changes, invitations, and more
- **Analytics Dashboard** — Charts for applications over time, job stats, teacher distribution
- **Activity Log** — Full audit trail of admin and school actions
- **AI Chatbot** — Powered by Google Gemini, embedded in the platform for user assistance
- **Dark Mode** — Full dark/light theme support
- **File Uploads** — CV, supporting documents, school license uploads
- **Admin Panel** — Manage all users, schools, teachers, jobs, applications, and invitations

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.12 | Runtime |
| FastAPI | Web framework |
| SQLAlchemy (async) | ORM |
| PostgreSQL | Database |
| Alembic | Database migrations |
| python-jose | JWT tokens |
| passlib + bcrypt | Password hashing |
| aiosmtplib | Async email sending |
| aiofiles | Async file I/O |
| python-multipart | File upload handling |
| pydantic-settings | Config management |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Zustand | Global state management |
| TanStack Query | Server state / data fetching |
| Axios | HTTP client |
| Recharts | Analytics charts |
| Framer Motion | Animations |
| Lucide React | Icons |
| Google Gemini API | AI chatbot |

---

## Project Structure

```
Astemari/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── routes/
│   │   │       │   ├── auth.py          # Login, register, token refresh
│   │   │       │   ├── teachers.py      # Teacher profile CRUD
│   │   │       │   ├── schools.py       # School profile CRUD
│   │   │       │   ├── jobs.py          # Job posting CRUD
│   │   │       │   ├── applications.py  # Job applications
│   │   │       │   ├── invitations.py   # School-to-teacher invitations
│   │   │       │   ├── notifications.py # In-app notifications
│   │   │       │   └── admin.py         # Admin-only management routes
│   │   │       └── router.py            # Route aggregator
│   │   ├── core/
│   │   │   ├── config.py        # App settings (reads from .env)
│   │   │   ├── database.py      # Async DB engine and session
│   │   │   ├── security.py      # JWT creation and verification
│   │   │   ├── deps.py          # FastAPI dependencies (get_current_user, etc.)
│   │   │   ├── notify.py        # Email notification helpers
│   │   │   └── activity.py      # Activity log helpers
│   │   ├── models/
│   │   │   ├── user.py          # User, School, Teacher SQLAlchemy models
│   │   │   ├── job.py           # Job, Application, Invitation models
│   │   │   └── notification.py  # Notification model
│   │   ├── schemas/
│   │   │   ├── user.py          # Pydantic schemas for users/schools/teachers
│   │   │   ├── job.py           # Pydantic schemas for jobs
│   │   │   ├── application.py   # Pydantic schemas for applications
│   │   │   ├── teacher.py       # Pydantic schemas for teacher profiles
│   │   │   └── invitation.py    # Pydantic schemas for invitations
│   │   └── main.py              # FastAPI app entry point, CORS, static files
│   ├── alembic/
│   │   ├── versions/            # Migration files
│   │   └── env.py               # Alembic config
│   ├── uploads/                 # Uploaded files (gitignored)
│   │   ├── cv/
│   │   ├── documents/
│   │   ├── licenses/
│   │   └── photos/
│   ├── .env                     # Backend environment variables
│   ├── alembic.ini
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (public)/        # Public pages (home, login, register, jobs)
    │   │   ├── dashboard/       # Protected dashboard pages
    │   │   └── layout.tsx       # Root layout
    │   ├── components/
    │   │   ├── auth/            # AuthForm, guards
    │   │   ├── dashboard/       # All dashboard page components
    │   │   └── layout/          # Navbar, Footer
    │   ├── lib/
    │   │   ├── api.ts           # Axios instance
    │   │   └── store.ts         # Zustand auth store
    │   └── types/               # TypeScript type definitions
    ├── .env.local               # Frontend environment variables
    ├── next.config.ts
    └── package.json
```

---

## Prerequisites

Make sure you have the following installed before starting:

- **Python 3.12+** — [python.org](https://www.python.org/downloads/)
- **PostgreSQL 14+** — [postgresql.org](https://www.postgresql.org/download/)
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- **pnpm** — Install with `npm install -g pnpm`
- **Git** — [git-scm.com](https://git-scm.com/)

---

## Database Setup

1. Start PostgreSQL and open the `psql` shell:

```bash
sudo -u postgres psql
```

2. Create the database and a dedicated user:

```sql
CREATE DATABASE astemari_db;
CREATE USER astemari_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE astemari_db TO astemari_user;
\q
```

3. Your `DATABASE_URL` will be:
```
postgresql+asyncpg://astemari_user:your_password@localhost:5432/astemari_db
```

---

## Backend Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Astemari.git
cd Astemari
```

### 2. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the `.env` file

Create a file at `backend/.env` (see [Environment Variables](#environment-variables) for all options):

```env
DATABASE_URL=postgresql+asyncpg://astemari_user:your_password@localhost:5432/astemari_db
SECRET_KEY=your-very-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=["http://localhost:3000"]

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM_NAME=Astemari
SMTP_FROM_EMAIL=your@gmail.com
```

> **Tip:** Generate a strong `SECRET_KEY` with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 5. Run database migrations

```bash
alembic upgrade head
```

This creates all the tables in your PostgreSQL database.

### 6. Start the backend server

```bash
venv/bin/uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Swagger docs: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
pnpm install
```

### 2. Create the `.env.local` file

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GEMINI_API_KEY=your-google-gemini-api-key
```

> **Get a Gemini API key:** Go to [aistudio.google.com](https://aistudio.google.com/), sign in, and create an API key. The app uses the `gemini-2.5-flash` model.

### 3. Start the frontend dev server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string using `asyncpg` driver |
| `SECRET_KEY` | ✅ | Secret key for signing JWT tokens (use a long random string) |
| `ALGORITHM` | ✅ | JWT algorithm — use `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Token expiry in minutes (e.g. `10080` = 7 days) |
| `CORS_ORIGINS` | ✅ | JSON array of allowed origins, e.g. `["http://localhost:3000"]` |
| `SMTP_HOST` | ❌ | SMTP server host for email notifications |
| `SMTP_PORT` | ❌ | SMTP port (587 for TLS) |
| `SMTP_USER` | ❌ | SMTP login email |
| `SMTP_PASSWORD` | ❌ | SMTP password or app password |
| `SMTP_FROM_NAME` | ❌ | Display name for outgoing emails |
| `SMTP_FROM_EMAIL` | ❌ | From address for outgoing emails |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL, e.g. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ❌ | Google Gemini API key for the AI chatbot |

---

## Running the App

You need two terminals running simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
venv/bin/uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
pnpm dev
```

Then open `http://localhost:3000` in your browser.

### Creating the first Admin user

After running migrations, register normally then promote the account via SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## User Roles & Access

### Admin
- Full access to all platform data
- Manage all users (activate, deactivate, change roles)
- Manage all schools and teachers
- View and manage all jobs, applications, and invitations
- Access analytics dashboard and activity audit log

### School
- Register as a school and complete school profile
- Post and manage job listings
- Review applications (accept/reject)
- Invite teachers directly
- View school-specific reports and analytics

### Teacher
- Register as a teacher and build a full profile
- Upload CV, certifications, and supporting documents
- Browse and apply to job listings
- Receive and respond to school invitations
- Track application status

---

## API Overview

All API routes are prefixed with `/api/v1`.

### Authentication — `/api/v1/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT token |
| GET | `/auth/me` | Get current authenticated user |

### Teachers — `/api/v1/teachers`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/teachers` | List all teachers (admin/school) |
| GET | `/teachers/me` | Get current teacher profile |
| PUT | `/teachers/me` | Update teacher profile |
| POST | `/teachers/me/upload-cv` | Upload CV file |
| POST | `/teachers/me/upload-photo` | Upload profile photo |
| GET | `/teachers/{id}` | Get teacher by ID |

### Schools — `/api/v1/schools`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/schools` | List all schools |
| GET | `/schools/me` | Get current school profile |
| PUT | `/schools/me` | Update school profile |
| GET | `/schools/{id}` | Get school by ID |

### Jobs — `/api/v1/jobs`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobs` | List all active jobs (public) |
| POST | `/jobs` | Create a job posting (school) |
| GET | `/jobs/{id}` | Get job details |
| PUT | `/jobs/{id}` | Update job posting (school) |
| DELETE | `/jobs/{id}` | Delete job posting (school/admin) |

### Applications — `/api/v1/applications`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/applications` | Apply to a job (teacher) |
| GET | `/applications/me` | Get current teacher's applications |
| GET | `/applications/school` | Get applications for school's jobs |
| PUT | `/applications/{id}/status` | Update application status (school) |

### Invitations — `/api/v1/invitations`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/invitations` | Send invitation to teacher (school) |
| GET | `/invitations/me` | Get teacher's received invitations |
| GET | `/invitations/school` | Get school's sent invitations |
| PUT | `/invitations/{id}/respond` | Accept or decline invitation (teacher) |

### Notifications — `/api/v1/notifications`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | Get current user's notifications |
| PUT | `/notifications/{id}/read` | Mark notification as read |
| PUT | `/notifications/read-all` | Mark all notifications as read |

### Admin — `/api/v1/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/{id}` | Update user (role, status) |
| DELETE | `/admin/users/{id}` | Delete user |
| GET | `/admin/schools` | List all schools |
| GET | `/admin/teachers` | List all teachers |
| GET | `/admin/jobs` | List all jobs |
| GET | `/admin/applications` | List all applications |
| GET | `/admin/invitations` | List all invitations |
| GET | `/admin/analytics` | Platform analytics data |
| GET | `/admin/activity-log` | Activity audit log |

---

## File Uploads

Uploaded files are stored in `backend/uploads/` and served as static files at `/uploads/`.

| Type | Endpoint | Stored In |
|---|---|---|
| Teacher CV | `POST /teachers/me/upload-cv` | `uploads/cv/` |
| Teacher photo | `POST /teachers/me/upload-photo` | `uploads/photos/` |
| Supporting documents | `POST /teachers/me/upload-document` | `uploads/documents/` |
| School license | `POST /schools/me/upload-license` | `uploads/licenses/` |

The `uploads/` directory is gitignored. Make sure it exists before running the backend:

```bash
mkdir -p backend/uploads/cv backend/uploads/photos backend/uploads/documents backend/uploads/licenses
```

---

## Email Notifications

Email notifications are optional. If SMTP settings are not configured, the app runs without them.

To enable emails, configure the `SMTP_*` variables in `backend/.env`. For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate an app password and use it as `SMTP_PASSWORD`

Emails are sent for:
- Application status changes (accepted/rejected)
- New invitation received
- Invitation response (accepted/declined)

---

## AI Chatbot

The platform includes an AI assistant powered by Google Gemini (`gemini-2.5-flash`).

To enable it:
1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Create a new API key
3. Add it to `frontend/.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`

The chatbot appears as a floating button on all pages and can answer questions about the platform.

---

## Common Issues

### OS file watch limit (Linux)

If you see `OSError: OS file watch limit reached`, run:

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

Then restart both servers.

### Database connection error

- Make sure PostgreSQL is running: `sudo systemctl start postgresql`
- Verify your `DATABASE_URL` credentials match what you set up in PostgreSQL
- Make sure the `asyncpg` driver is installed: `pip install asyncpg`

### Alembic migration errors

If migrations fail, try:
```bash
alembic downgrade base
alembic upgrade head
```

> ⚠️ This drops and recreates all tables. Only do this in development.

### CORS errors in browser

Make sure `CORS_ORIGINS` in `backend/.env` includes your frontend URL exactly:
```env
CORS_ORIGINS=["http://localhost:3000"]
```

### pnpm not found

```bash
npm install -g pnpm
```

### Gemini API 429 quota error

The free tier has rate limits. If you hit them, wait a few minutes and try again, or upgrade to a paid plan at [aistudio.google.com](https://aistudio.google.com/).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

*Built with ❤️ for Ethiopian education.*
