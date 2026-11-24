# BreatheIQ Security Architecture & Threat Model

## 1. Authentication & Token Lifecycle

BreatheIQ strictly uses JWT-based authentication without third-party vendor SDKs or OAuth wrappers.

- **Access Token:**
  - Standard HMAC-SHA256 (HS256) signed JWT with a 15-minute lifespan.
  - Stored exclusively in browser client JavaScript memory (`inMemoryToken`).
  - Never stored in `localStorage`, `sessionStorage`, or cookies to mitigate persistent XSS extraction.
- **Refresh Token:**
  - Issued in a secured `HttpOnly`, `SameSite=Strict` cookie (`breatheiq_refresh`).
  - Valid for 7 days with mandatory rotation upon each redemption.
  - Hashed with Argon2id and stored in the database for single-use token-family validation.
  - Automatic reuse detection revokes all active family sessions upon replay attack detection.

## 2. Password Security & Cryptography

- **Password Hashing:** Passwords hashed using Argon2id (`argon2-cffi`) with secure memory cost, time cost, and parallelism parameters.
- **Generic Auth Errors:** Authentication failures return unified "Invalid email or password" responses to prevent user enumeration attacks.
- **Rate Limiting:** IP-based and endpoint-based request throttling enforced via SlowAPI on auth endpoints (`/login`, `/signup`, `/refresh`).

## 3. Role-Based Access Control (RBAC)

Three distinct authorization roles are enforced:
1. `user`: Access to personal households, indoor readings, adaptive routine, and CleanRoute planning.
2. `moderator`: Access to community Air Watch report validation queue.
3. `admin`: Access to system health, user registry, cryptographic audit logs, and AI Copilot traces.

RBAC checks operate as mandatory dependency functions (`require_admin`, `require_moderator`, `get_current_user`) directly querying the database on every sensitive API invocation.

## 4. AI Copilot Adversarial Defenses

- **Input Sanitization:** Regex-based barrier scanning for prompt injections, system prompt leak prompts, and jailbreak phrases (`ignore previous instructions`, `DAN`, `system override`).
- **Evidence Verification:** Output numbers must reconcile with fetched atmospheric telemetry.
- **Safe Fallback:** Fails over to labeled static advisory templates when external LLM calls time out or fail validation.

## 5. Network & Browser Hardening

- **CORS Allow-List:** Explicitly bounded to trusted frontend origins.
- **OWASP Top 10 Protections:**
  - SQL Injection: All database queries utilize SQLAlchemy 2 parameterized ORM methods.
  - Mass Assignment: Pydantic v2 schemas strictly validate incoming request payloads.
  - Data Minimization: Auth tokens and password hashes excluded from response serializers.
