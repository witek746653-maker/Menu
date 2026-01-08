import axios from 'axios';

// Базовый URL API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Создаём экземпляр axios с настройками
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Для работы с cookies (Flask-Login)
});

// ========== ПУБЛИЧНЫЕ API ==========

export const getDishes = async () => {
  const response = await api.get('/api/dishes');
  return response.data;
};

export const getDish = async (id) => {
  const response = await api.get(`/api/dishes/${id}`);
  return response.data;
};

export const getMenus = async () => {
  const response = await api.get('/api/menus');
  return response.data;
};

export const getSections = async (menuName = null) => {
  const params = menuName ? { menu: menuName } : {};
  const response = await api.get('/api/sections', { params });
  return response.data;
};

// ========== API ДЛЯ ВИН ==========

export const getWines = async () => {
  const response = await api.get('/api/wines');
  return response.data;
};

export const getWinesByCategory = async (category) => {
  const response = await api.get(`/api/wines/category/${category}`);
  return response.data;
};

export const getWine = async (id) => {
  const response = await api.get(`/api/wines/${id}`);
  return response.data;
};

// ========== АДМИНСКИЕ API ==========

export const login = async (password) => {
  const response = await api.post('/api/admin/login', { password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/admin/logout');
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get('/api/admin/check');
  return response.data;
};

export const saveDishes = async (dishes) => {
  const response = await api.post('/api/admin/dishes', dishes);
  return response.data;
};

export const updateDish = async (id, dish) => {
  const response = await api.put(`/api/admin/dishes/${id}`, dish);
  return response.data;
};

export const addDish = async (dish) => {
  const response = await api.put('/api/admin/dishes', dish);
  return response.data;
};

export const deleteDish = async (id) => {
  const response = await api.delete(`/api/admin/dishes/${id}`);
  return response.data;
};

export default api;

