from flask import Blueprint, jsonify, request

from ..services.quiz_repository import get_quiz_config
from ..services.scoring import QuizValidationError, calculate_result


quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.get("/")
def get_quiz():
    return jsonify(get_quiz_config())


@quiz_bp.post("/result")
def post_result():
    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers")

    try:
        result = calculate_result(get_quiz_config(), answers)
    except QuizValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result)

