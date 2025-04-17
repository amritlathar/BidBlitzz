import { create } from 'zustand';
import { authService } from '../services/authService';
import { showToast } from '../utils/toast';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  error: null,
  isInitialized: false,

  // Actions
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  // Auth operations
  login: async (credentials) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.login(credentials);
      if (response.success) {
        set({ user: response.data, error: null });
        showToast.success('Login successful!');
        return { success: true };
      }
      set({ error: response.message });
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      set({ loading: true, error: null });
      const response = await authService.logout();
      set({ user: null, error: null }); // Always clear user on logout attempt
      if (response.success) {
        showToast.success('Logged out successfully!');
        return { success: true };
      }
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      set({ user: null }); // Always clear user on logout attempt
      const errorMessage = error.response?.data?.message || 'Logout failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  register: async (userData) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.register(userData);
      if (response.success) {
        set({ user: response.data, error: null });
        showToast.success('Registration successful!');
        return { success: true };
      }
      set({ error: response.message });
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userData) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.updateProfile(userData);
      if (response.success) {
        set({ user: response.data, error: null });
        showToast.success('Profile updated successfully!');
        return { success: true };
      }
      set({ error: response.message });
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (passwordData) => {
    try {
      set({ loading: true, error: null });
      const response = await authService.updatePassword(passwordData);
      if (response.success) {
        set({ error: null });
        showToast.success('Password updated successfully!');
        return { success: true };
      }
      set({ error: response.message });
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password update failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async () => {
    try {
      set({ loading: true, error: null });
      const response = await authService.deleteAccount();
      if (response.success) {
        set({ user: null, error: null });
        showToast.success('Account deleted successfully!');
        return { success: true };
      }
      set({ error: response.message });
      showToast.error(response.message);
      return { success: false, message: response.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Account deletion failed';
      set({ error: errorMessage });
      showToast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  // Check if user is authenticated
  checkAuth: async () => {
    // Skip if already initialized
    if (get().isInitialized) {
      return !!get().user;
    }

    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        set({ user: response.data, error: null, isInitialized: true });
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    
    // Always set initialized to true, even on failure
    set({ user: null, error: null, isInitialized: true });
    return false;
  }
}));

export default useAuthStore; 