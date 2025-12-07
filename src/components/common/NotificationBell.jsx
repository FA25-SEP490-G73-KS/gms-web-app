import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import useWebSocketStore from '../../store/websocketStore';
import { notificationAPI } from '../../services/api';
import { formatTimeWithVNTimezone, parseDateWithVNTimezone } from '../../utils/helpers';
import '../../styles/components/notification-bell.css';

function NotificationBell() {
  const navigate = useNavigate();
  const wsNotifications = useWebSocketStore((state) => state.notifications);
  const [apiNotifications, setApiNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const previousUnreadCountRef = useRef(-1);
  const previousWsNotificationsCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const visibleRef = useRef(false);
  const initialLoadRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await notificationAPI.getAll(0, 20);
      if (!error && data) {
        const result = data.result || data.content || data.data || [];
        setApiNotifications(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.45);
      }, 150);
    } catch (error) {
      console.log('Notification sound play failed:', error);
    }
  }, []);

  const allNotifications = useMemo(() => {
    const merged = new Map();
    
    [...apiNotifications, ...wsNotifications].forEach(noti => {
      const id = noti.notificationId || noti.id || `${noti.title}_${noti.createdAt || Date.now()}`;
      if (!merged.has(id)) {
        merged.set(id, noti);
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => {
      const dateA = parseDateWithVNTimezone(a.createdAt || a.created_at);
      const dateB = parseDateWithVNTimezone(b.createdAt || b.created_at);
      if (!dateA || !dateA.isValid()) return 1;
      if (!dateB || !dateB.isValid()) return -1;
      return dateB.valueOf() - dateA.valueOf();
    });
  }, [apiNotifications, wsNotifications]);

  const unreadNotifications = useMemo(() => 
    allNotifications.filter(
      (noti) => noti.status === 'UNREAD' || noti.status === undefined || !noti.isRead
    ),
    [allNotifications]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (initialLoadRef.current && !loading && apiNotifications.length >= 0) {
      setTimeout(() => {
        previousUnreadCountRef.current = unreadNotifications.length;
        previousWsNotificationsCountRef.current = wsNotifications.length;
        isInitializedRef.current = true;
        initialLoadRef.current = false;
      }, 1500);
    }
  }, [loading, apiNotifications.length]);

  useEffect(() => {
    const currentUnread = unreadNotifications.length;
    const currentWsCount = wsNotifications.length;
    
    setUnreadCount(currentUnread);
    
    if (!isInitializedRef.current || initialLoadRef.current) {
      if (!initialLoadRef.current) {
        previousUnreadCountRef.current = currentUnread;
        previousWsNotificationsCountRef.current = currentWsCount;
      }
      return;
    }
    
    const wsCountIncreased = currentWsCount > previousWsNotificationsCountRef.current;
    
    if (wsCountIncreased && currentUnread > previousUnreadCountRef.current) {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 600);
      playNotificationSound();
    }
    
    previousUnreadCountRef.current = currentUnread;
    previousWsNotificationsCountRef.current = currentWsCount;
  }, [unreadNotifications.length, wsNotifications.length, playNotificationSound]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event) => {
      if (!visibleRef.current) return;
      
      const target = event.target;
      
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      
      const sidebar = target.closest('.admin-sidebar, .warehouse-sidebar, .manager-sidebar');
      if (sidebar) return;
      
      setVisible(false);
      visibleRef.current = false;
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [visible]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    if (!notificationId) return;
    
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setApiNotifications((prev) =>
        prev.map((noti) =>
          noti.notificationId === notificationId || noti.id === notificationId
            ? { ...noti, status: 'READ', isRead: true }
            : noti
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    const notificationId = notification.notificationId || notification.id;
    
    if (notificationId) {
      handleMarkAsRead(notificationId);
      const { markNotificationAsRead } = useWebSocketStore.getState();
      if (markNotificationAsRead) {
        markNotificationAsRead(notificationId);
      }
    } else {
      const { markNotificationAsRead, notifications } = useWebSocketStore.getState();
      const wsNoti = notifications.find(n => 
        (n.notificationId || n.id) === (notification.notificationId || notification.id) ||
        n === notification
      );
      if (wsNoti && markNotificationAsRead) {
        const id = wsNoti.notificationId || wsNoti.id;
        if (id) {
          markNotificationAsRead(id);
        }
      }
    }
    
    if (notification.actionPath) {
      navigate(notification.actionPath);
      setVisible(false);
    }
  }, [navigate, handleMarkAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      setApiNotifications((prev) =>
        prev.map((noti) => ({ ...noti, status: 'READ', isRead: true }))
      );
      const { notifications, markNotificationAsRead } = useWebSocketStore.getState();
      if (markNotificationAsRead) {
        notifications.forEach(noti => {
          const id = noti.notificationId || noti.id;
          if (id) {
            markNotificationAsRead(id);
          }
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);


  const updateDropdownPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, []);

  const toggleDropdown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    setVisible(prev => {
      const newValue = !prev;
      if (newValue) {
        setTimeout(updateDropdownPosition, 0);
      }
      return newValue;
    });
  }, [updateDropdownPosition]);

  useEffect(() => {
    if (visible) {
      updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [visible, updateDropdownPosition]);

  return (
    <div ref={containerRef} className="notification-bell-container">
      <button
        className={`notification-bell-btn ${shouldShake ? 'shake' : ''}`}
        onClick={toggleDropdown}
        type="button"
        aria-label="Notifications"
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      
      {visible && createPortal(
        <div 
          ref={dropdownRef} 
          className="notification-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 9999
          }}
        >
          <div className="notification-dropdown-header">
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all-read"
                onClick={handleMarkAllAsRead}
                type="button"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          
          <div className="notification-dropdown-content">
            {loading && allNotifications.length === 0 ? (
              <div className="notification-loading">
                <div className="notification-spinner"></div>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="notification-empty">
                <p>Chưa có thông báo</p>
              </div>
            ) : (
              <div className="notification-list">
                {allNotifications.map((item, index) => {
                  const isUnread = item.status === 'UNREAD' || item.status === undefined || !item.isRead;
                  const notificationId = item.notificationId || item.id;
                  
                  return (
                    <div
                      key={notificationId || index}
                      className={`notification-item ${isUnread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="notification-item-content">
                        <div className="notification-item-header">
                          <span className={`notification-title ${isUnread ? 'bold' : ''}`}>
                            {item.title || 'Thông báo'}
                          </span>
                          {isUnread && <div className="notification-dot" />}
                        </div>
                        <p className="notification-message">
                          {item.message || item.content || ''}
                        </p>
                        <span className="notification-time">
                          {formatTimeWithVNTimezone(item.createdAt || item.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(NotificationBell);
