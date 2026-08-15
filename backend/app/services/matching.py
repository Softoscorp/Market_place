"""Roommate matching engine.

Computes a compatibility score (0-100) between two roommate profiles based on
the concrete fields a person fills in about themselves: city, budget, timeline,
gender preference, profile type and shared habits. Each criterion returns a
reason so the frontend can explain *why* two people matched instead of showing
a meaningless number.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional, Tuple


def _norm(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def _norm_list(values: Optional[List[str]]) -> List[str]:
    return [v.strip().lower() for v in (values or []) if v and v.strip()]


def _has_overlap(a: Optional[List[str]], b: Optional[List[str]]) -> bool:
    return bool(set(_norm_list(a)) & set(_norm_list(b)))


def _city_overlap(a: Optional[List[str]], b: Optional[List[str]]) -> Optional[str]:
    shared = set(_norm_list(a)) & set(_norm_list(b))
    if not shared:
        return None
    return sorted(shared)[0]


def _budget_compatible(a_budget: Optional[int], b_budget: Optional[int]) -> Optional[float]:
    """Budget overlap as a ratio. Two people are compatible when their monthly
    budgets are within a reasonable band of each other."""
    if not a_budget or not b_budget or a_budget <= 0 or b_budget <= 0:
        return None
    lower, higher = sorted((a_budget, b_budget))
    return lower / higher


def _timeline_overlap(
    a_date: Optional[datetime.datetime],
    a_duration: Optional[int],
    b_date: Optional[datetime.datetime],
    b_duration: Optional[int],
) -> Optional[float]:
    """Check whether the two move-in windows overlap. Returns a ratio of overlap
    (1.0 when fully compatible)."""
    if not a_date or not b_date or not a_duration or not b_duration:
        return None
    if a_duration <= 0 or b_duration <= 0:
        return None

    # A move-in window: [a_date, a_date + duration]
    a_start = a_date
    a_end = a_date + datetime.timedelta(days=30 * a_duration)
    b_start = b_date
    b_end = b_date + datetime.timedelta(days=30 * b_duration)

    # Overlap length in days
    latest_start = max(a_start, b_start)
    earliest_end = min(a_end, b_end)
    if earliest_end < latest_start:
        return None

    overlap_days = (earliest_end - latest_start).days
    min_days = min((a_end - a_start).days, (b_end - b_start).days)
    if min_days <= 0:
        return None
    return min(1.0, overlap_days / min_days)


def _gender_preference_ok(
    profile_gender: Optional[str],
    preference: Optional[str],
    other_gender: Optional[str],
) -> bool:
    pref = _norm(preference)
    if pref in ("", "any", "no preference"):
        return True
    return pref == _norm(other_gender)


def _habits_shared(a: Optional[List[str]], b: Optional[List[str]]) -> List[str]:
    return sorted(set(_norm_list(a)) & set(_norm_list(b)))


def compute_match(
    profile_a: Any,
    profile_b: Any,
) -> Dict[str, Any]:
    """Compute a compatibility score between two roommate profiles.

    Returns {"score": int 0-100, "reasons": [{"key", "params"}]}. Reasons use
    translation keys + params so the frontend can localize them.
    """
    weights = {
        "city": 30,
        "budget": 20,
        "timeline": 20,
        "gender": 15,
        "type": 5,
        "habits": 10,
    }
    score = 0.0
    reasons: List[Dict[str, Any]] = []

    # 1. City — the single most important signal (30)
    city = _city_overlap(profile_a.looking_for_city, profile_b.looking_for_city)
    if city:
        score += weights["city"]
        reasons.append({"key": "match_reason_city", "params": {"city": city.title()}})

    # 2. Budget overlap (20)
    budget_ratio = _budget_compatible(profile_a.budget, profile_b.budget)
    if budget_ratio is not None and budget_ratio >= 0.6:
        score += weights["budget"] * budget_ratio
        reasons.append({"key": "match_reason_budget"})

    # 3. Timeline overlap — move-in windows must overlap (20)
    timeline_ratio = _timeline_overlap(
        profile_a.move_in_date,
        profile_a.duration_months,
        profile_b.move_in_date,
        profile_b.duration_months,
    )
    if timeline_ratio is not None and timeline_ratio > 0:
        score += weights["timeline"] * timeline_ratio
        reasons.append({"key": "match_reason_timeline"})

    # 4. Gender preference — both must be satisfied (15)
    a_ok = _gender_preference_ok(profile_a.gender, profile_a.gender_preference, profile_b.gender)
    b_ok = _gender_preference_ok(profile_b.gender, profile_b.gender_preference, profile_a.gender)
    if a_ok and b_ok:
        score += weights["gender"]
        reasons.append({"key": "match_reason_gender"})
    elif a_ok or b_ok:
        score += weights["gender"] * 0.5

    # 5. Profile type — a housemate (offering a room) + a roommate (seeking one) is ideal (5)
    a_type = _norm(profile_a.profile_type)
    b_type = _norm(profile_b.profile_type)
    if {a_type, b_type} == {"roommate", "housemate"}:
        score += weights["type"]
        reasons.append({"key": "match_reason_type"})
    elif a_type == "roommate" and b_type == "roommate":
        # Two people looking for a place can still split an apartment
        score += weights["type"] * 0.6

    # 6. Shared habits (10)
    shared = _habits_shared(profile_a.habits, profile_b.habits)
    if shared:
        score += weights["habits"] * min(1.0, len(shared) / 3)
        reasons.append({"key": "match_reason_habits", "params": {"habits": ", ".join(shared)}})

    return {
        "score": int(round(min(100.0, max(0.0, score)))),
        "reasons": reasons,
    }
