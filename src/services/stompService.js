import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from '../utils/constants';

function getToken() {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken')
    );
  } catch {
    return null;
  }
}

class StompService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.onConnected = null;
    this.onDisconnected = null;
    this.onError = null;
  }

  connect() {
    if (this.isConnected || (this.client?.connected)) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('No token found, cannot connect STOMP');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },

      onConnect: (frame) => {
        console.log('✅ STOMP Connected:', frame);
        console.log('Connection headers:', frame.headers);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        if (this.onConnected) {
          this.onConnected(frame);
        }
      },

      onDisconnect: () => {
        console.log('STOMP Disconnected');
        this.isConnected = false;
        this.subscriptions.clear();
        
        if (this.onDisconnected) {
          this.onDisconnected();
        }
      },

      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        this.isConnected = false;
        
        if (this.onError) {
          this.onError(frame);
        }
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            if (!this.isConnected) {
              this.connect();
            }
          }, 5000);
        }
      }
    });

    this.client.activate();
  }

  subscribe(destination, callback, headers = {}) {
    if (!this.client?.connected) {
      console.warn(`⚠️ STOMP not connected, cannot subscribe to ${destination}`);
      console.warn(`Connection status - isConnected: ${this.isConnected}, client.connected: ${this.client?.connected}`);
      return null;
    }

    try {
      console.log(`🔔 Attempting to subscribe to: ${destination}`);
      const subscription = this.client.subscribe(destination, (message) => {
        console.log(`📥 Message received from ${destination}:`, message.body);
        try {
          const data = JSON.parse(message.body);
          callback(data);
        } catch (error) {
          console.error('❌ Error parsing STOMP message:', error, 'Raw body:', message.body);
          callback(message.body);
        }
      }, headers);

      const subId = `${destination}_${Date.now()}`;
      this.subscriptions.set(subId, subscription);
      console.log(`✅ Successfully subscribed to ${destination} (subscription ID: ${subId})`);

      return () => {
        try {
          subscription.unsubscribe();
          this.subscriptions.delete(subId);
          console.log(`🔌 Unsubscribed from ${destination}`);
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      };
    } catch (error) {
      console.error(`❌ Error subscribing to destination ${destination}:`, error);
      return null;
    }
  }

  send(destination, body, headers = {}) {
    if (!this.isConnected || !this.client?.connected) {
      console.warn('STOMP not connected, cannot send message');
      return false;
    }

    try {
      const token = getToken();
      const messageHeaders = {
        ...headers,
        ...(token && { Authorization: `Bearer ${token}` })
      };

      this.client.publish({
        destination: destination.startsWith('/app') ? destination : `/app${destination}`,
        body: JSON.stringify(body),
        headers: messageHeaders
      });

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  subscribeToTopic(topic, callback) {
    const destination = topic.startsWith('/topic') ? topic : `/topic${topic}`;
    return this.subscribe(destination, callback);
  }

  subscribeToQueue(queue, callback) {
    const destination = queue.startsWith('/queue') ? queue : `/queue${queue}`;
    return this.subscribe(destination, callback);
  }

  subscribeToUser(userId, destination, callback) {
    const userDestination = `/user/${userId}/queue${destination}`;
    return this.subscribe(userDestination, callback);
  }

  disconnect() {
    if (this.client) {
      this.subscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      this.subscriptions.clear();

      try {
        this.client.deactivate();
      } catch (error) {
        console.error('Error deactivating client:', error);
      }
      
      this.client = null;
      this.isConnected = false;
    }
  }

  getConnected() {
    return this.isConnected && this.client?.connected;
  }

  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }
}

export const stompService = new StompService();
export default stompService;
