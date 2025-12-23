import { create } from 'zustand';
import stompService from '../services/stompService';
import { getEmployeeIdFromToken } from '../utils/helpers';

const notificationUnsubscribeRef = { current: null };
const publicUnsubscribeRef = { current: null };

const useWebSocketStore = create((set, get) => ({
  isConnected: false,
  notifications: [],
  
  connect: () => {
    if (stompService.getConnected()) {
      console.log('⚠️ WebSocket already connected, skipping...');
      return;
    }

    stompService.onConnected = (frame) => {
      set({ isConnected: true });
      
      setTimeout(() => {
        if (notificationUnsubscribeRef.current) {
          notificationUnsubscribeRef.current();
          notificationUnsubscribeRef.current = null;
        }
        if (publicUnsubscribeRef.current) {
          publicUnsubscribeRef.current();
          publicUnsubscribeRef.current = null;
        }

        const employeeId = getEmployeeIdFromToken();
        
        if (employeeId) {
          const notificationTopic = `/topic/noti/${employeeId}`;
          console.log(`📡 Subscribing to notification topic: ${notificationTopic}`);
          
          const unsubscribe = stompService.subscribeToTopic(notificationTopic, (data) => {
            console.log('📬 Notification received:', data);
            const { notifications } = get();
            set({ 
              notifications: [data, ...notifications].slice(0, 50)
            });
            
            if (Notification.permission === 'granted') {
              new Notification(data.title || 'New Notification', {
                body: data.message || '',
                icon: '/favicon.ico'
              });
            }
          });
          
          if (unsubscribe) {
            notificationUnsubscribeRef.current = unsubscribe;
            console.log(`✅ Successfully subscribed to ${notificationTopic}`);
          } else {
            console.error(`❌ Failed to subscribe to ${notificationTopic}`);
          }
        } else {
          console.warn('⚠️ Employee ID not found, cannot subscribe to notifications');
        }
        
        const publicUnsubscribe = stompService.subscribeToTopic('/public/updates', (data) => {
          console.log('Public update:', data);
        });
        
        if (publicUnsubscribe) {
          publicUnsubscribeRef.current = publicUnsubscribe;
          console.log('✅ Successfully subscribed to /public/updates');
        }
      }, 200);
    };
    
    stompService.onDisconnected = () => {
      set({ isConnected: false });
      notificationUnsubscribeRef.current = null;
      publicUnsubscribeRef.current = null;
    };
    
    stompService.onError = (error) => {
      console.error('WebSocket error:', error);
    };
    
    stompService.connect();
  },
  
  disconnect: () => {
    if (notificationUnsubscribeRef.current) {
      notificationUnsubscribeRef.current();
      notificationUnsubscribeRef.current = null;
    }
    if (publicUnsubscribeRef.current) {
      publicUnsubscribeRef.current();
      publicUnsubscribeRef.current = null;
    }
    stompService.disconnect();
    set({ isConnected: false });
  },
  
  send: (destination, body) => {
    return stompService.send(destination, body);
  },
  
  subscribe: (destination, callback, options = {}) => {
    const { type = 'topic', userId } = options;
    
    let unsubscribe;
    
    if (type === 'user' && userId) {
      unsubscribe = stompService.subscribeToUser(userId, destination, callback);
    } else if (type === 'queue') {
      unsubscribe = stompService.subscribeToQueue(destination, callback);
    } else {
      unsubscribe = stompService.subscribeToTopic(destination, callback);
    }
    
    return unsubscribe;
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  addNotification: (notification) => {
    const { notifications } = get();
    const newNotification = {
      ...notification,
      status: notification.status || 'UNREAD',
      isRead: false,
      createdAt: notification.createdAt || new Date().toISOString()
    };
    set({ 
      notifications: [newNotification, ...notifications].slice(0, 50)
    });
  },
  
  markNotificationAsRead: (notificationId) => {
    const { notifications } = get();
    set({
      notifications: notifications.map(noti => {
        const id = noti.notificationId || noti.id;
        if (id === notificationId || String(id) === String(notificationId)) {
          return { ...noti, status: 'READ', isRead: true };
        }
        return noti;
      })
    });
  }
}));

export default useWebSocketStore;
