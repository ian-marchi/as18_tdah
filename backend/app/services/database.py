import csv
import json
import sqlite3
from collections.abc import Iterable
from contextlib import closing

from ..config import DATABASE_PATH, LEADS_PATH, LEADS_SPREADSHEET_PATH


LEGACY_IMPORT_META_KEY = "legacy_import_completed_v1"


def get_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with closing(get_connection()) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at_utc TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                phone_digits TEXT NOT NULL,
                age_range TEXT NOT NULL,
                score_total INTEGER,
                score_max INTEGER,
                percentage_total INTEGER,
                result_band_key TEXT,
                result_band_headline TEXT,
                areas_json TEXT,
                answers_json TEXT,
                source TEXT NOT NULL,
                is_legacy INTEGER NOT NULL DEFAULT 0,
                legacy_note TEXT
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_meta (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at_utc DESC)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions (email)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_submissions_phone_digits ON submissions (phone_digits)"
        )
        connection.commit()

        if is_legacy_import_completed(connection):
            return

        import_legacy_records(connection)
        mark_legacy_import_completed(connection)
        connection.commit()


def is_legacy_import_completed(connection: sqlite3.Connection) -> bool:
    row = connection.execute(
        "SELECT value FROM app_meta WHERE key = ?",
        (LEGACY_IMPORT_META_KEY,),
    ).fetchone()
    return bool(row and row["value"] == "1")


def mark_legacy_import_completed(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        INSERT INTO app_meta (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """,
        (LEGACY_IMPORT_META_KEY, "1"),
    )


def import_legacy_records(connection: sqlite3.Connection) -> None:
    seen_signatures: set[tuple[str, str, str]] = set()

    for record in iter_legacy_records():
        signature = (
            record["created_at_utc"],
            record["email"],
            record["phone_digits"],
        )
        if signature in seen_signatures:
            continue

        seen_signatures.add(signature)
        existing_row = connection.execute(
            """
            SELECT id
            FROM submissions
            WHERE created_at_utc = ?
              AND email = ?
              AND phone_digits = ?
              AND is_legacy = 1
            LIMIT 1
            """,
            signature,
        ).fetchone()
        if existing_row is not None:
            continue

        connection.execute(
            """
            INSERT INTO submissions (
                created_at_utc,
                name,
                email,
                phone,
                phone_digits,
                age_range,
                score_total,
                score_max,
                percentage_total,
                result_band_key,
                result_band_headline,
                areas_json,
                answers_json,
                source,
                is_legacy,
                legacy_note
            )
            VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, 1, ?)
            """,
            (
                record["created_at_utc"],
                record["name"],
                record["email"],
                record["phone"],
                record["phone_digits"],
                record["age_range"],
                record["source"],
                "resultado_indisponivel",
            ),
        )


def iter_legacy_records() -> Iterable[dict]:
    yield from read_legacy_csv_records()
    yield from read_legacy_jsonl_records()


def read_legacy_csv_records() -> list[dict]:
    if not LEADS_SPREADSHEET_PATH.exists():
        return []

    with LEADS_SPREADSHEET_PATH.open("r", encoding="utf-8", newline="") as file_handle:
        reader = csv.DictReader(file_handle)
        return [normalize_legacy_record(row) for row in reader if row]


def read_legacy_jsonl_records() -> list[dict]:
    if not LEADS_PATH.exists():
        return []

    records: list[dict] = []
    with LEADS_PATH.open("r", encoding="utf-8") as file_handle:
        for raw_line in file_handle:
            line = raw_line.strip()
            if not line:
                continue

            payload = json.loads(line)
            records.append(normalize_legacy_record(payload))

    return records


def normalize_legacy_record(payload: dict) -> dict:
    name = str(payload.get("name", "")).strip() or "Sem nome"
    email = str(payload.get("email", "")).strip().lower() or "sem-email@legado.local"
    phone = str(payload.get("phone", "")).strip() or "Não informado"
    phone_digits = (
        str(payload.get("phoneDigits", "")).strip()
        or "".join(character for character in phone if character.isdigit())
        or "0000000000"
    )
    age_range = str(payload.get("ageRange", "")).strip() or "Não informado"
    created_at_utc = str(payload.get("submittedAtUtc", "")).strip() or "1970-01-01T00:00:00+00:00"
    source = str(payload.get("source", "")).strip() or "legacy-import"

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "phone_digits": phone_digits,
        "age_range": age_range,
        "created_at_utc": created_at_utc,
        "source": source,
    }
