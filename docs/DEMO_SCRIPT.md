# BreatheIQ 3-Minute Hackathon Judging Walkthrough

## Overview
This walkthrough demonstrates the end-to-end functionality of BreatheIQ, highlighting real telemetry ingestion, deterministic air quality engines, grounded Gemini Copilot advice, and community reporting.

---

## ⏱️ Act 1: Public Discovery & Science (0:00 - 0:45)

1. **Landing Page (`/`):**
   - Note the real Mumbai atmospheric redesign grounded in statutory CPCB color tokens.
   - Interact with the **What-If Scenario Simulator** slider: adjust community shifts to clean transit and observe real-time avoided PM2.5 calculation.
2. **City Telemetry Explorer (`/explore`):**
   - Switch between urban corridors (Mumbai, Delhi, Bengaluru, Pune, Kolkata).
   - Observe the provenance badge (`MODELED` with live timestamp) and hourly AQI forecasts.
3. **Methodology & Science (`/methodology`):**
   - Review statutory CPCB NAQI breakpoint formulas and cited emission factors (ARAI/CPCB).

---

## ⏱️ Act 2: Atmospheric Command Center & Window Oracle (0:45 - 1:45)

1. **Sign In (`/login`):**
   - Click "Quick Fill Demo User" (`user@breatheiq.org`) and authenticate.
2. **Main Dashboard (`/app/dashboard`):**
   - Review live Andheri West, Mumbai telemetry (172 Moderate AQI).
   - Inspect the **Window Oracle**: observe morning closed window due to low boundary layer inversion (220m), followed by the afternoon open window (13:00 - 16:00).
   - Check the **Adaptive Routine**: tasks dynamically rescheduled around peak pollution hours.
3. **Air Quality Analytics (`/app/analytics`):**
   - View the 24-hour inversion dynamics chart showing the correlation between boundary layer height and particulate buildup.

---

## ⏱️ Act 3: AI Copilot & Personal Family Protection (1:45 - 2:30)

1. **AI Atmospheric Copilot (`/app/assistant`):**
   - Ask: *"Is it safe for my 6-year-old son with asthma to play outdoors this afternoon?"*
   - Observe grounded response: Copilot cites active Andheri West AQI and boundary layer conditions, references Aarav's AirTwin profile, and recommends indoor activities.
   - Click **"Why this advice?"** to view the underlying evidence chips and verification log.
2. **Family Air Guardians (`/app/family`):**
   - View family vulnerability scores and active protection protocols.
3. **CleanRoute Commute (`/app/routes`):**
   - Compare Andheri to BKC via ICE Car vs. Mumbai Metro Line 2A/7: see 125g CO2 mitigated and 18mg PM2.5 dosage avoided.

---

## ⏱️ Act 4: Community Watch & Admin Governance (2:30 - 3:00)

1. **Community Air Pulse (`/app/community`):**
   - Submit a localized smoke report for Andheri Link Road with "High" severity.
   - Click "Verify Report" to demonstrate peer consensus.
2. **Admin Command Center (`/admin`):**
   - Sign in as Admin (`admin@breatheiq.org` / `Admin123!`).
   - Review user registry, moderation approval queue, cryptographic audit logs, and AI Copilot trace ledger.
