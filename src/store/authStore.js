import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  
  login: async (username, password) => {
    set({ loading: true });
    try {
      // TODO: Implement API login
      await new Promise((r) => setTimeout(r, 300));
      set({ 
        user: { id: '1', name: 'Demo User', role: 'Manager' },
        loading: false 
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    // TODO: Implement API logout
    set({ user: null });
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;

