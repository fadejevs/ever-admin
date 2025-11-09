// @third-party
import axios from 'axios';

const BASE_URL = '';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
});

export async function fetchSlackStatus() {
  try {
    const { data } = await client.get('/api/notifications/slack');
    return data;
  } catch (error) {
    console.error('fetchSlackStatus error:', error?.response?.data || error?.message || error);
    throw error;
  }
}

export async function sendSlackNotification(payload = {}) {
  try {
    const { data } = await client.post('/api/notifications/slack', payload);
    return data;
  } catch (error) {
    console.error('sendSlackNotification error:', error?.response?.data || error?.message || error);
    throw error;
  }
}


