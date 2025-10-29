import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  
  login: async (username, password) => {
    set({ loading: true });
    try {
     
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
   
    set({ user: null });
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;

