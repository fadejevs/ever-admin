import logging
from .translation_service import TranslationService
from .speech_service import SpeechService
from .slack_service import SlackService, SlackNotificationError  # noqa: F401 - expose error

logger = logging.getLogger(__name__)

def initialize_services(app):
    """Initializes and attaches services to the Flask app instance."""
    logger.info("--- Initializing services ---")
    try:
        # Initialize your services here
        app.translation_service = TranslationService(app.config)
        app.speech_service = SpeechService(app.config)
        app.slack_service = SlackService(app.config)
        # Initialize other services and attach them to 'app'
        # e.g., app.firebase_service = FirebaseService(app.config)

        logger.info("Translation Service initialized.")
        logger.info("Speech Service initialized.")
        if app.slack_service.is_configured:
            logger.info("Slack Service initialized (webhook configured).")
        else:
            logger.warning("Slack Service initialized without webhook URL. Notifications disabled.")
        # Log other service initializations
    except Exception as e:
        logger.error(f"Failed to initialize one or more services: {e}", exc_info=True)
        # Re-raise the exception to prevent the app from starting in a broken state
        raise # Re-raise the exception 