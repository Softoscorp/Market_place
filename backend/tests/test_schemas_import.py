from app import schemas


def test_admin_account_status_request_can_be_constructed():
    request = schemas.AdminSetAccountStatusRequest(
        status=schemas.AccountStatus.active,
        status_reason="ok",
    )

    assert request.status == schemas.AccountStatus.active
    assert request.status_reason == "ok"
