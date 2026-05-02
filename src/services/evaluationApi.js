import axios from 'axios';

const baseURL = process.env.EVALUATION_API_BASE_URL || 'http://20.244.56.144/evaluation-service';
const apiClient = axios.create({
  baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
  timeout: 30000,
});

export async function fetchProtectedResource(path, token) {
  const response = await apiClient.get(path, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
