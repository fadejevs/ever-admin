import { useEffect, useMemo, useState } from 'react';

// @mui
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// @project
import SettingCard from '@/components/cards/SettingCard';
import { fetchSlackStatus, sendSlackNotification } from '@/services/notificationsService';

const DEFAULT_TEST_MESSAGE = 'Test notification from Ever Admin dashboard';

export default function SlackNotificationsCard() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState(DEFAULT_TEST_MESSAGE);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const statusLabel = useMemo(
    () => (configured ? 'Slack webhook is connected.' : 'Slack webhook is not configured yet.'),
    [configured]
  );

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        setLoadingStatus(true);
        const data = await fetchSlackStatus();
        if (!active) return;
        setConfigured(Boolean(data?.configured));
      } catch (error) {
        if (!active) return;
        console.error('Slack status check failed:', error);
        setFeedback({ severity: 'error', message: error?.response?.data?.error || error?.message || 'Unable to reach backend.' });
        setConfigured(false);
      } finally {
        if (active) setLoadingStatus(false);
      }
    };

    loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const handleSend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      await sendSlackNotification({ text: message });
      setFeedback({ severity: 'success', message: 'Slack notification dispatched successfully.' });
    } catch (error) {
      console.error('Slack notification failed:', error);
      setFeedback({
        severity: 'error',
        message: error?.response?.data?.error || error?.message || 'Failed to send Slack notification.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingCard
      title="Slack Notifications"
      caption="Configure an incoming webhook in Slack to receive alerts directly in your workspace."
    >
      <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
        {loadingStatus && <LinearProgress />}
        <Typography variant="body2" sx={{ color: configured ? 'success.main' : 'warning.main', fontWeight: 600 }}>
          {statusLabel}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add <code>SLACK_WEBHOOK_URL</code> (and optional <code>SLACK_DEFAULT_CHANNEL</code>) to the backend environment.
          Once configured, use this panel to trigger Slack alerts from admin workflows.
        </Typography>
        {feedback && (
          <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}
        <TextField
          label="Slack message preview"
          fullWidth
          multiline
          minRows={2}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          helperText="Customize the payload before sending a test notification."
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button variant="contained" onClick={handleSend} disabled={sending || !configured} sx={{ minWidth: 160 }}>
            {sending ? 'Sending...' : 'Send Test Notification'}
          </Button>
          {!configured && (
            <Typography variant="caption" color="text.secondary">
              Configure the webhook first to enable test sends.
            </Typography>
          )}
        </Stack>
      </Stack>
    </SettingCard>
  );
}


