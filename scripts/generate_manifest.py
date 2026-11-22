#!/usr/bin/env python3
"""
scripts/generate_manifest.py
Generates docs/routes.manifest.json containing all 93 routes specified in docs/SCREEN_SPECS.md.
"""

import json
import os

routes = [
    # Public (18)
    {
        "id": 1, "path": "/", "name": "Landing Page", "tier": "T1", "access": "public", "category": "Public",
        "designFile": "breatheiq_landing_page_mumbai_hero_redesign",
        "apiEndpoints": ["/api/v1/locations/search", "/api/v1/air-quality/current", "/api/v1/impact/what-if/preview", "/api/v1/content/faq"],
        "interactiveChecks": ["location_search", "language_switch", "theme_toggle", "what_if_slider", "faq_accordion"],
        "minInteractiveElements": 8
    },
    {
        "id": 2, "path": "/about", "name": "About BreatheIQ", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/about"],
        "interactiveChecks": ["cta_click", "section_nav"],
        "minInteractiveElements": 3
    },
    {
        "id": 3, "path": "/features", "name": "Features & Comparison", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/features"],
        "interactiveChecks": ["feature_tabs", "comparison_toggle", "module_cta"],
        "minInteractiveElements": 4
    },
    {
        "id": 4, "path": "/how-it-works", "name": "How It Works (Engine Stepper)", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/engines/examples"],
        "interactiveChecks": ["step_forward", "step_backward", "calculator_trigger"],
        "minInteractiveElements": 4
    },
    {
        "id": 5, "path": "/explore", "name": "Explore Indian Cities", "tier": "T1", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/air-quality/cities", "/api/v1/air-quality/compare"],
        "interactiveChecks": ["city_search", "category_filter", "city_sort", "city_compare_select", "map_marker_click"],
        "minInteractiveElements": 6
    },
    {
        "id": 6, "path": "/explore/:city", "name": "City Air Quality Detail", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/air-quality/city/:slug"],
        "interactiveChecks": ["trend_tab_select", "share_link_click", "add_to_dashboard_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 7, "path": "/methodology", "name": "CPCB NAQI Methodology & Calculator", "tier": "T1", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/engines/naqi"],
        "interactiveChecks": ["concentration_input", "calculate_click", "breakpoint_table_filter"],
        "minInteractiveElements": 5
    },
    {
        "id": 8, "path": "/data-sources", "name": "Data Sources & Provider Health", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/health/providers"],
        "interactiveChecks": ["provider_card_expand", "frequency_filter"],
        "minInteractiveElements": 3
    },
    {
        "id": 9, "path": "/resources", "name": "Resources & Downloadable Guides", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/resources", "/api/v1/downloads/:id"],
        "interactiveChecks": ["resource_search", "topic_filter", "pdf_download_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 10, "path": "/resources/:slug", "name": "Resource Detail & Copilot-Lite", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/resources/:slug", "/api/v1/copilot/explain"],
        "interactiveChecks": ["toc_click", "explain_simpler_click", "share_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 11, "path": "/for-schools", "name": "For Schools & Clean Air Advisory", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/air-quality/cities", "/api/v1/advisories/school"],
        "interactiveChecks": ["city_selector", "generate_advisory_click", "print_advisory_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 12, "path": "/for-communities", "name": "For Communities & Neighborhoods", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/campaigns/sample"],
        "interactiveChecks": ["campaign_filter", "start_community_click"],
        "minInteractiveElements": 3
    },
    {
        "id": 13, "path": "/faq", "name": "FAQ Knowledge Base", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "breatheiq_faq_knowledge_base",
        "apiEndpoints": ["/api/v1/content/faq", "/api/v1/feedback"],
        "interactiveChecks": ["search_input", "category_tab", "accordion_toggle", "helpful_vote"],
        "minInteractiveElements": 5
    },
    {
        "id": 14, "path": "/contact", "name": "Contact & Partnerships", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "breatheiq_contact_partnerships",
        "apiEndpoints": ["/api/v1/feedback"],
        "interactiveChecks": ["name_input", "email_input", "topic_select", "message_input", "submit_form"],
        "minInteractiveElements": 5
    },
    {
        "id": 15, "path": "/help", "name": "Help Center & User Guides", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "breatheiq_help_center_user_guides",
        "apiEndpoints": ["/api/v1/content/help"],
        "interactiveChecks": ["help_search", "article_click", "contact_support_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 16, "path": "/status", "name": "System & Provider Status", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/health/history"],
        "interactiveChecks": ["uptime_period_select", "incident_expand"],
        "minInteractiveElements": 3
    },
    {
        "id": 17, "path": "/privacy", "name": "Privacy Policy", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "breatheiq_privacy_policy_terms",
        "apiEndpoints": [],
        "interactiveChecks": ["toc_click", "export_link_click"],
        "minInteractiveElements": 3
    },
    {
        "id": 18, "path": "/terms", "name": "Terms of Service", "tier": "T2", "access": "public", "category": "Public",
        "designFile": "breatheiq_privacy_policy_terms",
        "apiEndpoints": [],
        "interactiveChecks": ["toc_click"],
        "minInteractiveElements": 2
    },

    # Auth and onboarding (11)
    {
        "id": 19, "path": "/login", "name": "Sign In", "tier": "T1", "access": "public", "category": "Auth and onboarding",
        "designFile": "breatheiq_login_a1",
        "apiEndpoints": ["/api/v1/auth/login"],
        "interactiveChecks": ["email_input", "password_input", "toggle_password", "submit_login", "demo_quickfill"],
        "minInteractiveElements": 5
    },
    {
        "id": 20, "path": "/signup", "name": "Create Account", "tier": "T1", "access": "public", "category": "Auth and onboarding",
        "designFile": "breatheiq_signup_a2",
        "apiEndpoints": ["/api/v1/auth/signup"],
        "interactiveChecks": ["email_input", "password_input", "confirm_password", "intent_select", "terms_check", "submit_signup"],
        "minInteractiveElements": 6
    },
    {
        "id": 21, "path": "/forgot-password", "name": "Forgot Password", "tier": "T1", "access": "public", "category": "Auth and onboarding",
        "designFile": "breatheiq_forgot_password_a3",
        "apiEndpoints": ["/api/v1/auth/forgot-password"],
        "interactiveChecks": ["email_input", "submit_request"],
        "minInteractiveElements": 3
    },
    {
        "id": 22, "path": "/reset-password", "name": "Reset Password", "tier": "T1", "access": "public", "category": "Auth and onboarding",
        "designFile": "breatheiq_reset_password_a4",
        "apiEndpoints": ["/api/v1/auth/reset-password"],
        "interactiveChecks": ["new_password_input", "confirm_password_input", "submit_reset"],
        "minInteractiveElements": 3
    },
    {
        "id": 23, "path": "/verify-email", "name": "Verify Email", "tier": "T2", "access": "public", "category": "Auth and onboarding",
        "designFile": "breatheiq_verify_email_a5",
        "apiEndpoints": ["/api/v1/auth/verify-email"],
        "interactiveChecks": ["token_input", "submit_verify", "resend_code"],
        "minInteractiveElements": 3
    },
    {
        "id": 24, "path": "/onboarding/profile", "name": "Onboarding: Profile", "tier": "T1", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/onboarding/profile"],
        "interactiveChecks": ["name_input", "language_select", "next_step"],
        "minInteractiveElements": 3
    },
    {
        "id": 25, "path": "/onboarding/location", "name": "Onboarding: Location", "tier": "T1", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/locations/search", "/api/v1/onboarding/location"],
        "interactiveChecks": ["location_search", "geolocate_button", "confirm_location", "next_step"],
        "minInteractiveElements": 4
    },
    {
        "id": 26, "path": "/onboarding/household", "name": "Onboarding: Household", "tier": "T1", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/onboarding/household"],
        "interactiveChecks": ["add_member", "age_select", "sensitivity_select", "remove_member", "next_step"],
        "minInteractiveElements": 5
    },
    {
        "id": 27, "path": "/onboarding/lifestyle", "name": "Onboarding: Lifestyle", "tier": "T1", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/onboarding/lifestyle"],
        "interactiveChecks": ["commute_toggle", "home_type_select", "fuel_select", "next_step"],
        "minInteractiveElements": 4
    },
    {
        "id": 28, "path": "/onboarding/alerts", "name": "Onboarding: Alerts", "tier": "T2", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/onboarding/alerts"],
        "interactiveChecks": ["threshold_slider", "quiet_hours_input", "channel_toggle", "next_step"],
        "minInteractiveElements": 4
    },
    {
        "id": 29, "path": "/onboarding/complete", "name": "Onboarding: Complete & AirTwin", "tier": "T1", "access": "user", "category": "Auth and onboarding",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/onboarding/finalize", "/api/v1/routine/generate"],
        "interactiveChecks": ["finish_button", "view_airtwin_button"],
        "minInteractiveElements": 2
    },

    # Core app (32)
    {
        "id": 30, "path": "/app/dashboard", "name": "Atmospheric Dashboard", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "breatheiq_main_dashboard_andheri_west_mumbai",
        "apiEndpoints": ["/api/v1/dashboard/summary", "/api/v1/routine/today/toggle"],
        "interactiveChecks": ["location_switch", "refresh_button", "routine_item_toggle", "explain_popover", "pollutant_card_click"],
        "minInteractiveElements": 6
    },
    {
        "id": 31, "path": "/app/air-quality", "name": "Atmospheric Command Center", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "breatheiq_atmospheric_command_center",
        "apiEndpoints": ["/api/v1/air-quality/stations", "/api/v1/air-quality/layers"],
        "interactiveChecks": ["layer_toggle", "station_search", "station_card_click", "sort_filter", "drawer_close"],
        "minInteractiveElements": 6
    },
    {
        "id": 32, "path": "/app/air-quality/stations/:id", "name": "Station Telemetry Detail", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/air-quality/stations/:id", "/api/v1/feedback/station"],
        "interactiveChecks": ["timeframe_tab", "confidence_meter_click", "report_issue_button"],
        "minInteractiveElements": 4
    },
    {
        "id": 33, "path": "/app/analytics", "name": "Inversion & AQI Analytics", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "breatheiq_air_quality_inversion_analytics",
        "apiEndpoints": ["/api/v1/analytics/inversion", "/api/v1/analytics/timeseries"],
        "interactiveChecks": ["pollutant_filter", "timeframe_select", "compare_locations", "export_button"],
        "minInteractiveElements": 5
    },
    {
        "id": 34, "path": "/app/analytics/reports", "name": "Analytics Reports Archive", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/analytics/reports", "/api/v1/analytics/reports/generate"],
        "interactiveChecks": ["generate_report_modal", "download_pdf", "delete_report_confirm"],
        "minInteractiveElements": 4
    },
    {
        "id": 35, "path": "/app/assistant", "name": "AI Atmospheric Copilot", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "breatheiq_ai_atmospheric_assistant",
        "apiEndpoints": ["/api/v1/copilot/chat", "/api/v1/copilot/history"],
        "interactiveChecks": ["send_prompt", "prompt_chip_click", "why_advice_expand", "thumbs_feedback", "new_chat_button"],
        "minInteractiveElements": 6
    },
    {
        "id": 36, "path": "/app/assistant/history", "name": "Copilot Chat History", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/copilot/conversations"],
        "interactiveChecks": ["search_chats", "open_conversation", "rename_chat", "delete_chat"],
        "minInteractiveElements": 4
    },
    {
        "id": 37, "path": "/app/smogshield", "name": "SmogShield 48h Risk & Rules", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/smogshield/rules", "/api/v1/smogshield/forecast"],
        "interactiveChecks": ["add_rule_modal", "toggle_rule", "test_alert_button", "delete_rule", "grap_toggle"],
        "minInteractiveElements": 5
    },
    {
        "id": 38, "path": "/app/routine", "name": "Adaptive Daily Routine", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/routine/today", "/api/v1/routine/adapt"],
        "interactiveChecks": ["member_tab", "task_checkbox", "add_task", "adapt_plan_button", "reorder_tasks"],
        "minInteractiveElements": 5
    },
    {
        "id": 39, "path": "/app/routine/calendar", "name": "Routine Monthly Calendar", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/routine/calendar"],
        "interactiveChecks": ["month_nav", "day_click", "add_reminder"],
        "minInteractiveElements": 4
    },
    {
        "id": 40, "path": "/app/home", "name": "Home & Indoor Air Oracle", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/home/rooms", "/api/v1/engines/window-oracle"],
        "interactiveChecks": ["room_tab", "add_room_button", "add_reading_button", "window_oracle_expand", "api_key_copy"],
        "minInteractiveElements": 6
    },
    {
        "id": 41, "path": "/app/home/rooms/:id", "name": "Room Profile & Sensor Telemetry", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/home/rooms/:id", "/api/v1/home/rooms/:id/readings"],
        "interactiveChecks": ["reading_modal_submit", "edit_room_modal", "metric_tab_select"],
        "minInteractiveElements": 4
    },
    {
        "id": 42, "path": "/app/home/purifier-guide", "name": "Purifier CADR Sizing & DIY Guide", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/engines/purifier"],
        "interactiveChecks": ["room_size_slider", "ceiling_height_input", "cadr_input", "save_to_room_select"],
        "minInteractiveElements": 5
    },
    {
        "id": 43, "path": "/app/home/checklist", "name": "Indoor Air Quality Checklist", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/home/checklist"],
        "interactiveChecks": ["frequency_tab", "task_checkbox", "source_audit_toggle"],
        "minInteractiveElements": 4
    },
    {
        "id": 44, "path": "/app/family", "name": "Family Air Guardians", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/family/members", "/api/v1/family/tasks"],
        "interactiveChecks": ["add_member_modal", "member_card_click", "assign_task", "school_mode_link"],
        "minInteractiveElements": 5
    },
    {
        "id": 45, "path": "/app/family/members/:id", "name": "Family Member Guidance Profile", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/family/members/:id"],
        "interactiveChecks": ["edit_profile", "sensitivity_select", "delete_member_confirm"],
        "minInteractiveElements": 4
    },
    {
        "id": 46, "path": "/app/school-mode", "name": "School Mode Hourly Guidance", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/advisories/school-mode"],
        "interactiveChecks": ["hour_slider", "activity_filter", "export_pdf_button", "share_link"],
        "minInteractiveElements": 4
    },
    {
        "id": 47, "path": "/app/routes", "name": "CleanRoute Commute Navigator", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "breatheiq_cleanroute_commute_navigator",
        "apiEndpoints": ["/api/v1/routing/calculate", "/api/v1/routing/save"],
        "interactiveChecks": ["origin_input", "destination_input", "mode_select", "compare_routes_click", "save_route_button"],
        "minInteractiveElements": 6
    },
    {
        "id": 48, "path": "/app/routes/history", "name": "Commute Log & Exposure History", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/routing/history"],
        "interactiveChecks": ["filter_mode", "date_range", "delete_log_entry"],
        "minInteractiveElements": 4
    },
    {
        "id": 49, "path": "/app/green-living", "name": "Green Living Hub", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/green-living/suggestions", "/api/v1/green-living/habits"],
        "interactiveChecks": ["category_tab", "accept_suggestion_button", "impact_drawer_toggle"],
        "minInteractiveElements": 4
    },
    {
        "id": 50, "path": "/app/green-living/habits", "name": "Daily Green Habits Tracker", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/green-living/habits"],
        "interactiveChecks": ["checkin_habit", "add_custom_habit", "archive_habit"],
        "minInteractiveElements": 4
    },
    {
        "id": 51, "path": "/app/impact", "name": "Sustainability Score & Avoided Emissions", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/impact/summary", "/api/v1/impact/goals"],
        "interactiveChecks": ["timeframe_tab", "how_calculated_drawer", "add_goal_modal", "export_button"],
        "minInteractiveElements": 5
    },
    {
        "id": 52, "path": "/app/impact/what-if", "name": "What-If Impact Scenario Builder", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/impact/what-if/scenarios"],
        "interactiveChecks": ["metro_slider", "carpool_slider", "habit_toggle", "assumptions_drawer", "save_scenario_modal"],
        "minInteractiveElements": 6
    },
    {
        "id": 53, "path": "/app/impact/reports", "name": "Impact Reports & Verification", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/impact/reports"],
        "interactiveChecks": ["generate_report_button", "download_pdf", "methodology_toggle"],
        "minInteractiveElements": 4
    },
    {
        "id": 54, "path": "/app/airtwin", "name": "AirTwin Personalized Exposure Profile", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/airtwin/profile", "/api/v1/airtwin/history"],
        "interactiveChecks": ["edit_profile_section", "recalculate_exposure", "history_item_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 55, "path": "/app/protect/masks", "name": "Respirator & Mask Sizing Guide", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/masks"],
        "interactiveChecks": ["mask_type_selector", "fit_check_stepper", "save_checklist"],
        "minInteractiveElements": 4
    },
    {
        "id": 56, "path": "/app/protect/emergency-kit", "name": "Offline Smog Emergency Kit", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/protect/emergency-kit"],
        "interactiveChecks": ["item_checkbox", "assign_member", "print_kit_button"],
        "minInteractiveElements": 4
    },
    {
        "id": 57, "path": "/app/pollution-sources", "name": "Winter Smog Drivers & Inversion Explainer", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/pollution-sources"],
        "interactiveChecks": ["source_card_click", "diagram_tab_toggle"],
        "minInteractiveElements": 3
    },
    {
        "id": 58, "path": "/app/notifications", "name": "Notification Center", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/notifications", "/api/v1/notifications/preferences"],
        "interactiveChecks": ["category_tab", "mark_read", "mark_all_read", "delete_notification", "preferences_modal"],
        "minInteractiveElements": 6
    },
    {
        "id": 59, "path": "/app/settings", "name": "User Settings & Accessibility", "tier": "T1", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/users/me", "/api/v1/users/settings"],
        "interactiveChecks": ["language_select", "theme_toggle", "font_size_select", "reduced_motion_toggle", "save_button"],
        "minInteractiveElements": 5
    },
    {
        "id": 60, "path": "/app/settings/security", "name": "Security & Session Management", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/auth/change-password", "/api/v1/auth/sessions"],
        "interactiveChecks": ["change_password_submit", "revoke_session_button", "logout_all_button"],
        "minInteractiveElements": 4
    },
    {
        "id": 61, "path": "/app/settings/privacy-data", "name": "Privacy & Data Export/Deletion", "tier": "T2", "access": "user", "category": "Core app",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/users/export", "/api/v1/users/delete"],
        "interactiveChecks": ["export_data_button", "consent_toggle", "delete_account_modal_confirm"],
        "minInteractiveElements": 4
    },

    # Community (9)
    {
        "id": 62, "path": "/app/community", "name": "Community Air Pulse", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/pulse"],
        "interactiveChecks": ["group_select", "feed_filter", "campaign_card_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 63, "path": "/app/community/air-watch", "name": "Citizen Air Watch Map & Feed", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/reports"],
        "interactiveChecks": ["filter_type", "filter_status", "upvote_report", "new_report_button"],
        "minInteractiveElements": 5
    },
    {
        "id": 64, "path": "/app/community/air-watch/new", "name": "Submit Air Watch Report", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/reports/new"],
        "interactiveChecks": ["type_select", "location_picker", "description_input", "photo_upload", "submit_report"],
        "minInteractiveElements": 5
    },
    {
        "id": 65, "path": "/app/community/campaigns", "name": "Community Clean Air Campaigns", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/campaigns"],
        "interactiveChecks": ["search_campaigns", "filter_category", "join_campaign_button"],
        "minInteractiveElements": 4
    },
    {
        "id": 66, "path": "/app/community/campaigns/:id", "name": "Campaign Action Hub", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/campaigns/:id"],
        "interactiveChecks": ["join_leave_button", "post_update_modal", "task_check"],
        "minInteractiveElements": 4
    },
    {
        "id": 67, "path": "/app/community/leaderboard", "name": "Clean Air Impact Leaderboard", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/leaderboard"],
        "interactiveChecks": ["tab_individuals_families", "timeframe_select", "how_points_calculated_toggle"],
        "minInteractiveElements": 4
    },
    {
        "id": 68, "path": "/app/community/events", "name": "Clean Air Events Calendar", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/events"],
        "interactiveChecks": ["view_toggle_list_calendar", "filter_virtual_inperson", "event_card_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 69, "path": "/app/community/events/:id", "name": "Event Detail & RSVP", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/events/:id", "/api/v1/community/events/:id/rsvp"],
        "interactiveChecks": ["rsvp_button", "download_ics", "cancel_rsvp"],
        "minInteractiveElements": 4
    },
    {
        "id": 70, "path": "/app/community/groups/:id", "name": "Community Group Portal", "tier": "T2", "access": "user", "category": "Community",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/community/groups/:id"],
        "interactiveChecks": ["join_group_button", "tab_reports_campaigns", "group_admin_manage"],
        "minInteractiveElements": 4
    },

    # Learning (7)
    {
        "id": 71, "path": "/app/learn", "name": "Atmospheric Learning Hub", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/articles"],
        "interactiveChecks": ["search_articles", "topic_chip_click", "article_card_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 72, "path": "/app/learn/:slug", "name": "Learning Article View", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/articles/:slug", "/api/v1/content/articles/:slug/complete"],
        "interactiveChecks": ["mark_complete_button", "explain_simpler_button", "bookmark_toggle"],
        "minInteractiveElements": 4
    },
    {
        "id": 73, "path": "/app/learn/glossary", "name": "Atmospheric Science Glossary", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/glossary"],
        "interactiveChecks": ["letter_filter", "glossary_search", "term_expand"],
        "minInteractiveElements": 4
    },
    {
        "id": 74, "path": "/app/challenges", "name": "Clean Air Challenges", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/challenges"],
        "interactiveChecks": ["tab_active_available", "join_challenge_button", "challenge_card_click"],
        "minInteractiveElements": 4
    },
    {
        "id": 75, "path": "/app/challenges/:id", "name": "Challenge Task Runner", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/challenges/:id"],
        "interactiveChecks": ["task_check_in", "view_rules_modal", "share_progress"],
        "minInteractiveElements": 4
    },
    {
        "id": 76, "path": "/app/quiz/:id", "name": "Clean Air Quiz Runner", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/content/quizzes/:id"],
        "interactiveChecks": ["option_select", "hint_toggle", "next_question", "submit_quiz", "retake_quiz"],
        "minInteractiveElements": 5
    },
    {
        "id": 77, "path": "/app/achievements", "name": "Badges & Achievements", "tier": "T2", "access": "user", "category": "Learning",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/achievements"],
        "interactiveChecks": ["badge_card_click", "share_badge_button", "filter_earned_locked"],
        "minInteractiveElements": 4
    },

    # Admin (13)
    {
        "id": 78, "path": "/admin", "name": "Admin Command Center", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/kpis", "/api/v1/admin/traces/recent"],
        "interactiveChecks": ["timeframe_select", "moderation_queue_link", "health_status_link"],
        "minInteractiveElements": 4
    },
    {
        "id": 79, "path": "/admin/users", "name": "User Management", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/users"],
        "interactiveChecks": ["user_search", "role_filter", "status_filter", "pagination_next", "export_users_csv"],
        "minInteractiveElements": 5
    },
    {
        "id": 80, "path": "/admin/users/:id", "name": "User Detail & Role Control", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/users/:id"],
        "interactiveChecks": ["change_role_modal_confirm", "suspend_user_confirm", "revoke_sessions_confirm"],
        "minInteractiveElements": 4
    },
    {
        "id": 81, "path": "/admin/roles", "name": "Role Permission Matrix", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/roles"],
        "interactiveChecks": ["role_tab_select", "view_permissions"],
        "minInteractiveElements": 3
    },
    {
        "id": 82, "path": "/admin/air-data", "name": "Air Telemetry Provider Control", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/air-data/providers", "/api/v1/admin/air-data/refresh"],
        "interactiveChecks": ["provider_refresh_button", "station_search", "edit_station_modal"],
        "minInteractiveElements": 4
    },
    {
        "id": 83, "path": "/admin/integrations", "name": "Integrations & External APIs", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/integrations"],
        "interactiveChecks": ["test_connection_button", "status_filter"],
        "minInteractiveElements": 3
    },
    {
        "id": 84, "path": "/admin/moderation", "name": "Citizen Report Moderation Queue", "tier": "T2", "access": "moderator", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/moderation/queue"],
        "interactiveChecks": ["report_row_click", "verify_button_modal", "reject_button_modal", "bulk_verify"],
        "minInteractiveElements": 5
    },
    {
        "id": 85, "path": "/admin/ai-management", "name": "AI Models & Prompt Versioning", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/ai/prompts"],
        "interactiveChecks": ["prompt_version_select", "diff_view_toggle", "rollback_modal_confirm", "fallback_toggle"],
        "minInteractiveElements": 5
    },
    {
        "id": 86, "path": "/admin/ai-management/logs", "name": "AI Safety & Trace Explorer", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/ai/traces"],
        "interactiveChecks": ["search_traces", "model_filter", "trace_row_drawer", "export_traces_csv"],
        "minInteractiveElements": 5
    },
    {
        "id": 87, "path": "/admin/content", "name": "CMS Content Manager", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/content"],
        "interactiveChecks": ["type_tab_select", "create_article_button", "edit_markdown", "publish_toggle"],
        "minInteractiveElements": 5
    },
    {
        "id": 88, "path": "/admin/analytics", "name": "Platform Telemetry & Adoption", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/analytics/platform"],
        "interactiveChecks": ["metric_select", "date_range_picker", "export_analytics_csv"],
        "minInteractiveElements": 4
    },
    {
        "id": 89, "path": "/admin/audit-logs", "name": "Immutable Security Audit Trail", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/audit-logs"],
        "interactiveChecks": ["actor_search", "action_filter", "date_filter", "export_logs_csv"],
        "minInteractiveElements": 5
    },
    {
        "id": 90, "path": "/admin/system-health", "name": "System Health & Schedulers", "tier": "T2", "access": "admin", "category": "Admin",
        "designFile": "NO-DESIGN",
        "apiEndpoints": ["/api/v1/admin/system/health"],
        "interactiveChecks": ["service_card_click", "trigger_scheduler_job"],
        "minInteractiveElements": 3
    },

    # System (3)
    {
        "id": 91, "path": "/403", "name": "Forbidden (403)", "tier": "T2", "access": "public", "category": "System",
        "designFile": "NO-DESIGN",
        "apiEndpoints": [],
        "interactiveChecks": ["login_link", "home_link"],
        "minInteractiveElements": 2
    },
    {
        "id": 92, "path": "/404", "name": "Not Found (404)", "tier": "T1", "access": "public", "category": "System",
        "designFile": "NO-DESIGN",
        "apiEndpoints": [],
        "interactiveChecks": ["home_link", "search_link"],
        "minInteractiveElements": 2
    },
    {
        "id": 93, "path": "/500", "name": "Server Error (500)", "tier": "T2", "access": "public", "category": "System",
        "designFile": "NO-DESIGN",
        "apiEndpoints": [],
        "interactiveChecks": ["retry_button", "report_issue_link"],
        "minInteractiveElements": 2
    }
]

def main():
    assert len(routes) == 93, f"Expected 93 routes, got {len(routes)}"
    os.makedirs("docs", exist_ok=True)
    out_path = os.path.join("docs", "routes.manifest.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(routes, f, indent=2)
    print(f"[OK] Successfully generated {len(routes)} route entries in {out_path}")

if __name__ == "__main__":
    main()
