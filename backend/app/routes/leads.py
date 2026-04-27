from flask import Blueprint, jsonify, request

from ..services.leads import LeadValidationError, save_lead


leads_bp = Blueprint("leads", __name__)


@leads_bp.post("/")
def create_lead():
    payload = request.get_json(silent=True) or {}

    try:
        lead = save_lead(payload)
    except LeadValidationError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"status": "ok", "lead": lead}), 201

