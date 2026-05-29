import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;