# Hackathon Problem Alignment — Challenge 6: Urban Air Quality Assistant

## 1. Challenge Definition

> **Challenge 6 — Urban Air Quality Assistant:** A GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to location and lifestyle, while clearly explaining the direct impact of their choices.

## 2. Solution Philosophy: DETECT → UNDERSTAND → PROTECT → OPTIMIZE → IMPROVE

BreatheIQ addresses each pillar with tailored software features:

### 1. DETECT (Ground Telemetry & Atmospheric Modeling)
- Integrates continuous CAAQMS observations and Open-Meteo boundary layer models.
- Explores 5 major urban corridors (Mumbai, Delhi, Bengaluru, Kolkata, Pune) with honest provenance badges (`LIVE`, `MODELED`, `FORECAST`, `DEMO`).

### 2. UNDERSTAND (Atmospheric Dynamics & Health Risks)
- Explains thermal inversion layers and boundary layer trapping in lay terms.
- Decodes the 6 CPCB NAQI categories with explicit pollutant breakdowns (PM2.5, PM10, NO2, SO2, CO, Ozone).

### 3. PROTECT (Personalized Vulnerability & Window Oracle)
- **AirTwin Family Profiles:** Assesses individualized risk scores for sensitive members (infants, asthmatics, pregnant women, elderly).
- **Window Oracle:** Evaluates hourly boundary layer height and ventilation viability to recommend safe ventilation windows.
- **Air Purifier Sizer:** Calculates CADR airflow requirements based on room geometry and target Air Changes per Hour (ACH).

### 4. OPTIMIZE (Adaptive Routines & CleanRoute Commute)
- **Dynamic Daily Routine:** Automatically reorganizes outdoor exercise, school commutes, and errands according to forecast smog peaks.
- **CleanRoute Navigator:** Compares commute alternatives (car, metro, bus, walking), estimating both inhaled PM2.5 dosage and transit CO2 mitigation.

### 5. IMPROVE (Community Air Watch & Sustainability Ledger)
- **Community Air Watch:** Enables residents to report localized smog events (waste burning, road dust, construction) with peer verification.
- **Sustainability Ledger:** Quantifies personal and household pollution reduction (grams of PM2.5 avoided, kg of CO2 mitigated).
