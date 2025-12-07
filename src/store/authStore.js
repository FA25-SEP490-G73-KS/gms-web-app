import { create } from 'zustand';
import { authAPI } from '../services/api';
import { normalizePhoneTo0, getRoleFromToken, decodeJWT, normalizeRole } from '../utils/helpers';


const initializeUser = () => {
  try {
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          const rawRole = decoded?.role || decoded?.userRole || decoded?.authorities?.[0] || decoded?.authority;
          if (rawRole) {
            
            const normalizedRole = normalizeRole(rawRole);
            return {
              id: decoded?.userId || decoded?.id || decoded?.sub || null,
              role: normalizedRole,
              fullName: decoded?.fullName || decoded?.name || decoded?.username || null,
              email: decoded?.email || null,
              phone: decoded?.phone || null,
            };
          }
        }
      }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  return null;
};

const useAuthStore = create((set) => ({
  user: initializeUser(),
  loading: false,
  
  login: async (phone, password) => {
    const normalizedPhone = normalizePhoneTo0(phone);
    set({ loading: true });
    try {
      const { data: response, error } = await authAPI.login(normalizedPhone, password);
      
      if (error) {
        set({ loading: false });
        throw new Error(error);
      }

      if (!response || (response.statusCode !== 200 && response.statusCode !== 201)) {
        set({ loading: false });
        throw new Error(response?.message || 'Đăng nhập thất bại');
      }

      const result = response.result || response;
      
 
      if (result?.accessToken) {
        localStorage.setItem('token', result.accessToken);
        localStorage.setItem('accessToken', result.accessToken); 
      }
      
      if (result?.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }

     
     
      let userRole = null;
      if (result?.accessToken) {
        userRole = getRoleFromToken(); 
      }
      
     
      if (!userRole) {
        const rawRole = result?.role || result?.userRole || result?.user?.role;
        userRole = rawRole ? normalizeRole(rawRole) : null;
      }
   
      const userData = result?.user || {
        id: result?.userId || result?.id || '1',
        phone: normalizedPhone,
        role: userRole,
        fullName: result?.fullName || result?.name || '',
        email: result?.email || ''
      };
      
      
      if (userData.role) {
        userData.role = normalizeRole(userData.role);
      } else if (userRole) {
        userData.role = userRole;
      }

      
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

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
      try {
        const wsStore = (await import('./websocketStore')).default;
        wsStore.getState().disconnect();
      } catch (wsError) {
        console.error('Error disconnecting WebSocket:', wsError);
      }
     
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      set({ user: null });
    }
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;

