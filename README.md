AI TTS, STT, Translation Wrapper



Launch and test:

1. Set up a virtual environment
terminal: python -m venv .venv

2. Install dependencies
terminal: pip install -r requirements.txt

3. Add environment variables
Create a "config.py" file inside the "app" folder with:

AZURE_SPEECH_KEY=Azure_speech_key
AZURE_REGION=Azure_region

# Slack Notifications (optional)
Slack notifications use an incoming webhook URL. Configure the following environment variables on the backend:

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
# Optional: override the channel if your webhook allows multiple channels
SLACK_DEFAULT_CHANNEL=#alerts

With the variables in place, the admin dashboard Settings → General page exposes a Slack Notifications card for sending test messages.

5. Run
python main.py

The server will start on `http://localhost:5001`