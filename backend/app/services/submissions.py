import json
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from ..config import APP_TIMEZONE
from .database import get_connection
from .leads import LeadValidationError, validate_lead_payload
from .quiz_repository import get_quiz_config
from .scoring import QuizValidationError, calculate_result


RESULT_BAND_LABELS = {
    "baixo": "Baixa compatibilidade",
    "sinais": "Sinais de atenção",
    "alto": "Alta compatibilidade",
}


class SubmissionValidationError(ValueError):
    """Raised when the submission payload is invalid."""


def normalize_submission_answers(raw_answers) -> list[dict]:
    if isinstance(raw_answers, dict):
        normalized_answers = []
        for question_id, value in raw_answers.items():
            normalized_answers.append({
                "questionId": question_id,
                "value": value,
            })
        return normalized_answers

    if isinstance(raw_answers, list):
        return raw_answers

    raise SubmissionValidationError("Envie as respostas completas do teste.")


def save_submission(payload: dict) -> dict:
    try:
        lead = validate_lead_payload(payload)
    except LeadValidationError as exc:
        raise SubmissionValidationError(str(exc)) from exc

    answers = normalize_submission_answers(payload.get("answers"))
    source = payload.get("source") if isinstance(payload.get("source"), str) else "quiz-complete"
    config = get_quiz_config()

    try:
        result = calculate_result(config, answers)
    except QuizValidationError as exc:
        raise SubmissionValidationError(str(exc)) from exc

    created_at_utc = datetime.now(timezone.utc).isoformat()

    with closing(get_connection()) as connection:
        cursor = connection.execute(
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
            """,
            (
                created_at_utc,
                lead["name"],
                lead["email"],
                lead["phone"],
                lead["phoneDigits"],
                lead["ageRange"],
                result["scoreTotal"],
                result["scoreMax"],
                result["percentageTotal"],
                result["resultBand"]["key"],
                result["resultBand"]["headline"],
                json.dumps(result["areas"], ensure_ascii=False),
                json.dumps(answers, ensure_ascii=False),
                source.strip() or "quiz-complete",
            ),
        )
        submission_id = cursor.lastrowid
        connection.commit()

    return get_submission_detail(submission_id)


def list_submissions(query: str = "", legacy: str = "all") -> list[dict]:
    sql = """
        SELECT
            id,
            created_at_utc,
            name,
            email,
            phone,
            age_range,
            percentage_total,
            result_band_key,
            is_legacy
        FROM submissions
    """
    conditions = []
    parameters: list[str] = []

    normalized_query = query.strip().lower()
    if normalized_query:
        digits_query = "".join(character for character in normalized_query if character.isdigit())
        conditions.append(
            """
            (
                LOWER(name) LIKE ?
                OR LOWER(email) LIKE ?
                OR LOWER(phone) LIKE ?
                OR phone_digits LIKE ?
            )
            """
        )
        digit_pattern = f"%{digits_query}%" if digits_query else "%__no_match__%"
        parameters.extend(
            [
                f"%{normalized_query}%",
                f"%{normalized_query}%",
                f"%{normalized_query}%",
                digit_pattern,
            ]
        )

    if legacy == "exclude":
        conditions.append("is_legacy = 0")
    elif legacy == "only":
        conditions.append("is_legacy = 1")

    if conditions:
        sql += " WHERE " + " AND ".join(conditions)

    sql += " ORDER BY created_at_utc DESC, id DESC"

    with closing(get_connection()) as connection:
        rows = connection.execute(sql, parameters).fetchall()

    return [serialize_submission_list_item(row) for row in rows]


def get_submission_detail(submission_id: int) -> dict | None:
    with closing(get_connection()) as connection:
        row = connection.execute(
            """
            SELECT
                id,
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
            FROM submissions
            WHERE id = ?
            """,
            (submission_id,),
        ).fetchone()

    if row is None:
        return None

    return serialize_submission_detail(row)


def get_dashboard_data() -> dict:
    with closing(get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                created_at_utc,
                result_band_key,
                is_legacy
            FROM submissions
            ORDER BY created_at_utc ASC, id ASC
            """
        ).fetchall()

    return build_dashboard_payload(rows)


def serialize_submission_list_item(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "createdAtUtc": row["created_at_utc"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "ageRange": row["age_range"],
        "percentageTotal": row["percentage_total"],
        "resultBandKey": row["result_band_key"],
        "isLegacy": bool(row["is_legacy"]),
    }


def serialize_submission_detail(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "createdAtUtc": row["created_at_utc"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "phoneDigits": row["phone_digits"],
        "ageRange": row["age_range"],
        "scoreTotal": row["score_total"],
        "scoreMax": row["score_max"],
        "percentageTotal": row["percentage_total"],
        "resultBandKey": row["result_band_key"],
        "resultBandHeadline": row["result_band_headline"],
        "areas": parse_json_field(row["areas_json"]),
        "answers": parse_json_field(row["answers_json"]),
        "source": row["source"],
        "isLegacy": bool(row["is_legacy"]),
        "legacyNote": row["legacy_note"],
    }


def parse_json_field(raw_value: str | None):
    if not raw_value:
        return []

    return json.loads(raw_value)


def build_dashboard_payload(rows: list[sqlite3.Row]) -> dict:
    timezone_info = get_timezone_info()
    now_local = datetime.now(timezone.utc).astimezone(timezone_info)
    today_local = now_local.date()
    week_start_local = today_local - timedelta(days=today_local.weekday())
    month_start_local = today_local.replace(day=1)
    normalized_rows = [
        {
            "createdAtLocal": to_local_datetime(row["created_at_utc"], timezone_info),
            "resultBandKey": row["result_band_key"],
            "isLegacy": bool(row["is_legacy"]),
        }
        for row in rows
    ]

    total_count = len(normalized_rows)
    total_today = sum(1 for row in normalized_rows if row["createdAtLocal"].date() == today_local)
    total_week = sum(
        1
        for row in normalized_rows
        if row["createdAtLocal"].date() >= week_start_local
    )
    total_month = sum(
        1
        for row in normalized_rows
        if row["createdAtLocal"].date() >= month_start_local
    )
    legacy_count = sum(1 for row in normalized_rows if row["isLegacy"])

    return {
        "totals": {
            "all": total_count,
            "today": total_today,
            "week": total_week,
            "month": total_month,
            "legacy": legacy_count,
        },
        "volume": {
            "day": build_daily_series(normalized_rows, today_local, 14),
            "week": build_weekly_series(normalized_rows, week_start_local, 8),
            "month": build_monthly_series(normalized_rows, month_start_local, 12),
        },
        "bandDistribution": build_band_distribution(normalized_rows),
    }


def to_local_datetime(raw_value: str, timezone_info: ZoneInfo) -> datetime:
    parsed_datetime = datetime.fromisoformat(raw_value)
    if parsed_datetime.tzinfo is None:
        parsed_datetime = parsed_datetime.replace(tzinfo=timezone.utc)
    return parsed_datetime.astimezone(timezone_info)


def get_timezone_info():
    try:
        return ZoneInfo(APP_TIMEZONE)
    except ZoneInfoNotFoundError:
        return timezone(timedelta(hours=-3))


def build_daily_series(rows: list[dict], end_date, days: int) -> list[dict]:
    series = []
    start_date = end_date - timedelta(days=days - 1)

    for index in range(days):
        current_date = start_date + timedelta(days=index)
        count = sum(1 for row in rows if row["createdAtLocal"].date() == current_date)
        series.append(
            {
                "key": current_date.isoformat(),
                "label": current_date.strftime("%d/%m"),
                "count": count,
            }
        )

    return series


def build_weekly_series(rows: list[dict], current_week_start, weeks: int) -> list[dict]:
    series = []
    start_week = current_week_start - timedelta(weeks=weeks - 1)

    for index in range(weeks):
        week_start = start_week + timedelta(weeks=index)
        week_end = week_start + timedelta(days=6)
        count = sum(
            1
            for row in rows
            if week_start <= row["createdAtLocal"].date() <= week_end
        )
        series.append(
            {
                "key": week_start.isoformat(),
                "label": week_start.strftime("%d/%m"),
                "count": count,
            }
        )

    return series


def build_monthly_series(rows: list[dict], current_month_start, months: int) -> list[dict]:
    series = []
    month_starts = []
    reference = current_month_start

    for _ in range(months):
        month_starts.append(reference)
        if reference.month == 1:
            reference = reference.replace(year=reference.year - 1, month=12)
        else:
            reference = reference.replace(month=reference.month - 1)

    month_starts.reverse()

    for month_start in month_starts:
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)

        count = sum(
            1
            for row in rows
            if month_start <= row["createdAtLocal"].date() < next_month
        )
        series.append(
            {
                "key": month_start.isoformat(),
                "label": month_start.strftime("%m/%y"),
                "count": count,
            }
        )

    return series


def build_band_distribution(rows: list[dict]) -> list[dict]:
    ordered_keys = ["alto", "sinais", "baixo"]
    distribution = []

    for key in ordered_keys:
        count = sum(1 for row in rows if row["resultBandKey"] == key)
        distribution.append(
            {
                "key": key,
                "label": RESULT_BAND_LABELS.get(key, key.title()),
                "count": count,
            }
        )

    legacy_count = sum(1 for row in rows if row["isLegacy"])
    if legacy_count:
        distribution.append(
            {
                "key": "legacy",
                "label": "Legado",
                "count": legacy_count,
            }
        )

    return distribution
