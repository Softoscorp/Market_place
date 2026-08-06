"""
FCM push notification service.

Requires FIREBASE_SERVICE_ACCOUNT_JSON env var to contain the Firebase
service account JSON as a string (copy the content of serviceAccountKey.json).
"""

import json
import os
import logging

logger = logging.getLogger(__name__)

_fcm_app = None


def _parse_service_account(sa_json: str) -> dict:
    """
    Parse the service account JSON tolerantly.
    When pasted into Railway, the private_key value often gets its \\n escape
    sequences converted to real newlines, making the JSON invalid.
    This function fixes that before parsing.
    """
    import re
    try:
        return json.loads(sa_json)
    except json.JSONDecodeError:
        # Fix: re-escape any raw newlines inside the private_key string value.
        # The regex matches the entire private_key string value (including the
        # surrounding quotes) and escapes any real newlines within it.
        fixed = re.sub(
            r'("private_key"\s*:\s*")(.*?)(")',
            lambda m: m.group(1) + m.group(2).replace('\n', '\\n') + m.group(3),
            sa_json,
            flags=re.DOTALL,
        )
        return json.loads(fixed)


def _get_firebase_app():
    global _fcm_app
    if _fcm_app is not None:
        return _fcm_app

    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not sa_json:
        logger.warning("[FCM] FIREBASE_SERVICE_ACCOUNT_JSON not set — FCM disabled")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_dict = _parse_service_account(sa_json)
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_dict)
            _fcm_app = firebase_admin.initialize_app(cred)
        else:
            _fcm_app = firebase_admin.get_app()
        return _fcm_app
    except Exception as e:
        logger.error(f"[FCM] Firebase init failed: {e}")
        return None


def send_fcm_notification(token: str, title: str, body: str, data: dict | None = None) -> bool:
    """
    Send a single FCM push notification to a device token.
    Returns True on success, False on failure.
    """
    app = _get_firebase_app()
    if app is None:
        return False

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="messages",
                    sound="default",
                ),
            ),
        )
        response = messaging.send(message)
        logger.info(f"[FCM] Sent: {response}")
        return True
    except Exception as e:
        logger.error(f"[FCM] Send failed for token {token[:20]}…: {e}")
        return False
