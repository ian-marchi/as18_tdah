from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
CONTENT_PATH = BASE_DIR / "conteudo" / "quiz-config.json"
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
DATA_DIR = BASE_DIR / "dados"
LEADS_PATH = DATA_DIR / "leads.jsonl"
LEADS_SPREADSHEET_PATH = DATA_DIR / "leads.csv"
