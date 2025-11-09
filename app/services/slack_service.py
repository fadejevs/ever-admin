import logging
from typing import Any, Dict, List, Optional

import requests


class SlackNotificationError(Exception):
    """Raised when a Slack notification cannot be delivered."""


class SlackService:
    """
    Lightweight Slack integration using incoming webhook URLs.
    Provides a single entry point to send messages or rich blocks
    to a configured workspace channel.
    """

    def __init__(self, config: Dict[str, Any]):
        self.logger = logging.getLogger(__name__)
        # Flask config behaves like a dict
        self.webhook_url: Optional[str] = config.get("SLACK_WEBHOOK_URL")
        self.default_channel: Optional[str] = config.get("SLACK_DEFAULT_CHANNEL")

    @property
    def is_configured(self) -> bool:
        return bool(self.webhook_url)

    def send_message(
        self,
        *,
        text: Optional[str] = None,
        blocks: Optional[List[Dict[str, Any]]] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        thread_ts: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Dispatch a message to Slack via webhook.
        Slack expects at least `text` or `blocks`.
        """
        if not self.webhook_url:
            raise SlackNotificationError("Slack webhook URL is not configured")

        payload: Dict[str, Any] = {}

        if text:
            payload["text"] = text
        if blocks:
            payload["blocks"] = blocks
        if attachments:
            payload["attachments"] = attachments
        if thread_ts:
            payload["thread_ts"] = thread_ts
        if metadata:
            payload["metadata"] = metadata
        if self.default_channel:
            payload["channel"] = self.default_channel

        if "text" not in payload and "blocks" not in payload:
            payload["text"] = "Notification from Ever Admin Dashboard"

        try:
            response = requests.post(self.webhook_url, json=payload, timeout=10)
        except requests.RequestException as exc:
            self.logger.error("Slack webhook request failed: %s", exc)
            raise SlackNotificationError("Failed to reach Slack webhook") from exc

        if response.status_code >= 400:
            self.logger.error(
                "Slack webhook responded with error code %s: %s",
                response.status_code,
                response.text,
            )
            raise SlackNotificationError(
                f"Slack webhook responded with status {response.status_code}"
            )

        self.logger.info("Slack notification delivered successfully.")


