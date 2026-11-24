"""
backend/app/api/v1/endpoints/copilot.py
Grounded Atmospheric Copilot Pipeline with Intent Classification,
Evidence Retrieval, Fallback Templates, and Code-Based Safety & Evidence Validator.
"""

import hashlib
import time
import re
from typing import Dict, Any, List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.api.deps import get_db, get_current_user_optional
from app.models.auth import User
from app.models.copilot import AITrace
from app.services.air_data import air_data_service
from app.engines.ventilation import evaluate_window_oracle

router = APIRouter(prefix="/assistant", tags=["Atmospheric Assistant Copilot"])

# Prompt injection patterns
INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior)\s+instructions\b",
    r"(?i)\b(?:system\s+prompt|instructions)\s+(?:exfiltration|leak|reveal|print|dump)\b",
    r"(?i)\b(?:jailbreak|dan\s+mode|developer\s+mode)\b",
    r"(?i)\bact\s+as\s+(?:an?\s+)?(?:unrestricted|evil|unaligned|bypassed)\b",
    r"(?i)\bforget\s+(?:all\s+)?your\s+rules\b",
]

class CopilotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    city: Optional[str] = "Mumbai"
    lat: Optional[float] = 19.0760
    lon: Optional[float] = 72.8777
    user_profile: Optional[Dict[str, Any]] = None

class CopilotChatResponse(BaseModel):
    reply: str
    intent: str
    source_badge: str
    evidence_context: Dict[str, Any]
    why_this_advice: str
    limitations: str
    validator_flags: List[str]
    suggested_prompts: List[str]
    is_fallback: bool

def detect_prompt_injection(query: str) -> bool:
    """Detects adversarial prompt-injection attempts."""
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, query):
            return True
    return False

def classify_intent(query: str) -> str:
    """Rule-based intent classifier for atmospheric domains."""
    q = query.lower()
    if any(k in q for k in ["routine", "morning walk", "jog", "exercise", "walk", "schedule", "run", "outside"]):
        return "ROUTINE"
    if any(k in q for k in ["window", "air out", "ventilat", "inversion", "open"]):
        return "VENTILATION"
    if any(k in q for k in ["purifier", "cadr", "hepa", "filter", "corsi", "cleaner"]):
        return "PURIFIER"
    if any(k in q for k in ["commute", "transit", "route", "cleanroute", "metro", "car", "travel", "bike"]):
        return "TRANSIT"
    if any(k in q for k in ["symptom", "asthma", "cough", "chest", "mask", "n95", "doctor", "health", "child", "elderly"]):
        return "HEALTH_ADVISORY"
    return "GENERAL"

def generate_fallback_template(intent: str, context: Dict[str, Any], city: str) -> str:
    """
    Rich, deterministic category template fallback using real context telemetry.
    Ensures the assistant NEVER crashes or returns ungrounded empty text.
    """
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
            f"Based on real-time atmospheric data in {city} (NAQI {aqi} · {category}), surface particulate "
            f"density is currently {pm25} µg/m³ with {dominant} as the dominant driver. "
            f"Peak winter nocturnal inversion typically traps emissions until mid-morning. "
            f"Recommendation: Reschedule intense outdoor exercise to indoor spaces or postpone outdoor runs "
            f"until the solar boundary layer expands around {best_start}."
        )

    if intent == "VENTILATION":
        return (
            f"Window Oracle analysis for {city} indicates current status: {current_action}. "
            f"Due to nocturnal ground radiative cooling and boundary layer compression, ground particulates are elevated. "
            f"The safest aeration window is modeled between {best_start} and {best_end}, when midday solar heating "
            f"elevates the mixing height and surface wind speed assists particulate dilution."
        )

    if intent == "PURIFIER":
        return (
            f"For indoor spaces in {city} under current ambient PM2.5 of {pm25} µg/m³, a True HEPA (H13) air purifier "
            f"sized for 5 Air Changes per Hour (ACH) is recommended. "
            f"Required CADR is calculated by: Volume (m³) × 5.0. "
            f"Keep windows sealed during operation to prevent continuous infiltration of ambient particles."
        )

    if intent == "TRANSIT":
        return (
            f"Commuting in {city} during {category} air quality (AQI {aqi}): "
            f"Electric metro reduces per-passenger CO2 to 18 g/km (compared to 180 g/km for solo car travel) "
            f"while avoiding roadside particulate plumes. If traveling above ground during rush hours, wear a fitted N95 mask."
        )

    if intent == "HEALTH_ADVISORY":
        return (
            f"In {city}, the composite NAQI is currently {aqi} ({category}), driven primarily by {dominant}. "
            f"CPCB guidance: Sensitive groups (children, elderly, and individuals with respiratory conditions) "
            f"should avoid prolonged outdoor exertion. Use an N95 respirator if stepping out during twilight stagnation."
        )

    # General
    return (
        f"Atmospheric summary for {city}: The National Air Quality Index is currently {aqi} ({category}) "
        f"with a PM2.5 concentration of {pm25} µg/m³ [Data Provenance: {source}]. "
        f"Dominant pollutant is {dominant}. Weather parameters show wind speed at {context.get('wind_speed', 3.0)} m/s."
    )

def validate_and_correct_response(
    raw_text: str,
    context: Dict[str, Any],
    city: str,
    source: str
) -> (str, List[str]):
    """
    Code-Based Safety and Evidence Validator:
    1. Enforces medical disclaimers on clinical terms.
    2. Verifies numerical consistency against retrieved ground context; corrects hallucinations.
    3. Enforces source citation badges.
    """
    flags = []
    text = raw_text

    # 1. Medical Claim Check
    medical_terms = ["asthma", "inhaler", "diagnos", "prescrib", "bronchitis", "copd", "medication", "pill", "treat"]
    if any(t in text.lower() for t in medical_terms):
        flags.append("MEDICAL_DISCLAIMER_ATTACHED")
        if "guidance only" not in text.lower():
            text += "\n\n*Public health guidance only — not clinical medical advice. Consult a licensed physician for medical symptoms.*"

    # 2. Numerical Consistency Check (AQI numbers)
    real_aqi = context.get("aqi")
    if real_aqi is not None:
        # Check for cited AQI numbers
        aqi_matches = re.findall(r"\bAQI\s*(?:is|of|level|around|:)?\s*(\d{2,3})\b", text, re.IGNORECASE)
        for cited_str in aqi_matches:
            cited_val = int(cited_str)
            # If difference exceeds 15% from context data, apply correction
            if abs(cited_val - real_aqi) / max(1, real_aqi) > 0.15:
                flags.append("CORRECTION_APPLIED")
                text = re.sub(
                    rf"\bAQI\s*(?:is|of|level|around|:)?\s*{cited_val}\b",
                    f"AQI {real_aqi} [CORRECTION_APPLIED: Verified context AQI is {real_aqi}]",
                    text,
                    count=1,
                    flags=re.IGNORECASE
                )

    # 3. Source Citation Enforcement
    timestamp = context.get("timestamp", "Current")
    badge_str = f"[{source}: {city} · {timestamp[:16] if 'T' in timestamp else timestamp}]"
    if badge_str not in text:
        text += f"\n\n{badge_str}"
        flags.append("SOURCE_CITATION_ATTACHED")

    return text, flags

@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat_endpoint(
    req: CopilotChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    start_time = time.time()
    city = req.city or "Mumbai"
    prompt_hash = hashlib.sha256(req.message.encode("utf-8")).hexdigest()

    # Step 1: Prompt Injection Detection
    if detect_prompt_injection(req.message):
        latency_ms = int((time.time() - start_time) * 1000)
        trace = AITrace(
            user_id=current_user.id if current_user else None,
            prompt_hash=prompt_hash,
            intent="INJECTION_BLOCKED",
            model="safety-firewall-v1",
            latency_ms=latency_ms,
            tokens_used=0,
            validator_flags="INJECTION_DETECTED",
            status="INJECTION_BLOCKED"
        )
        db.add(trace)
        await db.commit()

        return CopilotChatResponse(
            reply="I cannot fulfill requests that attempt to alter my safety instructions or system prompt. I am here to help you navigate winter smog and urban air quality.",
            intent="INJECTION_BLOCKED",
            source_badge="BLOCKED",
            evidence_context={},
            why_this_advice="The message matched adversarial prompt injection patterns.",
            limitations="System instructions and safety firewalls are non-negotiable.",
            validator_flags=["INJECTION_BLOCKED"],
            suggested_prompts=["What is the current AQI in Mumbai?", "When is the best time to ventilate today?"],
            is_fallback=True
        )

    # Step 2: Intent Classification
    intent = classify_intent(req.message)

    # Step 3: Context Retrieval
    air_payload = await air_data_service.get_current_air_quality(req.lat or 19.0760, req.lon or 72.8777, city)
    oracle_out = evaluate_window_oracle()

    context_data = {
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
        "current_action": oracle_out.current_action
    }

    # Step 4: LLM Generation or Category Template Fallback
    raw_reply = None
    is_fallback = False
    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
    tokens_used = 0

    if settings.GEMINI_API_KEY:
        try:
            # Direct server-side Gemini API call
            async with httpx.AsyncClient(timeout=5.0) as client:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
                system_instruction = (
                    "You are BreatheIQ Atmospheric Assistant. You give concise, grounded advice for families facing winter smog. "
                    "CRITICAL RULES: Ground all recommendations in the provided context data. "
                    "Cite the exact AQI and PM2.5 provided. Do not invent medical diagnoses or medications."
                )
                prompt = (
                    f"Context Telemetry for {city}:\n"
                    f"- NAQI: {context_data['aqi']} ({context_data['category']})\n"
                    f"- Dominant Pollutant: {context_data['dominant_pollutant']}\n"
                    f"- PM2.5: {context_data['pm25']} µg/m³\n"
                    f"- Best Window Ventilation: {context_data['best_window_start']} - {context_data['best_window_end']}\n"
                    f"- Current Action: {context_data['current_action']}\n\n"
                    f"User Query: {req.message}\n"
                    f"Answer concisely in 2-4 sentences."
                )
                payload = {
                    "contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}]
                }
                res = await client.post(gemini_url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_reply = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        tokens_used = data.get("usageMetadata", {}).get("totalTokenCount", 120)
        except Exception:
            raw_reply = None

    if not raw_reply:
        # Labeled Category Template Fallback
        raw_reply = generate_fallback_template(intent, context_data, city)
        is_fallback = True
        model_name = "category-template-fallback"

    # Step 5: Code-Based Safety & Evidence Validator
    validated_reply, validator_flags = validate_and_correct_response(
        raw_reply, context_data, city, air_payload.source
    )

    latency_ms = int((time.time() - start_time) * 1000)
    status_code = "FALLBACK_TEMPLATE" if is_fallback else ("CORRECTION_APPLIED" if "CORRECTION_APPLIED" in validator_flags else "SUCCESS")

    # Step 6: Trace Logging
    trace = AITrace(
        user_id=current_user.id if current_user else None,
        prompt_hash=prompt_hash,
        intent=intent,
        model=model_name,
        latency_ms=latency_ms,
        tokens_used=tokens_used,
        validator_flags=",".join(validator_flags),
        status=status_code
    )
    db.add(trace)
    await db.commit()

    # Contextual Follow-up Prompts
    suggested = {
        "ROUTINE": ["When is it safe to open windows today?", "What is the best commute route right now?", "How do I protect my child from morning smog?"],
        "VENTILATION": ["How does the thermal inversion work?", "What CADR purifier do I need for my bedroom?", "Should I open windows now?"],
        "PURIFIER": ["What is a Corsi-Rosenthal box?", "How often should I clean the pre-filter?", "Does a purifier remove cooking fumes?"],
        "TRANSIT": ["How much CO2 do I save by taking the metro?", "Should I cycle in this AQI?", "What mask is effective against PM2.5?"],
        "HEALTH_ADVISORY": ["What are the symptoms of PM2.5 exposure?", "Is indoor air always safer than outdoor?", "When is the next low-exposure window?"],
        "GENERAL": ["What is the dominant pollutant in Mumbai?", "How is CPCB NAQI calculated?", "What is the 24-hour smog forecast?"]
    }.get(intent, ["When to open windows?", "What is the current AQI?", "Best morning walk time?"])

    return CopilotChatResponse(
        reply=validated_reply,
        intent=intent,
        source_badge=air_payload.source,
        evidence_context=context_data,
        why_this_advice=f"Computed from {city} air telemetry (NAQI {context_data['aqi']} · {context_data['category']}) and Window Oracle inversion dynamics.",
        limitations="Public health guidance only — not clinical medical advice.",
        validator_flags=validator_flags,
        suggested_prompts=suggested,
        is_fallback=is_fallback
    )
