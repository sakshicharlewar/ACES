import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
url = os.getenv("DATABASE_URL")
if url and url.startswith("postgres://"):
    url = url.replace("postgres://", "postgresql://", 1)

engine = create_engine(url)
with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS test_event_registrations CASCADE"))
print("Dropped table successfully")
