import json
import os
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "private_key.pem")
VAPID_CLAIM_EMAIL = "mailto:admin@rental.com"

def send_push_notification(subscription_info: dict, payload: dict):
    if not os.path.exists(VAPID_PRIVATE_KEY):
        print(f"Warning: VAPID private key not found at {VAPID_PRIVATE_KEY}. Skipping push.")
        return False
        
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIM_EMAIL}
        )
        return True
    except WebPushException as ex:
        print(f"Web Push Error: {repr(ex)}")
        if ex.response and ex.response.status_code in [404, 410]:
            return "EXPIRED"
        return False
    except Exception as e:
        print(f"Unexpected Web Push error: {e}")
        return False
