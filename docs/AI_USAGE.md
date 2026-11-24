# BreatheIQ AI Architecture & Grounding Protocol

## 1. Role of Generative AI

In BreatheIQ, GenAI acts as a conversational risk interpreter and behavioral coach—not an unconstrained medical oracle or environmental estimator.

- **Model:** Google Gemini 2.5 Flash (`gemini-2.5-flash`).
- **Core Function:** Synthesizes multi-pollutant environmental telemetry, boundary-layer weather forecasts, and personalized family vulnerability profiles into plain-language actionable advice.

## 2. Hallucination Mitigation & Evidence Grounding

To address LLM hallucination risks in health-critical contexts, BreatheIQ implements a strict, multi-stage validation pipeline:

```
[ User Query ]
     │
     ▼
[ 1. Adversarial Scanner ] ──(Triggered)──> [ Return Safe Advisory ]
     │ (Clean)
     ▼
[ 2. Context Retrieval ] ──> Injects Ground Telemetry & Active AirTwin Profile
     │
     ▼
[ 3. Constrained Gemini Call ]
     │
     ▼
[ 4. Code-Based Safety & Evidence Validator ]
     ├── Validates mentioned AQI / PM2.5 numbers against retrieved telemetry
     ├── Checks for unauthorized diagnostic/medical claims
     └── Appends mandatory health advisory disclaimer
     │
     ▼
[ 5. Trace Logger ] ──> Stores run context and validation flag in `ai_traces` table
```

## 3. The Code-Based Safety & Evidence Validator

The validator (`backend/app/api/v1/endpoints/copilot.py`) operates deterministically:
1. **Numeric Reconciler:** Extracts any numeric concentrations cited by the model and cross-checks them against injected station data. If the model invents a figure outside a 15% tolerance of actual sensor data, the validator corrects the statement.
2. **Medical Guardrail:** Replaces diagnostic statements with standard public health advisory guidance ("Guidance only — consult a healthcare professional for persistent respiratory symptoms").
3. **Traceability:** Every response renders with interactive evidence chips allowing users to expand "Why this advice?" and inspect the underlying sensor data.

## 4. Deterministic Offline Fallback

If external LLM access times out, encounters rate limits, or is offline, the system immediately switches to category-matched advisory templates labeled with `FALLBACK` provenance.
