import axios from 'axios';

const API_URL = `https://dbms-h1sr.onrender.com/api/users`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for handling cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401, just reject the promise
    return Promise.reject(error);
  }
);

export const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      const formData = new FormData();
      
      // Append text fields
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('full_name', userData.full_name);
      if (userData.contact) formData.append('contact', userData.contact);
      
      // Append avatar file if it exists
      if (userData.avatar) {
        formData.append('avatar', userData.avatar);
      }

      const response = await api.post('/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed'
      };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/get-user');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user'
      };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/update-user', userData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  },

  // Update password
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/update-password', passwordData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password update failed'
      };
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      const response = await api.delete('/delete-user');
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Account deletion failed'
      };
    }
  }
}; 