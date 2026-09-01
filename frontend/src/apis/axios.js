import axios from 'axios';
import { userStore } from '../zustand/userState'; // adjust the relative path to match your folder structure

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const publicPathPatterns = [
  '/login',
  '/register',
  '/verify',
  '/terms',
  '/policies',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      userStore.getState().logoutUser();
      userStore.getState().setAuthChecked(true);

      const currentPath = window.location.pathname;
      const isPublicPath = publicPathPatterns.some((p) => currentPath.includes(p));

      if (!isPublicPath) {
        const isEmployerPath = currentPath.startsWith('/employer');
        window.location.href = isEmployerPath ? '/employer/login' : '/applicant/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;