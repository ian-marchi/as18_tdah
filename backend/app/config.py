import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
CONTENT_PATH = BASE_DIR / "conteudo" / "quiz-config.json"
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
DATA_DIR = BASE_DIR / "dados"
LEADS_PATH = DATA_DIR / "leads.jsonl"
LEADS_SPREADSHEET_PATH = DATA_DIR / "leads.csv"
RAILWAY_VOLUME_MOUNT_PATH = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "").strip()
DEFAULT_DATABASE_DIR = Path(RAILWAY_VOLUME_MOUNT_PATH) if RAILWAY_VOLUME_MOUNT_PATH else DATA_DIR
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DEFAULT_DATABASE_DIR / "submissions.sqlite3")))
APP_TIMEZONE = os.getenv("APP_TIMEZONE", "America/Sao_Paulo")
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-only-secret-key")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@admin.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin#22018@")
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "0") == "1"
