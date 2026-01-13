<h1 align="center">EduDesk</h1>

Full-stack notes sharing app built with React + Vite (frontend) and Flask (backend), featuring Firebase authentication and environment-aware file storage.

## Features
- Firebase authentication
- Upload, list, search, download, and delete notes
- Environment-aware storage:
	- Local: files saved to `./uploads`
	- Production: configurable storage path (e.g., `/var/data`)
- CORS ready for local dev (`http://localhost:5173`) and deployment
- Health and info endpoints for quick checks

## Prerequisites
- Node.js 18+
- Python 3.11+
- npm (or yarn/pnpm)

## Environment setup
1) Copy the sample env file and edit values as needed:
```bash
cp .env.example .env
```

Key variables:
- `ENV`: `local` for development, `production` on server
- `PORT`: Flask port (default `10000`)
- `CORS_ORIGINS`: allowed origins (comma-separated)
- `FILE_STORAGE_PATH`: local storage path (default `./uploads`)
- Firebase Admin creds (only required in production)
- Cloudflare R2 creds (only required in production)

> Local development does **not** require valid Firebase private keys or R2 credentials; files are stored on disk.

## Install dependencies
```bash
# Frontend
npm install

# Backend
cd Backend
pip install -r requirements.txt
```

## Running locally
Use two terminals:

**Terminal 1 (backend):**
```bash
cd Backend
python wsgi.py
```

**Terminal 2 (frontend):**
```bash
npm run dev
```

- Backend runs at `http://localhost:10000`
- Frontend runs at `http://localhost:5173`

## Test the upload API (script)
A helper script signs in (or auto-registers) with Firebase Auth and uploads a sample PDF:
```bash
node scripts/test-upload.js
```
Optional overrides:
```bash
API_BASE=http://localhost:10000 \
FIREBASE_API_KEY=your_web_api_key \
TEST_EMAIL=user@example.com \
TEST_PASSWORD=YourPass123! \
node scripts/test-upload.js
```

## API endpoints (backend)
- `GET /health` — Basic health check
- `GET /api/health/detailed` — Detailed service status
- `GET /api/info` — API info
- `POST /api/files/upload` — Upload file (requires Firebase ID token)
- `GET /api/files/notes` — List notes
- `GET /api/files/my-notes` — Notes for current user
- `GET /api/files/download/<id>` — Download file
- `GET /api/files/search` — Search notes
- `GET /api/files/stats` — Usage stats
- `DELETE /api/files/delete/<id>` — Delete note (owner only)

## Production notes
- Set `ENV=production` and point `FILE_STORAGE_PATH` to your mounted volume (e.g., `/var/data`).
- Provide valid Firebase Admin credentials and R2 credentials if you enable cloud storage.
- Use a production WSGI server (e.g., gunicorn) instead of the Flask dev server.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
