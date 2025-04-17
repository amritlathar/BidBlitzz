import axios from 'axios';

const API_URL = `https://dbms-h1sr.onrender.com/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add request interceptor to handle content type
api.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Stats API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      error: error
    });
    return Promise.reject(error);
  }
);

const statsService = {
  getPlatformStats: async () => {
    try {
      // First try to get stats from admin endpoint
      try {
        const adminResponse = await api.get('/admin/analytics');
        if (adminResponse.data.success) {
          return adminResponse.data.data;
        }
      } catch (adminError) {
        console.log('Not an admin user, falling back to public stats');
      }

      // Fallback to public stats endpoint
      const response = await api.get('/auctions/stats');
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('Failed to fetch platform stats');
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      return {
        totalUsers: 0,
        totalAuctions: 0,
        activeAuctions: 0,
        totalBids: 0,
        totalViews: 0,
        totalStarred: 0,
      };
    }
  }
};

export default statsService; 