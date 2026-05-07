from functools import wraps
from secrets import compare_digest

from flask import Blueprint, current_app, jsonify, request, session

from ..services.submissions import (
    get_dashboard_data,
    get_submission_detail,
    list_submissions,
)


admin_bp = Blueprint("admin", __name__)


def require_admin_session(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not session.get("admin_authenticated"):
            return jsonify({"error": "Não autenticado."}), 401

        return view_func(*args, **kwargs)

    return wrapper


def normalize_admin_email(value) -> str:
    return str(value or "").strip().strip("\"'").lower()


def normalize_admin_password(value) -> str:
    normalized = str(value or "").strip()
    if len(normalized) >= 2 and normalized[0] == normalized[-1] and normalized[0] in {"'", '"'}:
        return normalized[1:-1]
    return normalized


@admin_bp.post("/session")
def create_admin_session():
    payload = request.get_json(silent=True) or {}
    email = normalize_admin_email(payload.get("email", ""))
    password = normalize_admin_password(payload.get("password", ""))
    expected_email = normalize_admin_email(current_app.config["ADMIN_EMAIL"])
    expected_password = normalize_admin_password(current_app.config["ADMIN_PASSWORD"])

    if not (
        compare_digest(email, expected_email)
        and compare_digest(password, expected_password)
    ):
        return jsonify({"error": "Credenciais inválidas."}), 401

    session.clear()
    session["admin_authenticated"] = True
    session["admin_email"] = expected_email

    return jsonify(
        {
            "authenticated": True,
            "admin": {
                "email": expected_email,
            },
        }
    )


@admin_bp.get("/session")
def get_admin_session():
    if not session.get("admin_authenticated"):
        return jsonify({"authenticated": False}), 401

    return jsonify(
        {
            "authenticated": True,
            "admin": {
                "email": session.get("admin_email", current_app.config["ADMIN_EMAIL"]),
            },
        }
    )


@admin_bp.delete("/session")
@require_admin_session
def delete_admin_session():
    session.clear()
    return jsonify({"status": "ok"})


@admin_bp.get("/dashboard")
@require_admin_session
def get_dashboard():
    return jsonify(get_dashboard_data())


@admin_bp.get("/submissions")
@require_admin_session
def get_submissions():
    query = request.args.get("query", "")
    legacy = request.args.get("legacy", "all")
    return jsonify({"items": list_submissions(query=query, legacy=legacy)})


@admin_bp.get("/submissions/<int:submission_id>")
@require_admin_session
def get_submission(submission_id: int):
    submission = get_submission_detail(submission_id)
    if submission is None:
        return jsonify({"error": "Registro não encontrado."}), 404

    return jsonify(submission)
