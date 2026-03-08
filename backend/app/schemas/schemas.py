from datetime import datetime

from pydantic import BaseModel


# ── Model Schemas ──
class ModelCreate(BaseModel):
    name: str
    provider: str
    model_id: str
    icon_key: str = ""
    api_base: str = ""
    api_key: str = ""
    custom_headers: dict | None = None
    capabilities: list[str] | None = None
    default_params: dict | None = None
    fixed_params: dict | None = None
    adapter_config: dict | None = None
    status: str = "active"


class ModelUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    model_id: str | None = None
    icon_key: str | None = None
    api_base: str | None = None
    api_key: str | None = None
    custom_headers: dict | None = None
    capabilities: list[str] | None = None
    default_params: dict | None = None
    fixed_params: dict | None = None
    adapter_config: dict | None = None
    status: str | None = None


class ModelResponse(BaseModel):
    id: str
    name: str
    provider: str
    model_id: str
    icon_key: str
    api_base: str
    custom_headers: dict | None = None
    capabilities: list[str] | None = None
    default_params: dict | None = None
    fixed_params: dict | None = None
    adapter_config: dict | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Dimension Schemas ──
class DimensionCreate(BaseModel):
    name: str
    slug: str
    description: str = ""


class DimensionUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None


class DimensionResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Task Schemas ──
class TaskCreate(BaseModel):
    title: str
    dimension_id: str
    prompt: str = ""
    yaml_config: str = ""
    eval_mode: str = "llm_judge"
    judge_model_id: str | None = None
    judge_rubric: str = ""
    expected_output_type: str = "text"


class TaskUpdate(BaseModel):
    title: str | None = None
    dimension_id: str | None = None
    prompt: str | None = None
    yaml_config: str | None = None
    eval_mode: str | None = None
    judge_model_id: str | None = None
    judge_rubric: str | None = None
    expected_output_type: str | None = None


class TaskResponse(BaseModel):
    id: str
    title: str
    dimension_id: str
    prompt: str
    yaml_config: str
    eval_mode: str
    judge_model_id: str | None = None
    judge_rubric: str
    expected_output_type: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Task Model Assignment Schemas ──
class AssignmentCreate(BaseModel):
    model_id: str
    override_params: dict | None = None


class AssignmentResponse(BaseModel):
    id: str
    task_id: str
    model_id: str
    override_params: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Run Schemas ──
class RunResponse(BaseModel):
    id: str
    task_assignment_id: str
    status: str
    output: str
    output_type: str
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = None
    error_message: str
    created_at: datetime
    updated_at: datetime

    # Denormalized fields for convenience
    task_id: str | None = None
    task_title: str | None = None
    model_id: str | None = None
    model_name: str | None = None
    model_icon_key: str | None = None
    dimension_name: str | None = None

    model_config = {"from_attributes": True}


# ── Score Schemas ──
class ScoreCreate(BaseModel):
    score_type: str  # llm_judge | manual
    numeric_score: float | None = None
    pass_fail: str | None = None
    rationale: str = ""
    notes: str = ""
    scorer_model_id: str | None = None
    dimension_id: str | None = None


class ScoreUpdate(BaseModel):
    numeric_score: float | None = None
    pass_fail: str | None = None
    rationale: str | None = None
    notes: str | None = None


class ScoreResponse(BaseModel):
    id: str
    run_id: str
    score_type: str
    numeric_score: float | None = None
    pass_fail: str | None = None
    rationale: str
    notes: str
    scorer_model_id: str | None = None
    dimension_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Settings Schemas ──
class SettingUpdate(BaseModel):
    value: str


class SettingResponse(BaseModel):
    id: str
    key: str
    value: str
    description: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SettingsBulkUpdate(BaseModel):
    settings: dict[str, str]  # key -> value


# ── Dashboard Schemas ──
class LeaderboardEntry(BaseModel):
    model_id: str
    model_name: str
    model_icon_key: str
    provider: str
    avg_score: float
    total_runs: int
    top_score: float
    last_updated: datetime | None = None


class ModelTaskResult(BaseModel):
    task_id: str
    task_title: str
    dimension_id: str
    dimension_name: str
    run_id: str | None = None
    run_status: str | None = None
    llm_score: float | None = None
    human_score: float | None = None
    llm_rationale: str | None = None
    human_notes: str | None = None


class ModelEvalSummary(BaseModel):
    model_id: str
    model_name: str
    model_icon_key: str
    provider: str
    tasks: list[ModelTaskResult]
    dimension_averages: dict[str, float]  # dimension_name -> avg_score
    overall_avg: float | None = None
