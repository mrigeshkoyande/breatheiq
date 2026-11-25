"""Grounded Atmospheric Copilot Pipeline.

Includes adversarial prompt-injection filtering, domain intent classification,
forecast-backed telemetry context retrieval, Gemini generation with labeled fallback,
and deterministic code-based safety validation.
"""

import asyncio
import hashlib
import logging
import re
import time
from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user_optional, get_db
from app.core.config import settings
from app.core.rate_limit import limiter
from app.engines.ventilation import evaluate_window_oracle
from app.models.auth import User
from app.models.copilot import AITrace
from app.schemas.app_schemas import CopilotChatRequest, CopilotChatResponse
from app.services.air_data import air_data_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assistant", tags=["Atmospheric Assistant Copilot"])

INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"(?i)\b(?:system\s+prompt|instructions)\s+(?:exfiltration|leak|reveal|print|dump)\b",
    r"(?i)\b(?:jailbreak|dan\s+mode|developer\s+mode)\b",
    r"(?i)\bact\s+as\s+(?:an?\s+)?(?:unrestricted|evil|unaligned|bypassed)\b",
    r"(?i)\bforget\s+(?:all\s+)?your\s+rules\b",
]

MEDICAL_DISCLAIMER_TEXT = (
    "*Public health guidance only — not clinical medical advice. "
    "Consult a licensed physician for medical symptoms.*"
)

SUGGESTED_PROMPTS_MAP: dict[str, list[str]] = {
    "ROUTINE": [
        "When is it safe to open windows today?",
        "What is the best commute route right now?",
        "How do I protect my child from morning smog?",
    ],
    "VENTILATION": [
        "How does the thermal inversion work?",
        "What CADR purifier do I need for my bedroom?",
        "Should I open windows now?",
    ],
    "PURIFIER": [
        "What is a Corsi-Rosenthal box?",
        "How often should I clean the pre-filter?",
        "Does a purifier remove cooking fumes?",
    ],
    "TRANSIT": [
        "How much CO2 do I save by taking the metro?",
        "Should I cycle in this AQI?",
        "What mask is effective against PM2.5?",
    ],
    "HEALTH_ADVISORY": [
        "What are the symptoms of PM2.5 exposure?",
        "Is indoor air always safer than outdoor?",
        "When is the next low-exposure window?",
    ],
    "GENERAL": [
        "What is the dominant pollutant in Mumbai?",
        "How is CPCB NAQI calculated?",
        "What is the 24-hour smog forecast?",
    ],
}


def detect_prompt_injection(query: str) -> bool:
    """Detect common adversarial prompt-injection signatures."""
    return any(re.search(pattern, query) for pattern in INJECTION_PATTERNS)


def classify_intent(query: str) -> str:
    """Rule-based intent classifier for atmospheric guidance domains."""
    q = query.lower()
    if any(k in q for k in ("routine", "morning walk", "jog", "exercise", "walk", "schedule", "run", "outside")):
        return "ROUTINE"
    if any(k in q for k in ("window", "air out", "ventilat", "inversion", "open")):
        return "VENTILATION"
    if any(k in q for k in ("purifier", "cadr", "hepa", "filter", "corsi", "cleaner")):
        return "PURIFIER"
    if any(k in q for k in ("commute", "transit", "route", "cleanroute", "metro", "car", "travel", "bike")):
        return "TRANSIT"
    if any(k in q for k in ("symptom", "asthma", "cough", "chest", "mask", "n95", "doctor", "health", "child", "elderly")):
        return "HEALTH_ADVISORY"
    return "GENERAL"


def generate_fallback_template(intent: str, context: dict[str, Any], city: str) -> str:
    """Deterministic category template fallback grounded in retrieved air context."""
    aqi = context.get("aqi", 150)
    category = context.get("category", "Moderate")
    dominant = context.get("dominant_pollutant", "PM2.5")
    pm25 = context.get("pm25", 85.0)
    best_start = context.get("best_window_start", "12:00")
    best_end = context.get("best_window_end", "15:00")
    current_action = context.get("current_action", "PURIFY")
    source = context.get("source", "MODELED")

    if intent == "ROUTINE":
        return (
            f"Based on atmospheric telemetry in {city} (NAQI {aqi} · {category}), surface particulate "
            f"density is currently {pm25} µg/m³ with {dominant} as the dominant driver. "
            f"Reschedule intense outdoor exercise indoors or postpone outdoor activity until "
            f"boundary layer mixing improves around {best_start}."
        )
    if intent == "VENTILATION":
        return (
            f"Window Oracle analysis for {city} indicates current status: {current_action}. "
            f"The safest modeled aeration window is between {best_start} and {best_end}, when "
            "solar boundary layer expansion and surface wind aid particulate dilution."
        )
    if intent == "PURIFIER":
        return (
            f"For indoor spaces in {city} under ambient PM2.5 of {pm25} µg/m³, size a True HEPA (H13) "
            "air purifier for 5 Air Changes per Hour (CADR = Volume m³ x 5.0) and keep windows sealed."
        )
    if intent == "TRANSIT":
        return (
            f"Commuting in {city} during {category} air quality (AQI {aqi}): electric metro transit cuts "
            "per-passenger exhaust to 18 g CO2/km (vs 180 g/km solo petrol car) while lowering roadside "
            "particulate exposure. Wear a fitted N95 mask on arterial corridors."
        )
    if intent == "HEALTH_ADVISORY":
        return (
            f"In {city}, composite NAQI is {aqi} ({category}), driven by {dominant}. "
            "CPCB advisory: sensitive groups (children, seniors, respiratory conditions) should minimize "
            "prolonged outdoor exertion and use an N95 respirator during peak stagnation."
        )

    return (
        f"Atmospheric summary for {city}: NAQI is {aqi} ({category}) with PM2.5 at {pm25} µg/m³ "
        f"[Provenance: {source}]. Dominant pollutant is {dominant}; wind speed is "
        f"{context.get('wind_speed', 3.0)} m/s."
    )


def validate_and_correct_response(
    raw_text: str,
    context: dict[str, Any],
    city: str,
    source: str,
) -> tuple[str, list[str]]:
    """Enforce medical boundary disclaimer, AQI numerical consistency, and source citation."""
    flags: list[str] = []
    text = raw_text

    medical_terms = ("asthma", "inhaler", "diagnos", "prescrib", "bronchitis", "copd", "medication", "pill", "treat")
    if any(term in text.lower() for term in medical_terms):
        flags.append("MEDICAL_DISCLAIMER_ATTACHED")
        if "guidance only" not in text.lower():
            text += f"\n\n{MEDICAL_DISCLAIMER_TEXT}"

    real_aqi = context.get("aqi")
    if isinstance(real_aqi, (int, float)):
        aqi_matches = re.findall(r"\bAQI\s*(?:is|of|level|around|:)?\s*(\d{2,3})\b", text, re.IGNORECASE)
        for cited_str in aqi_matches:
            cited_val = int(cited_str)
            if abs(cited_val - real_aqi) / max(1, real_aqi) > 0.15:
                flags.append("CORRECTION_APPLIED")
                text = re.sub(
                    rf"\bAQI\s*(?:is|of|level|around|:)?\s*{cited_val}\b",
                    f"AQI {real_aqi} [CORRECTION_APPLIED: Verified context AQI is {real_aqi}]",
                    text,
                    count=1,
                    flags=re.IGNORECASE,
                )

    timestamp = str(context.get("timestamp", "Current"))
    badge_str = f"[{source}: {city} · {timestamp[:16] if 'T' in timestamp else timestamp}]"
    if badge_str not in text:
        text += f"\n\n{badge_str}"
        flags.append("SOURCE_CITATION_ATTACHED")

    return text, flags


async def _fetch_gemini_reply(
    request: Request,
    city: str,
    user_message: str,
    context_data: dict[str, Any],
    model_name: str,
) -> tuple[str | None, int]:
    """Call Google Gemini server-side using shared connection pool when configured."""
    if not settings.GEMINI_API_KEY:
        return None, 0

    gemini_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        f"?key={settings.GEMINI_API_KEY}"
    )
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
        f"User Query: {user_message}\n"
        "Answer concisely in 2-4 sentences."
    )
    payload = {"contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}]}
    shared_client: httpx.AsyncClient | None = getattr(request.app.state, "http_client", None)

    try:
        if shared_client is not None:
            res = await shared_client.post(gemini_url, json=payload, timeout=6.0)
        else:
            async with httpx.AsyncClient(timeout=6.0) as local_client:
                res = await local_client.post(gemini_url, json=payload)

        if res.status_code == 200:
            data = res.json()
            candidates = data.get("candidates", [])
            if candidates:
                raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                tokens = int(data.get("usageMetadata", {}).get("totalTokenCount", 120))
                if raw_text:
                    return str(raw_text), tokens
    except (httpx.HTTPError, ValueError, KeyError, IndexError, TypeError) as exc:
        logger.warning("Gemini API request failed (%s); falling back to template.", exc)

    return None, 0


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
    city = req.city or "Mumbai"
    lat = req.lat if req.lat is not None else 19.0760
    lon = req.lon if req.lon is not None else 72.8777
    prompt_hash = hashlib.sha256(req.message.encode("utf-8")).hexdigest()

    if detect_prompt_injection(req.message):
        latency_ms = int((time.time() - start_time) * 1000)
        db.add(
            AITrace(
                user_id=current_user.id if current_user else None,
                prompt_hash=prompt_hash,
                intent="INJECTION_BLOCKED",
                model="safety-firewall-v1",
                latency_ms=latency_ms,
                tokens_used=0,
                validator_flags="INJECTION_DETECTED",
                status="INJECTION_BLOCKED",
            )
        )
        await db.commit()
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

    intent = classify_intent(req.message)
    air_payload, forecast_series = await asyncio.gather(
        air_data_service.get_current_air_quality(lat, lon, city),
        air_data_service.get_forecast(lat, lon, hours=24),
    )
    oracle_out = evaluate_window_oracle(forecast_series)

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
        "best_window_start": oracle_out.best_window_start,
        "best_window_end": oracle_out.best_window_end,
        "current_action": oracle_out.current_action,
    }

    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
    raw_reply, tokens_used = await _fetch_gemini_reply(
        request, city, req.message, context_data, model_name
    )
    is_fallback = False

    if not raw_reply:
        raw_reply = (
            f"Template guidance — not AI generated: "
            f"{generate_fallback_template(intent, context_data, city)}"
        )
        is_fallback = True
        model_name = "category-template-fallback"

    validated_reply, validator_flags = validate_and_correct_response(
        raw_reply, context_data, city, air_payload.source
    )

    latency_ms = int((time.time() - start_time) * 1000)
    trace_status = (
        "FALLBACK_TEMPLATE"
        if is_fallback
        else ("CORRECTION_APPLIED" if "CORRECTION_APPLIED" in validator_flags else "SUCCESS")
    )

    db.add(
        AITrace(
            user_id=current_user.id if current_user else None,
            prompt_hash=prompt_hash,
            intent=intent,
            model=model_name,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
            validator_flags=",".join(validator_flags),
            status=trace_status,
        )
    )
    await db.commit()

    return CopilotChatResponse(
        reply=validated_reply,
        intent=intent,
        source_badge=air_payload.source,
        evidence_context=context_data,
        why_this_advice=(
            f"Computed from {city} air telemetry (NAQI {context_data['aqi']} · "
            f"{context_data['category']}) and Window Oracle forecast dynamics."
        ),
        limitations="Public health guidance only — not clinical medical advice.",
        validator_flags=validator_flags,
        suggested_prompts=SUGGESTED_PROMPTS_MAP.get(intent, SUGGESTED_PROMPTS_MAP["GENERAL"]),
        is_fallback=is_fallback,
    )
