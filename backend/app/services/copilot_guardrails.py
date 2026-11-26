"""Prompt-injection filtering, domain intent routing, templates, and output safety validator."""

import re
from typing import Any

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

MEDICAL_KEYWORDS = (
    "asthma",
    "inhaler",
    "diagnos",
    "prescrib",
    "bronchitis",
    "copd",
    "medication",
    "pill",
    "treat",
)

INTENT_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "ROUTINE",
        ("routine", "morning walk", "jog", "exercise", "walk", "schedule", "run", "outside"),
    ),
    ("VENTILATION", ("window", "air out", "ventilat", "inversion", "open")),
    ("PURIFIER", ("purifier", "cadr", "hepa", "filter", "corsi", "cleaner")),
    ("TRANSIT", ("commute", "transit", "route", "cleanroute", "metro", "car", "travel", "bike")),
    (
        "HEALTH_ADVISORY",
        (
            "symptom",
            "asthma",
            "cough",
            "chest",
            "mask",
            "n95",
            "doctor",
            "health",
            "child",
            "elderly",
        ),
    ),
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

FALLBACK_TEMPLATES: dict[str, str] = {
    "ROUTINE": (
        "Based on atmospheric telemetry in {city} (NAQI {aqi} · {category}), surface particulate "
        "density is currently {pm25} µg/m³ with {dominant} as the dominant driver. "
        "Reschedule intense outdoor exercise indoors or postpone outdoor activity until "
        "boundary layer mixing improves around {best_start}."
    ),
    "VENTILATION": (
        "Window Oracle analysis for {city} indicates current status: {current_action}. "
        "The safest modeled aeration window is between {best_start} and {best_end}, when "
        "solar boundary layer expansion and surface wind aid particulate dilution."
    ),
    "PURIFIER": (
        "For indoor spaces in {city} under ambient PM2.5 of {pm25} µg/m³, size a True HEPA (H13) "
        "air purifier for 5 Air Changes per Hour (CADR = Volume m³ x 5.0) and keep windows sealed."
    ),
    "TRANSIT": (
        "Commuting in {city} during {category} air quality (AQI {aqi}): electric metro transit cuts "
        "per-passenger exhaust to 18 g CO2/km (vs 180 g/km solo petrol car) while lowering roadside "
        "particulate exposure. Wear a fitted N95 mask on arterial corridors."
    ),
    "HEALTH_ADVISORY": (
        "In {city}, composite NAQI is {aqi} ({category}), driven by {dominant}. "
        "CPCB advisory: sensitive groups (children, seniors, respiratory conditions) should minimize "
        "prolonged outdoor exertion and use an N95 respirator during peak stagnation."
    ),
    "GENERAL": (
        "Atmospheric summary for {city}: NAQI is {aqi} ({category}) with PM2.5 at {pm25} µg/m³ "
        "[Provenance: {source}]. Dominant pollutant is {dominant}; wind speed is {wind_speed} m/s."
    ),
}


def detect_prompt_injection(query: str) -> bool:
    """Detect common adversarial prompt-injection signatures."""
    return any(re.search(pattern, query) for pattern in INJECTION_PATTERNS)


def classify_intent(query: str) -> str:
    """Classify user query into an atmospheric guidance domain."""
    lowered = query.lower()
    for intent_name, keywords in INTENT_KEYWORDS:
        if any(kw in lowered for kw in keywords):
            return intent_name
    return "GENERAL"


def generate_fallback_template(intent: str, context: dict[str, Any], city: str) -> str:
    """Format deterministic category template fallback grounded in retrieved air context."""
    template = FALLBACK_TEMPLATES.get(intent, FALLBACK_TEMPLATES["GENERAL"])
    return template.format(
        city=city,
        aqi=context.get("aqi", 150),
        category=context.get("category", "Moderate"),
        dominant=context.get("dominant_pollutant", "PM2.5"),
        pm25=context.get("pm25", 85.0),
        best_start=context.get("best_window_start", "12:00"),
        best_end=context.get("best_window_end", "15:00"),
        current_action=context.get("current_action", "PURIFY"),
        source=context.get("source", "MODELED"),
        wind_speed=context.get("wind_speed", 3.0),
    )


def _correct_aqi_drift(text: str, real_aqi: int | float, flags: list[str]) -> str:
    """Replace model-hallucinated AQI values diverging >15% from retrieved telemetry."""
    for cited_str in re.findall(
        r"\bAQI\s*(?:is|of|level|around|:)?\s*(\d{2,3})\b", text, re.IGNORECASE
    ):
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
    return text


def validate_and_correct_response(
    raw_text: str,
    context: dict[str, Any],
    city: str,
    source: str,
) -> tuple[str, list[str]]:
    """Enforce medical boundary disclaimer, AQI numerical consistency, and source citation."""
    flags: list[str] = []
    text = raw_text
    if any(term in text.lower() for term in MEDICAL_KEYWORDS):
        flags.append("MEDICAL_DISCLAIMER_ATTACHED")
        if "guidance only" not in text.lower():
            text += f"\n\n{MEDICAL_DISCLAIMER_TEXT}"
    real_aqi = context.get("aqi")
    if isinstance(real_aqi, (int, float)):
        text = _correct_aqi_drift(text, real_aqi, flags)
    timestamp = str(context.get("timestamp", "Current"))
    badge_str = f"[{source}: {city} · {timestamp[:16] if 'T' in timestamp else timestamp}]"
    if badge_str not in text:
        text += f"\n\n{badge_str}"
        flags.append("SOURCE_CITATION_ATTACHED")
    return text, flags
