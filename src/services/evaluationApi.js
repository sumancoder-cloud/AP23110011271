import axios from 'axios';

const baseUrl = process.env.EVALUATION_API_BASE_URL || 'http://20.207.122.201/evaluation-service';

export async function fetchProtectedResource(path, token) {
  const response = await axios.get(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    timeout: 10000
  });

  return response.data;
}
