import axios from 'axios';

// Create a configured axios instance to use throughout the app
const api = axios.create({
  baseURL: 'http://localhost:8000', // Our FastAPI backend URL
});

// Add a request interceptor to attach the JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
