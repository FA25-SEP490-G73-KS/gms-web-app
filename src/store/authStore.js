import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  
  login: async (phone, password) => {
    set({ loading: true });
    try {
      const { data: response, error } = await authAPI.login(phone, password);
      
      if (error) {
        set({ loading: false });
        throw new Error(error);
      }

      // Save token if provided
      if (response?.accessToken) {
        localStorage.setItem('token', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      }

      // Set user data
      const userData = response?.user || {
        id: response?.userId || '1',
        phone: phone,
        role: response?.role || 'USER'
      };

      set({ 
        user: userData,
        loading: false 
      });

      return response;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      set({ user: null });
    }
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;

