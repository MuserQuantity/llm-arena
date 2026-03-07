"""Seed database with initial data."""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, engine
from app.models.base import Base
from app.models.models import Dimension, LLMModel, Task, TaskModelAssignment


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if data already exists
        result = await session.execute(select(LLMModel))
        if result.scalars().first():
            print("Data already seeded, skipping.")
            return

        # Create models
        models_data = [
            LLMModel(
                name="GPT-4o",
                provider="OpenAI",
                model_id="openai/gpt-4.1",
                icon_key="gpt-4o",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning", "analysis"],
                status="active",
            ),
            LLMModel(
                name="Claude Sonnet 4.6",
                provider="Anthropic",
                model_id="anthropic/claude-sonnet-4.6",
                icon_key="claude",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning", "summarization"],
                status="active",
            ),
            LLMModel(
                name="Gemini 1.5 Pro",
                provider="Google",
                model_id="google/gemini-2.5-pro-preview",
                icon_key="gemini",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning", "frontend"],
                status="active",
            ),
            LLMModel(
                name="DeepSeek V3",
                provider="DeepSeek",
                model_id="deepseek/deepseek-chat-v3-0324",
                icon_key="deepseek",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning"],
                status="active",
            ),
            LLMModel(
                name="Grok 4",
                provider="xAI",
                model_id="x-ai/grok-4",
                icon_key="grok",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning", "analysis"],
                status="active",
            ),
            LLMModel(
                name="GPT-5",
                provider="OpenAI",
                model_id="openai/gpt-5",
                icon_key="gpt-4o",
                api_base="",
                api_key_encrypted="",
                capabilities=["code", "reasoning", "frontend", "analysis"],
                status="active",
            ),
        ]
        for m in models_data:
            session.add(m)
        await session.flush()

        # Create dimensions
        dims_data = [
            Dimension(name="Code Quality", slug="code-quality", description="Evaluates code generation quality"),
            Dimension(name="Reasoning", slug="reasoning", description="Evaluates logical reasoning ability"),
            Dimension(name="Frontend Gen", slug="frontend-gen", description="Evaluates frontend code generation"),
            Dimension(name="Summarization", slug="summarization", description="Evaluates text summarization ability"),
        ]
        for d in dims_data:
            session.add(d)
        await session.flush()

        # Create tasks
        tasks_data = [
            Task(
                title="React Todo App",
                dimension_id=dims_data[2].id,
                prompt="Create a React Todo application with add, delete, and mark-complete functionality. Use TypeScript and Tailwind CSS.",
                eval_mode="llm_judge",
                judge_model_id=models_data[0].id,
                judge_rubric="Evaluate code quality, completeness, UI design, and TypeScript usage on a 1-10 scale.",
                expected_output_type="code",
            ),
            Task(
                title="Algorithm Analysis",
                dimension_id=dims_data[1].id,
                prompt="Analyze the time and space complexity of the following sorting algorithms: QuickSort, MergeSort, HeapSort. Provide Big-O notation for best, average, and worst cases.",
                eval_mode="llm_judge",
                judge_model_id=models_data[0].id,
                judge_rubric="Evaluate correctness, completeness, and clarity of the analysis on a 1-10 scale.",
                expected_output_type="text",
            ),
            Task(
                title="Python API Endpoint",
                dimension_id=dims_data[0].id,
                prompt="Write a FastAPI endpoint that implements CRUD operations for a 'Product' resource with proper validation, error handling, and async database operations.",
                eval_mode="both",
                judge_model_id=models_data[1].id,
                judge_rubric="Evaluate code correctness, error handling, async patterns, and API design on a 1-10 scale.",
                expected_output_type="code",
            ),
        ]
        for t in tasks_data:
            session.add(t)
        await session.flush()

        # Create model assignments for each task
        for task in tasks_data:
            for model in models_data[:4]:  # Assign first 4 models to each task
                assignment = TaskModelAssignment(task_id=task.id, model_id=model.id)
                session.add(assignment)

        await session.commit()
        print("Seed data created successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
