# BreatheIQ Internationalization (i18n) Human Review Log

Per `AGENTS.md` Section 7, all non-English UI strings in `frontend/src/i18n/translations.ts` that were authored or machine-translated during development are flagged here for native-speaker review before public production rollout.

## Supported Locales (`frontend/src/i18n/translations.ts`)

| Locale | Language | `<html lang>` Sync | Coverage Scope | Human Review Status |
|---|---|---|---|---|
| `en` | English | Yes | All 23 keys in `TRANSLATIONS.en` | Baseline reference |
| `hi` | Hindi (`हिन्दी`) | Yes | All 23 keys in `TRANSLATIONS.hi` (`nav.*`, `dash.*`) | **NEEDS_HUMAN_REVIEW** |
| `mr` | Marathi (`मराठी`) | Yes | All 23 keys in `TRANSLATIONS.mr` (`nav.*`, `dash.*`) | **NEEDS_HUMAN_REVIEW** |

## Keys Flagged for Native Speaker Sign-Off

1. **Atmospheric Terms:** `nav.analytics` (`इन्वर्जन विश्लेषण` / `इन्व्हर्जन कल`), `dash.windowOracle` (`खिड़की खोलने का सही समय` / `खिडकी उघडण्याची योग्य वेळ`) — confirm everyday family comprehension vs technical accuracy.
2. **Safety & Medical Disclaimers:** `dash.medicalDisclaimer` (`केवल जन-स्वास्थ्य मार्गदर्शन — चिकित्सा सलाह नहीं।` / `केवळ सार्वजनिक आरोग्य मार्गदर्शन — वैद्यकीय सल्ला नाही.`) — confirm legally and culturally appropriate phrasing across Indian regional contexts.
3. **Fallback Behavior:** Missing translation keys cleanly fall back to English (`TRANSLATIONS.en`), and `LanguageProvider` updates `document.documentElement.lang` automatically on toggle.
