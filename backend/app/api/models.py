from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import LLMModel
from app.schemas.schemas import ModelCreate, ModelResponse, ModelUpdate

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("", response_model=list[ModelResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMModel).order_by(LLMModel.name))
    models = result.scalars().all()
    return models


@router.get("/{model_id}", response_model=ModelResponse)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("", response_model=ModelResponse, status_code=201)
async def create_model(data: ModelCreate, db: AsyncSession = Depends(get_db)):
    model = LLMModel(
        name=data.name,
        provider=data.provider,
        model_id=data.model_id,
        icon_key=data.icon_key,
        api_base=data.api_base,
        api_key_encrypted=data.api_key,
        custom_headers=data.custom_headers,
        capabilities=data.capabilities,
        default_params=data.default_params,
        fixed_params=data.fixed_params,
        adapter_config=data.adapter_config,
        status=data.status,
    )
    db.add(model)
    await db.flush()
    await db.refresh(model)
    return model


@router.patch("/{model_id}", response_model=ModelResponse)
async def update_model(model_id: str, data: ModelUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    update_data = data.model_dump(exclude_unset=True)
    if "api_key" in update_data:
        update_data["api_key_encrypted"] = update_data.pop("api_key")
    for key, value in update_data.items():
        setattr(model, key, value)
    await db.flush()
    await db.refresh(model)
    return model


@router.delete("/{model_id}", status_code=204)
async def delete_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    await db.delete(model)


@router.post("/{model_id}/test-connection")
async def test_connection(model_id: str, db: AsyncSession = Depends(get_db)):
    import httpx

    from app.utils.url_validation import validate_api_url

    result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    api_base = model.api_base
    if not api_base:
        return {"status": "error", "message": "No API base URL configured"}

    await validate_api_url(api_base)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            headers = {"Authorization": f"Bearer {model.api_key_encrypted}"}
            if model.custom_headers:
                headers.update(model.custom_headers)
            resp = await client.get(f"{api_base}/models", headers=headers)
            if resp.status_code == 200:
                return {"status": "success", "message": "Connection successful"}
            return {"status": "error", "message": f"HTTP {resp.status_code}"}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "error", "message": str(e)}
