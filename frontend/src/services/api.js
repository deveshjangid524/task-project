import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-project-36nd.onrender.com/api';

// Export the base URL for file construction
export const API_BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export default api;
