# Run KruSpace locally

## Requirements

- Node.js 20 or newer

- Python 3.11 or newer

- Corepack (included with current Node.js releases)

Extract the project ZIP and open a terminal in the `kruspace` project root—the directory containing `package.json` and `backend/`.

## 1. Point the website at your local Flask API

Copy the sample environment file to Vite's local override:

**macOS/Linux**

```
cp .env.example .env.local
```

**Windows PowerShell**

```
Copy-Item .env.example .env.local
```

The file sets the attendance API to `http://127.0.0.1:5000/api/v0`. Keep this value for local use; it avoids the temporary cloud demo endpoint.

## 2. Start the Python API

Open the first terminal at the project root.

**macOS/Linux**

```
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
python -m backend.app
```

**Windows PowerShell**

```
py -3.11 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
python -m backend.app
```

Leave this terminal running. The backend creates `backend/database.db` automatically and listens on port `5000`.

## 3. Start the website

Open a second terminal at the same project root:

```
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

Keep this terminal running too. Open [**http://localhost:3000**](http://localhost:3000), go to **Attendance**, and use **Sync current class to Python**. You can also open [**http://127.0.0.1:5000/attendance**](http://127.0.0.1:5000/attendance) to see the standalone Flask attendance page.

If you create or change `.env.local` after starting Vite, stop and restart `pnpm dev` so the new API base URL is loaded. If either default port (`3000` or `5000` ) is already in use, stop the conflicting program before starting KruSpace.

## Data and security

Attendance marks are stored in the local SQLite file `backend/database.db`. The roster is fictional and the sample API has no production authentication; do not enter real student data. The other website areas use browser-local prototype data.

