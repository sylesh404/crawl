import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attaches the admin token on /admin/* calls (except the login endpoint itself),
// and the user token everywhere else.
api.interceptors.request.use((config) => {
  const isAdminRoute = config.url?.startsWith('/admin') && !config.url.includes('/admin/auth/login');
  const token = isAdminRoute
    ? localStorage.getItem('crawlnews_admin_token')
    : localStorage.getItem('crawlnews_user_token');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token invalid/expired - let calling page decide what to do (usually redirect to login)
    }
    return Promise.reject(err);
  }
);

export default api;
