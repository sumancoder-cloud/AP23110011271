import axios from 'axios';

const logApiUrl = process.env.LOG_API_URL || 'http://20.244.56.144/evaluation-service/logs';
const defaultToken = process.env.EVALUATION_BEARER_TOKEN || '';

export async function logEvent({ stack, level, packageName, message, token }) {
  const payload = {
    stack,
    level,
    package: packageName,
    message
  };

  const accessToken = token || defaultToken;

  try {
    await axios.post(logApiUrl, payload, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      timeout: 10000
    });
  } catch (error) {
    return null;
  }
}
