"""Server-side Google Gemini gateway, context builder, and AI trace persistence."""

import asyncio
import logging
from typing import Any

import httpx
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import DEFAULT_CITY_LAT, DEFAULT_CITY_LON, DEFAULT_CITY_NAME
from app.engines.ventilation import evaluate_window_oracle
from app.models.auth import User
from app.models.copilot import AITrace
from app.schemas.app_schemas import CopilotChatRequest, CopilotChatResponse
from app.services.air_data import air_data_service

logger = logging.getLogger(__name__)


async def gather_telemetry_context(req: CopilotChatRequest) -> tuple[str, str, dict[str, Any]]:
    """Fetch live/modeled air telemetry and forecast-backed Window Oracle context."""
    city = req.city or DEFAULT_CITY_NAME
    lat = req.lat if req.lat is not None else DEFAULT_CITY_LAT
    lon = req.lon if req.lon is not None else DEFAULT_CITY_LON
    air_payload, forecast_series = await asyncio.gather(
        air_data_service.get_current_air_quality(lat, lon, city),
        air_data_service.get_forecast(lat, lon, hours=24),
    )
    oracle = evaluate_window_oracle(forecast_series)
    context_data: dict[str, Any] = {
        "city": air_payload.city,
        "aqi": air_payload.naqi.aqi or 150,
        "category": air_payload.naqi.category or "Moderate",
        "dominant_pollutant": air_payload.naqi.dominant_pollutant or "PM2.5",
        "pm25": air_payload.pm25,
        "pm10": air_payload.pm10,
        "temperature_c": air_payload.temperature_c,
        "relative_humidity": air_payload.relative_humidity_pct,
        "wind_speed": air_payload.wind_speed_ms,
        "source": air_payload.source,
        "timestamp": air_payload.timestamp_utc,
        "best_window_start": oracle.best_window_start,
        "best_window_end": oracle.best_window_end,
        "current_action": oracle.current_action,
    }
    return city, air_payload.source, context_data


def _build_gemini_prompt(city: str, user_message: str, context_data: dict[str, Any]) -> str:
    """Construct concise telemetry-grounded Gemini instruction prompt."""
    system_instruction = (
        "You are BreatheIQ Atmospheric Assistant. Give concise, grounded advice for families facing winter smog. "
        "CRITICAL RULES: Ground recommendations only in provided context data. "
        "Cite exact NAQI and PM2.5 values provided. Never invent clinical diagnoses or medications."
    )
    prompt = (
        f"Context Telemetry for {city}:\n"
        f"- NAQI: {context_data['aqi']} ({context_data['category']})\n"
        f"- Dominant Pollutant: {context_data['dominant_pollutant']}\n"
        f"- PM2.5: {context_data['pm25']} µg/m³\n"
        f"- Best Window Ventilation: {context_data['best_window_start']} - {context_data['best_window_end']}\n"
        f"- Current Action: {context_data['current_action']}\n\n"
        f"User Query: {user_message}\nAnswer concisely in 2-4 sentences."
    )
    return f"{system_instruction}\n\n{prompt}"


async def _post_gemini(request: Request, url: str, payload: dict[str, Any]) -> httpx.Response:
    """Send Gemini HTTP request using shared pooled client when available."""
    shared_client: httpx.AsyncClient | None = getattr(request.app.state, "http_client", None)
    if shared_client is not None:
        return await shared_client.post(url, json=payload, timeout=6.0)
    async with httpx.AsyncClient(timeout=6.0) as local_client:
        return await local_client.post(url, json=payload)


async def fetch_gemini_reply(
    request: Request,
    city: str,
    user_message: str,
    context_data: dict[str, Any],
    model_name: str,
) -> tuple[str | None, int]:
    """Invoke Google Gemini REST API server-side when ``GEMINI_API_KEY`` is set."""
    if not settings.GEMINI_API_KEY:
        return None, 0
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": _build_gemini_prompt(city, user_message, context_data)}]}]
    }
    try:
        res = await _post_gemini(request, url, payload)
        if res.status_code != 200:
            return None, 0
        data = res.json()
        candidates = data.get("candidates", [])
        raw_text = (
            candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if candidates
            else ""
        )
        tokens = int(data.get("usageMetadata", {}).get("totalTokenCount", 120))
        return (str(raw_text), tokens) if raw_text else (None, 0)
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as exc:
        logger.warning("Gemini API request failed (%s); falling back to template.", exc)
        return None, 0


async def persist_ai_trace(
    db: AsyncSession,
    user: User | None,
    prompt_hash: str,
    intent: str,
    model: str,
    latency_ms: int,
    tokens_used: int,
    validator_flags: str,
    status: str,
) -> None:
    """Persist safety trace audit metadata without storing raw prompt text."""
    db.add(
        AITrace(
            user_id=user.id if user else None,
            prompt_hash=prompt_hash,
            intent=intent,
            model=model,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            validator_flags=validator_flags,
            status=status,
        )
    )
    await db.commit()


def build_blocked_response() -> CopilotChatResponse:
    """Return refusal payload when adversarial prompt injection is blocked."""
    return CopilotChatResponse(
        reply=(
            "I cannot fulfill requests that attempt to alter my safety instructions or system prompt. "
            "I am here to help you navigate winter smog and urban air quality."
        ),
        intent="INJECTION_BLOCKED",
        source_badge="BLOCKED",
        evidence_context={},
        why_this_advice="The message matched adversarial prompt injection patterns.",
        limitations="System instructions and safety firewalls are non-negotiable.",
        validator_flags=["INJECTION_BLOCKED"],
        suggested_prompts=[
            "What is the current AQI in Mumbai?",
            "When is the best time to ventilate today?",
        ],
        is_fallback=True,
    )
