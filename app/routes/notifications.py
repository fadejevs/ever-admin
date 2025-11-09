from flask import Blueprint, current_app, jsonify, request

from app.services.slack_service import SlackNotificationError

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/slack", methods=["GET", "POST"])
def slack_notifications():
    slack_service = getattr(current_app, "slack_service", None)

    if slack_service is None:
        return jsonify({"configured": False, "error": "Slack service not available"}), 503

    if request.method == "GET":
        return jsonify({"configured": slack_service.is_configured})

    payload = request.get_json(silent=True) or {}
    text = payload.get("text") or payload.get("message")
    blocks = payload.get("blocks")
    attachments = payload.get("attachments")
    thread_ts = payload.get("thread_ts")
    metadata = payload.get("metadata")

    if not slack_service.is_configured:
        return jsonify({"error": "Slack webhook not configured"}), 503

    try:
        slack_service.send_message(
            text=text,
            blocks=blocks,
            attachments=attachments,
            thread_ts=thread_ts,
            metadata=metadata,
        )
    except SlackNotificationError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify({"status": "ok"})


