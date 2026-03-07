# Testing LLM Arena App

## Overview
LLM Arena is a fullstack app with a Next.js frontend and FastAPI backend for benchmarking LLMs.

## Prerequisites
- Node.js and npm installed
- Python with Poetry installed
- PostgreSQL database accessible (connection string in backend `.env`)
- LLM API credentials configured in backend `.env`

## Devin Secrets Needed
- `DATABASE_URL` - PostgreSQL connection string
- `LLM_API_KEY` - API key for LLM provider
- `LLM_API_BASE_URL` - Base URL for OpenAI-compatible LLM API

## Starting the App Locally

### Backend (FastAPI)
```bash
cd backend
poetry install
poetry run fastapi dev app/main.py --port 8000
```
Verify: `curl http://localhost:8000/health` should return `{"status":"ok"}`

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:3000

### Seed Data
The app uses mock data on the frontend for demo purposes. Backend seed script:
```bash
cd backend && poetry run python -m app.seed
```

## Navigation / Screen Routes

| Screen | Route | Sidebar Link |
|---|---|---|
| Leaderboard (Dashboard) | `/` | "Leaderboard" |
| Model Registry | `/admin/models` | "Models" |
| Task Form | `/admin/tasks` | "Tasks" |
| Run Monitor | `/admin/runs` | "Runs" |
| Result Detail | `/results/{runId}` | Click leaderboard row |
| Comparison View | `/tasks/{taskId}/compare` | N/A (direct URL) |

## Key Features to Test

1. **Leaderboard page (`/`)**: 6 model rows, dimension filter pills (All, Frontend Gen, Reasoning, Code Quality, Summarization), score badges with color coding
2. **Dimension filter**: Click a pill to filter the table. "All" shows all entries. Each pill filters by `dimension_id`.
3. **Dark mode**: Moon/Sun icon button in the top-right corner of the topbar toggles dark/light theme
4. **Model Registry (`/admin/models`)**: Table of 6 models with "Add Model" button that opens a dialog/drawer form
5. **Task Form (`/admin/tasks`)**: Create Task form with Title, Dimension, Prompt, Expected Output Type, Eval Mode, Judge Model, Rubric, Python Script, Model Assignments
6. **Run Monitor (`/admin/runs`)**: Runs table with status badges (Done=green, Running=blue, Pending=yellow, Failed=red), filter dropdowns, pagination, Retry button on failed runs
7. **Result Detail (`/results/r1`)**: Model info header, sandboxed HTML preview iframe, LLM Judge Score card, Manual Score card with star rating
8. **Comparison View (`/tasks/t1/compare`)**: Side-by-side model output panels with score badges, "Show More" for additional models

## Common Issues
- If the frontend shows a blank page, check that the backend is running and `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
- If database errors occur, verify the PostgreSQL connection string in `backend/.env`
- The iframe sandbox uses `sandbox="allow-scripts"` (without `allow-same-origin`) to prevent XSS. If HTML previews don't render interactively, this is by design for security.
- Async SQLAlchemy queries need `selectinload` for related objects to avoid `MissingGreenlet` errors

## Build Verification
```bash
cd frontend && npm run build
```
Should complete with 0 errors.
