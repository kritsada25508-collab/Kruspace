# KruSpace — Teacher Workspace

A responsive teacher-workspace prototype with dashboard, student directory, attendance, assignments and grading, calendar, shared files, activity, search, profile, and local workspace preferences.

## Run the website

- Node.js 20 or newer
- pnpm 11 (pinned in `package.json`)

```sh
pnpm install
pnpm dev
```

## Run the Python backend

- Python 3.11 or newer

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/python -m backend.app
```

The Flask API listens on port 5000 by default and stores attendance marks in `backend/database.db` (created on first run). The website's attendance page talks to `/api/v0/attendant`; the API also supports the repository's legacy `/api/v0/attendent` spelling.

## Where Python is applied

- `backend/app.py` starts Flask, registers the attendance blueprint, and initializes SQLite from `backend/sql/30-attendance.sql`.
- `backend/attendance_ui.py` defines the Flask attendance page, CORS behavior, status validation, and GET/POST JSON API.
- `backend/templates/attendance.html` and `backend/static/attendance.css` are the Python-rendered attendance screen.
- `src/PythonAttendanceBridge.tsx` is the connected status/sync panel in the website; `src/pythonAttendance.ts` contains its typed API client and `VITE_PYTHON_API_BASE_URL` configuration.

The current preview API endpoint is a temporary development host. For local development or a future deployment, set `VITE_PYTHON_API_BASE_URL` to your own Flask server's `/api/v0` base before building. Host the Python backend on a durable service before publishing the static website. The demo roster is fictional, the API has no production authentication, and it must not be used for real student records. Other prototype areas continue to use browser-local sample data.
