import axios from 'axios';

const logApiUrl = process.env.LOG_API_URL || 'http://20.207.122.201/evaluation-service/logs';

export async function logEvent({ stack, level, packageName, message, token }) {
  const payload = {
    stack,
    level,
    package: packageName,
    message
  };

  try {
    await axios.post(logApiUrl, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      timeout: 10000
    });
  } catch (error) {
    return null;
  }
}
