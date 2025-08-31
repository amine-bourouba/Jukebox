import api from '../services/api';

const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

const refresh = async (userId: string, refreshToken: string) => {
  const response = await api.post('/auth/refresh', { userId, refreshToken });
  return response.data;
};

const register = async (data: { displayName: string; email: string; password: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

const getUser = async (token: string) => {
  const response = await api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export default { login, refresh, register, getUser };