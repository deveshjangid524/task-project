import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Assessment API - Token from localStorage:', token ? token.substring(0, 20) + '...' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Assessment API - Setting Authorization header:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('Assessment API - No token found in localStorage');
  }
  return config;
}, (error) => {
  console.error('Assessment API - Request interceptor error:', error);
  return Promise.reject(error);
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Assessment API - 401 Unauthorized - Token may be expired');
      console.log('Assessment API - Token check - Current token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');
      // Temporarily disable auto-redirect to debug
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const assessmentService = {
  // Get all assessments
  getAssessments: async () => {
    const response = await api.get('/assessments');
    return response.data;
  },

  // Get assessment by ID
  getAssessment: async (id) => {
    const response = await api.get(`/assessments/${id}`);
    return response.data;
  },

  // Create new assessment
  createAssessment: async (assessmentData) => {
    const response = await api.post('/assessments', assessmentData);
    return response.data;
  },

  // Update assessment
  updateAssessment: async (id, assessmentData) => {
    const response = await api.put(`/assessments/${id}`, assessmentData);
    return response.data;
  },

  // Delete assessment
  deleteAssessment: async (id) => {
    const response = await api.delete(`/assessments/${id}`);
    return response.data;
  }
};

export default api;
