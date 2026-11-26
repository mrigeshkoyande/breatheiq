"""Deterministic seed fixture definitions for development and demo environments."""

from typing_extensions import TypedDict


class DemoAccountSpec(TypedDict):
    """Seed user account attributes."""

    email: str
    password: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool


DEMO_ACCOUNTS: list[DemoAccountSpec] = [
    {
        "email": "user@breatheiq.org",
        "password": "Password123!",
        "full_name": "Priya Sharma (Demo User)",
        "role": "user",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "moderator@breatheiq.org",
        "password": "Password123!",
        "full_name": "Aarav Mehta (Community Moderator)",
        "role": "moderator",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "admin@breatheiq.org",
        "password": "Password123!",
        "full_name": "System Administrator",
        "role": "admin",
        "is_active": True,
        "is_verified": True,
    },
]

DEMO_MEMBERS: tuple[tuple[str, str, str, int], ...] = (
    ("Priya Sharma (Demo User)", "adult", "none", 25),
    ("Aarav Sharma", "child", "asthma", 80),
    ("Ananya Sharma", "infant", "none", 70),
)

DEMO_ROOMS: tuple[tuple[str, float, float, float, bool, float, float], ...] = (
    ("Living Room", 5.0, 4.0, 2.7, True, 380.0, 34.5),
    ("Master Bedroom", 4.2, 3.6, 2.7, True, 250.0, 22.0),
)

DEMO_TASKS: tuple[tuple[str, str, str, bool, str], ...] = (
    (
        "Seal windows during twilight inversion",
        "morning",
        "ventilation",
        True,
        "Prevent boundary-layer smog penetration during early morning spike.",
    ),
    (
        "Indoor living room mobility session",
        "morning",
        "exercise",
        False,
        "Cardio routine indoors under HEPA filtration; avoid outdoor jogging.",
    ),
    (
        "Window Oracle: Midday Aeration Window",
        "afternoon",
        "ventilation",
        False,
        "Open cross-ventilation windows during peak dispersion score window.",
    ),
    (
        "Activate bedroom HEPA filter before sleep",
        "evening",
        "purifier",
        False,
        "Ensure clean indoor sleeping air (target PM2.5 < 25 ug/m3).",
    ),
)

DEMO_COMMUNITY_REPORTS: tuple[dict[str, object], ...] = (
    {
        "report_type": "construction_dust",
        "severity": "severe",
        "location_name": "SV Road Metro Construction Corridor, Andheri West",
        "latitude": 19.1190,
        "longitude": 72.8470,
        "description": "Excavation site active without mandatory green dust barrier mesh.",
        "upvote_count": 8,
        "status": "UNVERIFIED",
    },
    {
        "report_type": "garbage_burning",
        "severity": "hazardous",
        "location_name": "Deonar Peripheral Corridor, Chembur",
        "latitude": 19.0620,
        "longitude": 72.9050,
        "description": "Open solid waste burning behind commercial godowns during twilight inversion.",
        "upvote_count": 14,
        "status": "VERIFIED",
    },
    {
        "report_type": "traffic_congestion",
        "severity": "moderate",
        "location_name": "Western Express Highway Kalanagar Junction",
        "latitude": 19.0640,
        "longitude": 72.8510,
        "description": "Gridlock with commercial diesel trucks idling under shallow boundary layer.",
        "upvote_count": 5,
        "status": "UNVERIFIED",
    },
)
