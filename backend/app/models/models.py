from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class LLMModel(Base, TimestampMixin):
    """Registered LLM model."""

    __tablename__ = "models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(100), nullable=False)
    model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    icon_key: Mapped[str] = mapped_column(String(100), default="")
    api_base: Mapped[str] = mapped_column(String(500), default="")
    api_key_encrypted: Mapped[str] = mapped_column(String(500), default="")
    custom_headers: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    capabilities: Mapped[list | None] = mapped_column(JSON, nullable=True)
    default_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    fixed_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    adapter_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")

    task_assignments: Mapped[list["TaskModelAssignment"]] = relationship(back_populates="model")


class Dimension(Base, TimestampMixin):
    """Evaluation dimension (e.g., code quality, reasoning)."""

    __tablename__ = "dimensions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")

    tasks: Mapped[list["Task"]] = relationship(back_populates="dimension")


class Task(Base, TimestampMixin):
    """Evaluation task."""

    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    dimension_id: Mapped[str] = mapped_column(String(36), ForeignKey("dimensions.id"), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, default="")
    yaml_config: Mapped[str] = mapped_column(Text, default="")
    eval_mode: Mapped[str] = mapped_column(String(50), default="llm_judge")  # script_only | llm_judge | both
    judge_model_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("models.id"), nullable=True)
    judge_rubric: Mapped[str] = mapped_column(Text, default="")
    expected_output_type: Mapped[str] = mapped_column(String(50), default="text")  # text | code | html | json

    dimension: Mapped["Dimension"] = relationship(back_populates="tasks")
    judge_model: Mapped["LLMModel | None"] = relationship(foreign_keys=[judge_model_id])
    model_assignments: Mapped[list["TaskModelAssignment"]] = relationship(back_populates="task")


class TaskModelAssignment(Base, TimestampMixin):
    """Links a task to a model with optional param overrides."""

    __tablename__ = "task_model_assignments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=False)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("models.id"), nullable=False)
    override_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    task: Mapped["Task"] = relationship(back_populates="model_assignments")
    model: Mapped["LLMModel"] = relationship(back_populates="task_assignments")
    runs: Mapped[list["Run"]] = relationship(back_populates="task_assignment")


class Run(Base, TimestampMixin):
    """A single execution of a task against a model."""

    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    task_assignment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("task_model_assignments.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | running | done | failed
    output: Mapped[str] = mapped_column(Text, default="")
    output_type: Mapped[str] = mapped_column(String(50), default="text")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str] = mapped_column(Text, default="")

    task_assignment: Mapped["TaskModelAssignment"] = relationship(back_populates="runs")
    scores: Mapped[list["Score"]] = relationship(back_populates="run")


class Score(Base, TimestampMixin):
    """A score for a run - either automated or manual."""

    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    run_id: Mapped[str] = mapped_column(String(36), ForeignKey("runs.id"), nullable=False)
    score_type: Mapped[str] = mapped_column(String(20), nullable=False)  # llm_judge | manual
    numeric_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    pass_fail: Mapped[str | None] = mapped_column(String(10), nullable=True)
    rationale: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    scorer_model_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("models.id"), nullable=True)
    dimension_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("dimensions.id"), nullable=True)

    run: Mapped["Run"] = relationship(back_populates="scores")
    scorer_model: Mapped["LLMModel | None"] = relationship(foreign_keys=[scorer_model_id])
    dimension: Mapped["Dimension | None"] = relationship(foreign_keys=[dimension_id])


class SystemSetting(Base, TimestampMixin):
    """System-wide settings (key-value store)."""

    __tablename__ = "system_settings"
    __table_args__ = (UniqueConstraint("key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(Text, default="")
    description: Mapped[str] = mapped_column(Text, default="")
