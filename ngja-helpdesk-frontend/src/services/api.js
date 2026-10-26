import axios from 'axios';

const API_BASE = 'http://localhost/ngja-helpdesk/backend/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = {
        'admin@ngja.lk':    { password: 'admin123', user: { id: 1, name: 'Admin User',     role: 'admin',            email } },
        'employee@ngja.lk': { password: 'emp123',   user: { id: 2, name: 'Kamal Silva',    role: 'employee',         email } },
        'helpdesk@ngja.lk': { password: 'hd123',    user: { id: 3, name: 'Nimal Perera',   role: 'helpdesk_officer', email } },
        'officer@ngja.lk':  { password: 'off123',   user: { id: 4, name: 'Sunil Fernando', role: 'officer',          email } },
      };
      const found = users[email];
      if (found && found.password === password) {
        resolve({ token: `mock-token-${found.user.role}`, user: found.user });
      } else {
        reject({ response: { data: { error: 'Invalid email or password' } } });
      }
    }, 400);
  });
};

export default api;
