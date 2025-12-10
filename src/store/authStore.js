import { create } from 'zustand';
import { authAPI } from '../services/api';
import { normalizePhoneTo0, getRoleFromToken, decodeJWT, normalizeRole } from '../utils/helpers';


const initializeUser = () => {
  try {
    if (typeof window === 'undefined') return null;
    
    // Check localStorage first (remember me), then sessionStorage
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    // Check token from both storage locations
    const token = sessionStorage.getItem('token') || 
                  sessionStorage.getItem('accessToken') ||
                  localStorage.getItem('token') || 
                  localStorage.getItem('accessToken');
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
    console.error('Error parsing user from storage:', error);
  }
  return null;
};

const useAuthStore = create((set) => ({
  user: initializeUser(),
  loading: false,
  
  login: async (phone, password, rememberMe = false) => {
    const normalizedPhone = normalizePhoneTo0(phone);
    set({ loading: true });
    try {
      const { data: response, error } = await authAPI.login(normalizedPhone, password, rememberMe);
      
      if (error) {
        set({ loading: false });
        throw new Error(error);
      }

      if (!response || (response.statusCode !== 200 && response.statusCode !== 201)) {
        set({ loading: false });
        throw new Error(response?.message || 'Đăng nhập thất bại');
      }

      const result = response.result || response;
      
      // Store token based on rememberMe flag
      const storage = rememberMe ? localStorage : sessionStorage;
      
      if (result?.accessToken) {
        storage.setItem('token', result.accessToken);
        storage.setItem('accessToken', result.accessToken);
        // Clear from the other storage to avoid conflicts
        if (rememberMe) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('accessToken');
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
        }
      }
      
      if (result?.refreshToken) {
        storage.setItem('refreshToken', result.refreshToken);
        // Clear from the other storage
        if (rememberMe) {
          sessionStorage.removeItem('refreshToken');
        } else {
          localStorage.removeItem('refreshToken');
        }
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

      
      // Store user data in the same storage as token
      if (userData) {
        storage.setItem('user', JSON.stringify(userData));
        // Clear from the other storage
        if (rememberMe) {
          sessionStorage.removeItem('user');
        } else {
          localStorage.removeItem('user');
        }
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
     
      // Clear from both localStorage and sessionStorage
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      set({ user: null });
    }
  },
  
  setUser: (user) => set({ user }),
}));

export default useAuthStore;

