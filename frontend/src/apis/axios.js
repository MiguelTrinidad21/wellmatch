import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://your-backend.up.railway.app
  withCredentials: true,
});

export default api;