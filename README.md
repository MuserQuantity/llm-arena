# LLM Arena

An internal tool for evaluating and comparing the performance of large language models across multiple dimensions. Run tasks against different LLMs, score their outputs, and view results on a leaderboard.

## Features

- **Leaderboard** — Ranked view of model performance with dimension filtering (Code Quality, Reasoning, Frontend Gen, Summarization)
- **Model Registry** — Full CRUD: create, edit, delete models with provider info, capabilities, API configurations, and connection testing
- **Task Management** — Full CRUD: create, edit, delete tasks with multi-dimensional classification, eval mode config (LLM Judge / Script / Both), and rubric editor
- **Settings** — Configure the default judge model, scoring rubric, LLM and human score scales
- **Model Evaluation** — Per-model evaluation page: view all tasks grouped by dimension, execute/re-execute tasks, trigger LLM judge scoring, view results
- **Run Monitor** — Track execution status in real-time with auto-refresh, filtering, retry failed runs
- **Result Detail** — View model outputs with HTML preview (sandboxed iframe), LLM judge auto-scoring, and manual human scoring (star rating + notes, editable)
- **Summary Dashboard** — Aggregated view of all models and dimensions with cross-dimension scoring matrix
- **Comparison View** — Side-by-side comparison of outputs from different models on the same task
- **Dark Mode** — Full dark/light theme support
- **JWT Auth** — Login-protected with `.env`-configured credentials

## Workflow

1. **Create Tasks** — Go to Admin > Tasks, create evaluation tasks and assign them to dimensions (e.g., Code Quality, Reasoning). Configure the prompt, eval mode, and rubric.
2. **Create/Manage Models** — Go to Admin > Models, add LLM models with their API configurations. Test connections to verify they work.
3. **Configure Judge** — Go to Admin > Settings, select a default judge model and configure the scoring rubric and score scales.
4. **Run Evaluations** — Click on a model to open its evaluation page. For each task, click Execute to run the task against the model.
5. **Score Results** — After a task completes, click the judge icon to run LLM auto-scoring. You can also manually score results with star ratings and notes.
6. **View Results** — Click the eye icon to view detailed results including model output, LLM judge score, and manual scores.
7. **Review Summary** — Go to the Summary Dashboard to see aggregated scores across all dimensions and models.

## Tech Stack

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, @lobehub/icons |
| Backend  | Python 3.11+, FastAPI, SQLAlchemy 2 (async), asyncpg                       |
| Database | PostgreSQL                                                                 |
| Auth     | JWT (python-jose), password validation on startup                          |
| LLM API  | OpenAI-compatible endpoint (configurable base URL + API key)               |
| Deploy   | Docker Compose, multi-stage Dockerfiles                                    |

## Project Structure

```
llm-arena/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route handlers (auth, models, tasks, runs, scores, dashboard, settings, judge)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── utils/          # URL validation, helpers
│   │   ├── config.py       # Pydantic settings (reads .env)
│   │   ├── database.py     # Async database engine & session
│   │   ├── main.py         # FastAPI app entry point
│   │   └── seed.py         # Database seed script (8 latest LLM models)
│   ├── pyproject.toml      # Poetry dependencies
│   ├── Dockerfile
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages (/, /login, /admin/models, /admin/tasks, /admin/runs, /admin/settings, /dashboard/summary, /models/[id]/eval, /results/[runId], /tasks/[taskId]/compare)
│   │   ├── components/     # React components (dashboard, admin, layout, compare, results)
│   │   ├── lib/            # API client, utilities
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example        # Environment variable template
├── docker-compose.yml
├── LICENSE
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js** >= 22
- **Python** >= 3.11
- **Poetry** (Python package manager)
- **PostgreSQL** (local or remote, e.g. Railway, Supabase, Neon)

### 1. Clone the repo

```bash
git clone https://github.com/MuserQuantity/llm-arena.git
cd llm-arena
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
poetry install

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL, LLM_API_KEY, ADMIN_PASSWORD, JWT_SECRET (all required)

# Seed the database with models, dimensions, and sample tasks
poetry run python -m app.seed

# Start the dev server
poetry run fastapi dev app/main.py --port 8000
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local if your backend is not on localhost:8000

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Login

Open `http://localhost:3000` and sign in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set in `backend/.env` (default username: `admin`).

## Docker Compose

To run everything in containers:

```bash
# Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your real values

# Start all services
docker compose up --build
```

This starts:
- **backend** on port `8000`
- **frontend** on port `3000`
- **redis** on port `6379`

## Environment Variables

### Backend (`backend/.env`)

| Variable             | Required | Default                          | Description                                    |
|----------------------|----------|----------------------------------|------------------------------------------------|
| `DATABASE_URL`       | Yes      | `postgresql+asyncpg://...`       | PostgreSQL connection string (asyncpg driver)  |
| `LLM_API_KEY`        | Yes      | —                                | API key for the LLM provider                   |
| `ADMIN_PASSWORD`     | Yes      | —                                | Login password (app won't start without it)    |
| `JWT_SECRET`         | Yes      | —                                | Secret for JWT token signing                   |
| `LLM_API_BASE_URL`   | No       | `https://new-api.muserquantity.cn/v1` | OpenAI-compatible API base URL            |
| `ADMIN_USERNAME`     | No       | `admin`                          | Login username                                 |
| `JWT_EXPIRE_MINUTES` | No       | `1440`                           | JWT token expiration (minutes)                 |
| `CORS_ORIGINS`       | No       | `["http://localhost:3000"]`      | Allowed CORS origins (JSON array)              |

### Frontend (`frontend/.env.local`)

| Variable              | Required | Default                  | Description                    |
|-----------------------|----------|--------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost:8000`  | Backend API URL                |

## Seeded Models

The seed script (`backend/app/seed.py`) pre-populates the database with 8 latest flagship models:

| Model            | Provider   | Model ID                              |
|------------------|------------|---------------------------------------|
| GPT-5            | OpenAI     | `openai/gpt-5`                        |
| Claude Opus 4.6  | Anthropic  | `anthropic/claude-opus-4.6`           |
| Gemini 3 Pro     | Google     | `google/gemini-3-pro-preview`         |
| DeepSeek V3.2    | DeepSeek   | `deepseek-ai/DeepSeek-V3.2`          |
| Grok 4.1         | xAI        | `x-ai/grok-4.1-fast`                 |
| Qwen3 Next 80B   | Alibaba    | `Qwen/Qwen3-Next-80B-A3B-Instruct`   |
| Kimi K2          | Moonshot   | `moonshotai/Kimi-K2-Thinking`         |
| GPT-4.1          | OpenAI     | `openai/gpt-4.1`                      |

To re-seed after changing models, drop the existing data first:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Then run `poetry run python -m app.seed` again.

## API Endpoints

All endpoints (except `/api/auth/login` and `/health`) require a JWT token in the `Authorization: Bearer <token>` header.

| Method | Endpoint                              | Description                                  |
|--------|---------------------------------------|----------------------------------------------|
| POST   | `/api/auth/login`                     | Login (form data: username, password)        |
| GET    | `/api/models`                         | List all models                              |
| POST   | `/api/models`                         | Create a model                               |
| PATCH  | `/api/models/<id>`                    | Update a model                               |
| DELETE | `/api/models/<id>`                    | Delete a model                               |
| POST   | `/api/models/<id>/test-connection`    | Test model API connection                    |
| GET    | `/api/tasks`                          | List tasks (optional `?dimension_id=`)       |
| POST   | `/api/tasks`                          | Create a task                                |
| PATCH  | `/api/tasks/<id>`                     | Update a task                                |
| DELETE | `/api/tasks/<id>`                     | Delete a task                                |
| GET    | `/api/runs`                           | List runs (with pagination & filters)        |
| POST   | `/api/runs?task_id=<id>`              | Create runs for a task                       |
| POST   | `/api/runs/<id>/execute`              | Execute a run (calls LLM API)                |
| POST   | `/api/runs/<id>/retry`                | Retry a failed run                           |
| GET    | `/api/runs/<id>`                      | Get run details                              |
| GET    | `/api/runs/<id>/scores`               | Get scores for a run                         |
| POST   | `/api/runs/<id>/scores`               | Submit a score for a run                     |
| PATCH  | `/api/scores/<id>`                    | Update a score                               |
| GET    | `/api/dimensions`                     | List dimensions                              |
| GET    | `/api/settings`                       | List all settings                            |
| PUT    | `/api/settings`                       | Update settings (bulk key-value)             |
| POST   | `/api/judge/score/<run_id>`           | Auto-score a run using the LLM judge         |
| GET    | `/api/dashboard/leaderboard`          | Get leaderboard data (optional `?dimension_id=`) |
| GET    | `/api/dashboard/model-eval/<model_id>`| Get model evaluation summary                 |
| GET    | `/api/dashboard/summary`              | Get aggregated summary across all models     |
| GET    | `/health`                             | Health check                                 |

## Development

```bash
# Backend linting
cd backend && poetry run ruff check .

# Frontend linting
cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

## License

[MIT](LICENSE)
