from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import SystemSetting
from app.schemas.schemas import SettingResponse, SettingsBulkUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Default settings with descriptions
DEFAULT_SETTINGS = {
    "judge_model_id": {
        "value": "",
        "description": "Global default judge model ID for LLM evaluation",
    },
    "judge_rubric": {
        "value": "Evaluate the output on a scale of 1-10 based on:\n"
        "1. Correctness and accuracy\n"
        "2. Completeness of the response\n"
        "3. Code quality (if applicable)\n"
        "4. Clarity and organization\n"
        "5. Following instructions precisely",
        "description": "Default scoring rubric used by the LLM judge",
    },
    "score_scale_max": {
        "value": "10",
        "description": "Maximum score value for LLM judge scoring (e.g. 10)",
    },
    "human_score_scale_max": {
        "value": "5",
        "description": "Maximum score value for human scoring (e.g. 5)",
    },
}


@router.get("", response_model=list[SettingResponse])
async def list_settings(db: AsyncSession = Depends(get_db)):
    # Ensure default settings exist
    await _ensure_defaults(db)
    result = await db.execute(select(SystemSetting).order_by(SystemSetting.key))
    return result.scalars().all()


@router.get("/{key}")
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    await _ensure_defaults(db)
    result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        return {"key": key, "value": "", "description": ""}
    return {"key": setting.key, "value": setting.value, "description": setting.description}


@router.put("")
async def update_settings(data: SettingsBulkUpdate, db: AsyncSession = Depends(get_db)):
    await _ensure_defaults(db)
    updated = []
    for key, value in data.settings.items():
        result = await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        setting = result.scalar_one_or_none()
        if setting:
            setting.value = value
        else:
            setting = SystemSetting(key=key, value=value)
            db.add(setting)
        updated.append(key)
    await db.flush()
    return {"updated": updated}


async def _ensure_defaults(db: AsyncSession) -> None:
    """Create default settings if they don't exist."""
    result = await db.execute(select(SystemSetting))
    existing_keys = {s.key for s in result.scalars().all()}

    for key, config in DEFAULT_SETTINGS.items():
        if key not in existing_keys:
            db.add(SystemSetting(key=key, value=config["value"], description=config["description"]))
    await db.flush()
