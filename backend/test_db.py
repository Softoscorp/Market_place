from sqlalchemy import create_engine, text
engine = create_engine("postgresql://postgres.ynmayegniskfjjrzirxk:75K1R85Mnu9f8S3m@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres")
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT * FROM fcm_tokens LIMIT 1"))
        print("fcm_tokens exists")
except Exception as e:
    print(f"Error querying fcm_tokens: {e}")
