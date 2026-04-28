import csv
import json
import re
from datetime import datetime, timezone

from ..config import LEADS_PATH, LEADS_SPREADSHEET_PATH


EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
SPREADSHEET_HEADERS = [
    "name",
    "email",
    "phone",
    "ageRange",
    "phoneDigits",
    "source",
    "submittedAtUtc",
]


class LeadValidationError(ValueError):
    """Raised when the lead payload is invalid."""


def normalize_name(value: str | None) -> str:
    if not isinstance(value, str):
        raise LeadValidationError("Informe um nome válido.")

    normalized = " ".join(value.strip().split())
    if len(normalized) < 2:
        raise LeadValidationError("Informe um nome válido.")

    return normalized


def normalize_email(value: str | None) -> str:
    if not isinstance(value, str):
        raise LeadValidationError("Informe um e-mail válido.")

    normalized = value.strip().lower()
    if not EMAIL_REGEX.match(normalized):
        raise LeadValidationError("Informe um e-mail válido.")

    return normalized


def normalize_phone(value: str | None) -> tuple[str, str]:
    if not isinstance(value, str):
        raise LeadValidationError("Informe um telefone válido.")

    raw_phone = " ".join(value.strip().split())
    digits = "".join(character for character in raw_phone if character.isdigit())

    if len(digits) < 10 or len(digits) > 15:
        raise LeadValidationError("Informe um telefone válido com DDD.")

    return raw_phone, digits


def normalize_age_range(value: str | None) -> str:
    if not isinstance(value, str):
        raise LeadValidationError("Selecione uma faixa etária válida.")

    normalized = " ".join(value.strip().split())
    if len(normalized) < 2:
        raise LeadValidationError("Selecione uma faixa etária válida.")

    return normalized


def validate_lead_payload(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise LeadValidationError("Os dados enviados são inválidos.")

    name = normalize_name(payload.get("name"))
    email = normalize_email(payload.get("email"))
    phone, phone_digits = normalize_phone(payload.get("phone"))
    age_range = normalize_age_range(payload.get("ageRange"))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "ageRange": age_range,
        "phoneDigits": phone_digits,
    }


def append_lead_record(record: dict) -> None:
    LEADS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LEADS_PATH.open("a", encoding="utf-8") as file_handle:
        file_handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def ensure_spreadsheet_header() -> None:
    LEADS_SPREADSHEET_PATH.parent.mkdir(parents=True, exist_ok=True)

    if LEADS_SPREADSHEET_PATH.exists():
        with LEADS_SPREADSHEET_PATH.open("r", encoding="utf-8", newline="") as file_handle:
            reader = csv.DictReader(file_handle)
            if reader.fieldnames == SPREADSHEET_HEADERS:
                return

            existing_rows = list(reader) if reader.fieldnames else []

        with LEADS_SPREADSHEET_PATH.open("w", encoding="utf-8", newline="") as file_handle:
            writer = csv.DictWriter(file_handle, fieldnames=SPREADSHEET_HEADERS)
            writer.writeheader()
            for row in existing_rows:
                writer.writerow({header: row.get(header, "") for header in SPREADSHEET_HEADERS})
        return

    with LEADS_SPREADSHEET_PATH.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=SPREADSHEET_HEADERS)
        writer.writeheader()


def append_lead_spreadsheet_row(record: dict) -> None:
    ensure_spreadsheet_header()

    with LEADS_SPREADSHEET_PATH.open("a", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=SPREADSHEET_HEADERS)
        writer.writerow({header: record.get(header, "") for header in SPREADSHEET_HEADERS})


def save_lead(payload: dict) -> dict:
    lead = validate_lead_payload(payload)
    record = {
        **lead,
        "source": "quiz-precheck",
        "submittedAtUtc": datetime.now(timezone.utc).isoformat(),
    }
    append_lead_record(record)
    append_lead_spreadsheet_row(record)
    return record
