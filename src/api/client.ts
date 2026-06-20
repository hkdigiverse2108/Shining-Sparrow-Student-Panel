import axios from 'axios';

// Get base URL from environment or default to local backend port 5555
const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.29.26:5555';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      return now >= payload.exp;
    }
    return false;
  } catch {
    return true;
  }
};

const handleLogout = () => {
  localStorage.removeItem('shining_sparrow_student_token');
  localStorage.removeItem('shining_sparrow_student_profile');
  window.dispatchEvent(new Event('auth-logout'));

  const publicPaths = ['/', '/login', '/signup'];
  if (!publicPaths.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
};

// Interceptor to attach the auth token to every request dynamically
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shining_sparrow_student_token');
    if (token) {
      if (isTokenExpired(token)) {
        handleLogout();
        return Promise.reject(new axios.Cancel('Token expired, logging out...'));
      }
      config.headers['authorization'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional response interceptor to handle global errors (like 401 Unauthorized)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      handleLogout();
    }
    return Promise.reject(error);
  }
);

export default client;
