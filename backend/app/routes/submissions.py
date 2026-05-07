from flask import Blueprint, jsonify, request

from ..services.submissions import SubmissionValidationError, save_submission


submissions_bp = Blueprint("submissions", __name__)


@submissions_bp.post("/")
def create_submission():
    payload = request.get_json(silent=True) or {}

    try:
        submission = save_submission(payload)
    except SubmissionValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"status": "ok", "submission": submission}), 201
