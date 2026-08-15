import datetime

from app.services.matching import compute_match


def _profile(**overrides):
    defaults = {
        "id": 1,
        "user_id": 1,
        "name": "Test",
        "age": 25,
        "gender": "female",
        "occupation": "Student",
        "university": None,
        "profile_type": "roommate",
        "house_type": None,
        "nationality": None,
        "budget": 400,
        "looking_for_city": ["Kyrenia"],
        "move_in_date": datetime.datetime(2026, 9, 1),
        "duration_months": 12,
        "bio": "",
        "habits": ["clean", "cook"],
        "gender_preference": "any",
        "avatar_url": None,
    }
    defaults.update(overrides)
    return type("FakeProfile", (), defaults)()


def test_perfect_match_scores_high():
    a = _profile()
    b = _profile(
        user_id=2,
        profile_type="housemate",
        looking_for_city=["kyrenia"],
        habits=["cook", "clean"],
    )
    result = compute_match(a, b)
    assert result["score"] >= 80
    keys = [r["key"] for r in result["reasons"]]
    assert "match_reason_city" in keys
    assert "match_reason_gender" in keys
    assert "match_reason_habits" in keys


def test_conflicting_city_and_budget_scores_low():
    a = _profile()
    b = _profile(
        user_id=2,
        looking_for_city=["Nicosia"],
        budget=1200,
        move_in_date=datetime.datetime(2027, 6, 1),
        duration_months=3,
    )
    result = compute_match(a, b)
    assert result["score"] < 50


def test_shared_habits_reason():
    a = _profile(habits=["gym", "quiet", "cook"])
    b = _profile(user_id=2, habits=["cook", "quiet"])
    result = compute_match(a, b)
    keys = [r["key"] for r in result["reasons"]]
    assert "match_reason_habits" in keys
    habit_reason = next(r for r in result["reasons"] if r["key"] == "match_reason_habits")
    assert "cook" in habit_reason["params"]["habits"]


def test_gender_preference_conflict_penalizes():
    a = _profile(gender="female", gender_preference="female")
    b = _profile(user_id=2, gender="male", gender_preference="any")
    result = compute_match(a, b)
    assert "match_reason_gender" not in [r["key"] for r in result["reasons"]]
