import axios from 'axios';


const API_URL = `https://dbms-h1sr.onrender.com/api/admin`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for handling cookies
});

// Add request interceptor to handle content type and auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    console.error('Admin API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      error: error
    });
    return Promise.reject(error);
  }
);

const adminService = {
  getAnalytics: async () => {
    try {
      const response = await api.get('/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  getUsers: async (page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc') => {
    try {
      const response = await api.get('/users', {
        params: { page, limit, search, sortBy, sortOrder }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getAuctions: async (page = 1, limit = 10, status = '', search = '', sortBy = 'created_at', sortOrder = 'desc') => {
    try {
      const response = await api.get('/auctions', {
        params: { page, limit, status, search, sortBy, sortOrder }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching auctions:', error);
      throw error;
    }
  },

  updateAuction: async (auctionId, auctionData) => {
    try {
      const response = await api.put(`/auctions/${auctionId}`, auctionData);
      return response.data;
    } catch (error) {
      console.error('Error updating auction:', error);
      throw error;
    }
  },

  deleteAuction: async (auctionId) => {
    try {
      const response = await api.delete(`/auctions/${auctionId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting auction:', error);
      throw error;
    }
  },

  getActivityLog: async (page = 1, limit = 20, type = '', startDate = '', endDate = '') => {
    try {
      const response = await api.get('/activity-log', {
        params: { page, limit, type, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity log:', error);
      throw error;
    }
  },

  generateReport: async (type, startDate, endDate) => {
    try {
      const response = await api.post('/reports', { type, startDate, endDate });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  getActivityData: async () => {
    try {
      const response = await api.get('/activity-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }
};

export default adminService; 