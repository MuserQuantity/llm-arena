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

## 使用指南 / Workflow

### 第 1 步：创建评测维度

维度（Dimension）是评测的分类标签，例如"代码能力"、"推理能力"、"创意写作"等。维度用于在汇总结果中分类展示评分。

目前可以通过 API 创建维度：

```bash
curl -X POST http://localhost:8000/api/dimensions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "代码能力", "slug": "coding", "description": "编程和代码生成能力"}'
```

也可以在 Seed 脚本中预定义维度。

### 第 2 步：创建评测任务（Tasks）

进入侧边栏 **任务管理** 页面，点击"新建任务"，填写以下字段：

| 字段 | 说明 |
|------|------|
| **任务名称** | 简洁描述，如"Python 排序算法实现" |
| **评测维度** | 该任务属于哪个维度（需先创建维度） |
| **Prompt** | 发送给被评测 LLM 的完整指令。模型根据此 Prompt 生成输出，输出再被 Judge 评分 |
| **预期输出格式** | `text` / `html` / `code` / `json` / `markdown`，影响结果展示方式 |
| **评分模式** | `LLM Judge`（推荐）= 用 Judge 模型自动评分；`脚本评分` = 自定义脚本（暂未实现）；`混合` = 两者结合 |
| **Judge 评分标准** | 告诉 Judge 模型按什么标准打分（如正确性、可读性、效率等）。不填则使用全局默认 Rubric |
| **YAML 配置** | 用于脚本评分模式的配置（当前版本预留字段） |

### 第 3 步：注册 LLM 模型（Models）

进入侧边栏 **模型管理** 页面，点击"添加模型"注册被评测模型。需要配置：
- 模型名称、供应商、Model ID
- API Base URL 和 API Key（用于调用模型接口）
- 可选：capabilities、default_params 等高级参数

> 注意：Judge 模型也需要作为一个普通模型注册，后续选择它作为裁判。

### 第 4 步：设置 Judge 模型

在侧边栏底部可以看到 **Judge 模型** 指示器。如果显示"未设置"，点击它从已注册的模型中选择一个作为全局 Judge。也可以在 **系统设置** 页面进行配置。

Judge 模型负责自动对其他模型的输出打分。建议选择能力最强的模型作为 Judge（如 GPT-5、Claude Opus 等）。

### 第 5 步：执行评测

在 **模型管理** 页面，找到要评测的模型，点击 **"开始评测"** 按钮进入该模型的评测页面。

评测页面会列出所有任务，按维度分组，显示执行状态和评分。你可以：
- 点击 **执行** 按钮逐个运行任务（将 Prompt 发送给该模型并获取输出）
- 点击 **"执行所有未运行"** 按钮批量执行
- 对已完成的任务点击 **评分** 触发 LLM Judge 自动打分
- 点击 **"自动评分所有未评"** 按钮批量评分

### 第 6 步：查看评分 & 人工打分

点击任务行的 **详情** 按钮查看运行结果，包括：
- 模型输出内容（HTML 输出有沙盒预览）
- LLM Judge 评分和评分理由
- 人工评分区域（默认展开，直接打星 / 输入分数并添加备注）

人工评分和 LLM 评分是独立的，都会被纳入汇总计算。

### 第 7 步：查看汇总结果

进入侧边栏 **评测汇总** 页面，可以看到所有模型在各维度上的归一化评分矩阵（百分制）。点击分数单元格可跳转到对应模型的评测详情。

**排行榜** 页面按总体均分排名，支持按维度筛选。

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
