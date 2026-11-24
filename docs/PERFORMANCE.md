# BreatheIQ Performance & Resource Efficiency

## 1. Bundle & Asset Metrics

BreatheIQ maintains an asset profile optimized for responsive delivery across both mobile networks and constrained urban broadband.

### Production Build Metrics
- **JavaScript Bundle:** `449.13 kB` raw (`111.27 kB` gzipped).
- **CSS Bundle:** `40.49 kB` raw (`7.36 kB` gzipped).
- **HTML Shell:** `1.38 kB` raw (`0.70 kB` gzipped).
- **Total Production Distribution:** Under `500 kB` uncompressed.

### Repository Diet Metrics
- **Total Tracked Files:** 112 files.
- **Tracked Files Size:** `0.953 MB` (budget: `< 1.5 MB`).
- **Git Store / Loose Objects:** `0.452 MB` (budget: `< 2.0 MB`).
- **Zero Raw Design Bloat:** Raw high-resolution assets and video mockups excluded via `.gitignore`.

## 2. Frontend Runtime Optimizations

- **State Management & Caching:** TanStack Query caches atmospheric telemetry for 5 minutes (`staleTime: 1000 * 60 * 5`), preventing duplicate HTTP roundtrips during tab navigation.
- **Debounced Inputs:** Location search fields debounce API requests by 300ms.
- **DOM Virtualization:** Historical air sensor charts render cleanly via Recharts with lightweight SVG node hierarchies.

## 3. Backend Latency & Throughput

- **Async Concurrency:** FastAPI asynchronously resolves concurrent atmospheric requests on an event loop without thread-blocking.
- **In-Memory TTL Provider Cache:** `AirDataProvider` caches hourly Open-Meteo model runs in memory with a 15-minute TTL, eliminating redundant external API network delays.
- **Deterministic Python Engines:** Complex boundary layer calculations and statutory NAQI breakpoints execute in sub-millisecond Python routines without external network or LLM roundtrips.
