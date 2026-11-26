"""Thin API controller for Grounded Atmospheric Copilot turns."""

import hashlib
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, get_db
from app.core.config import settings
from app.core.rate_limit import limiter
from app.models.auth import User
from app.schemas.app_schemas import CopilotChatRequest, CopilotChatResponse
from app.services.copilot_guardrails import (
    SUGGESTED_PROMPTS_MAP,
    classify_intent,
    detect_prompt_injection,
    generate_fallback_template,
    validate_and_correct_response,
)
from app.services.copilot_llm import (
    build_blocked_response,
    fetch_gemini_reply,
    gather_telemetry_context,
    persist_ai_trace,
)

__all__ = [
    "classify_intent",
    "copilot_chat_endpoint",
    "detect_prompt_injection",
    "generate_fallback_template",
    "router",
    "validate_and_correct_response",
]

router = APIRouter(prefix="/assistant", tags=["Atmospheric Assistant Copilot"])


async def _resolve_copilot_reply(
    request: Request,
    req: CopilotChatRequest,
    intent: str,
    city: str,
    source_badge: str,
    context_data: dict[str, object],
) -> tuple[str, str, int, bool, list[str], str]:
    """Generate and safety-validate a Copilot reply with deterministic fallback."""
    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
    raw_reply, tokens_used = await fetch_gemini_reply(
        request, city, req.message, context_data, model_name
    )
    is_fallback = not raw_reply
    if not raw_reply:
        raw_reply = f"Template guidance — not AI generated: {generate_fallback_template(intent, context_data, city)}"
        model_name = "category-template-fallback"

    validated_reply, flags = validate_and_correct_response(
        raw_reply, context_data, city, source_badge
    )
    status = (
        "FALLBACK_TEMPLATE"
        if is_fallback
        else ("CORRECTION_APPLIED" if "CORRECTION_APPLIED" in flags else "SUCCESS")
    )
    return validated_reply, model_name, tokens_used, is_fallback, flags, status


@router.post("/chat", response_model=CopilotChatResponse)
@limiter.limit("20/minute")
async def copilot_chat_endpoint(
    request: Request,
    req: CopilotChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
) -> CopilotChatResponse:
    """Process a Copilot turn with prompt-injection guard, forecast context, and validation."""
    start_time = time.time()
    prompt_hash = hashlib.sha256(req.message.encode("utf-8")).hexdigest()
    if detect_prompt_injection(req.message):
        latency_ms = int((time.time() - start_time) * 1000)
        await persist_ai_trace(
            db,
            current_user,
            prompt_hash,
            "INJECTION_BLOCKED",
            "safety-firewall-v1",
            latency_ms,
            0,
            "INJECTION_DETECTED",
            "INJECTION_BLOCKED",
        )
        return build_blocked_response()

    intent = classify_intent(req.message)
    city, source_badge, context_data = await gather_telemetry_context(req)
    reply, model, tokens, is_fallback, flags, status = await _resolve_copilot_reply(
        request, req, intent, city, source_badge, context_data
    )
    latency_ms = int((time.time() - start_time) * 1000)
    await persist_ai_trace(
        db, current_user, prompt_hash, intent, model, latency_ms, tokens, ",".join(flags), status
    )
    return CopilotChatResponse(
        reply=reply,
        intent=intent,
        source_badge=source_badge,
        evidence_context=context_data,
        why_this_advice=f"Computed from {city} air telemetry (NAQI {context_data['aqi']} · {context_data['category']}) and Window Oracle forecast dynamics.",
        limitations="Public health guidance only — not clinical medical advice.",
        validator_flags=flags,
        suggested_prompts=SUGGESTED_PROMPTS_MAP.get(intent, SUGGESTED_PROMPTS_MAP["GENERAL"]),
        is_fallback=is_fallback,
    )
