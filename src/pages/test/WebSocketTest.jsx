import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Space, Tag, Divider, List, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SendOutlined, ReloadOutlined } from '@ant-design/icons';
import useWebSocketStore from '../../store/websocketStore';
import { getUserIdFromToken, getEmployeeIdFromToken } from '../../utils/helpers';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import '../../styles/pages/test/websocket-test.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

function WebSocketTestContent() {
  const { isConnected, connect, disconnect, send, subscribe, notifications, clearNotifications } = useWebSocketStore();
  const [messages, setMessages] = useState([]);
  const [testDestination, setTestDestination] = useState('/test/message');
  const [testMessage, setTestMessage] = useState('{"type": "test", "message": "Hello from frontend"}');
  const [subscribeDestination, setSubscribeDestination] = useState('/topic/test');
  const [subscribed, setSubscribed] = useState(false);
  const unsubscribeRef = useRef(null);
  const currentDestinationRef = useRef(null);
  const subscribeFnRef = useRef(null);
  const userId = getUserIdFromToken();
  const employeeId = getEmployeeIdFromToken();

  subscribeFnRef.current = subscribe;

  useEffect(() => {
    if (!isConnected) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        currentDestinationRef.current = null;
        setSubscribed(false);
      }
      return;
    }

    const dest = subscribeDestination;
    if (currentDestinationRef.current === dest && unsubscribeRef.current) {
      return;
    }

    const attemptSubscribe = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!subscribeFnRef.current) {
        return;
      }

      const unsubscribe = subscribeFnRef.current(dest, (data) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          destination: dest,
          data,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }, { type: 'topic' });

      if (unsubscribe) {
        unsubscribeRef.current = unsubscribe;
        currentDestinationRef.current = dest;
        setSubscribed(true);
      } else {
        setTimeout(attemptSubscribe, 100);
      }
    };

    setTimeout(attemptSubscribe, 100);
  }, [isConnected, subscribeDestination]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        currentDestinationRef.current = null;
      }
    };
  }, []);

  const handleConnect = () => {
    connect();
    message.info('Đang kết nối WebSocket...');
  };

  const handleDisconnect = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    disconnect();
    message.info('Đã ngắt kết nối WebSocket');
    setMessages([]);
    setSubscribed(false);
  };

  const handleSendMessage = () => {
    try {
      const messageBody = JSON.parse(testMessage);
      const success = send(testDestination, messageBody);
      
      if (success) {
        message.success(`Đã gửi message đến ${testDestination}`);
        setMessages(prev => [...prev, {
          id: Date.now(),
          destination: testDestination,
          data: messageBody,
          timestamp: new Date().toLocaleTimeString(),
          sent: true
        }]);
      } else {
        message.error('Không thể gửi message. Kiểm tra kết nối WebSocket.');
      }
    } catch (error) {
      message.error('Message không phải JSON hợp lệ: ' + error.message);
    }
  };

  const handleTestSubscribe = () => {
    if (isConnected) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        currentDestinationRef.current = null;
      }
      setSubscribed(false);
      message.info(`Đang subscribe lại vào ${subscribeDestination}...`);
      setTimeout(() => {
        const unsubscribe = subscribe(subscribeDestination, (data) => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            destination: subscribeDestination,
            data,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }, { type: 'topic' });
        if (unsubscribe) {
          unsubscribeRef.current = unsubscribe;
          currentDestinationRef.current = subscribeDestination;
          setSubscribed(true);
        }
      }, 100);
    } else {
      message.warning('Chưa kết nối WebSocket. Vui lòng kết nối trước.');
    }
  };

  return (
    <div className="websocket-test-container">
      <Card>
        <Title level={2}>WebSocket STOMP Test</Title>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Space>
              <Text strong>Trạng thái kết nối: </Text>
              <Tag 
                icon={isConnected ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                color={isConnected ? 'success' : 'error'}
              >
                {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}
              </Tag>
              <Text type="secondary">User ID: {userId || 'N/A'}</Text>
              <Text type="secondary">Employee ID: {employeeId || 'N/A'}</Text>
            </Space>
          </div>

          <Divider />

          <div>
            <Space>
              <Button 
                type="primary" 
                onClick={handleConnect}
                disabled={isConnected}
                icon={<CheckCircleOutlined />}
              >
                Kết nối
              </Button>
              <Button 
                danger
                onClick={handleDisconnect}
                disabled={!isConnected}
                icon={<CloseCircleOutlined />}
              >
                Ngắt kết nối
              </Button>
              <Button 
                onClick={handleTestSubscribe}
                disabled={!isConnected}
                icon={<ReloadOutlined />}
              >
                Subscribe lại
              </Button>
            </Space>
          </div>

          <Divider>Gửi Message</Divider>

          <div>
            <Text strong>Destination (prefix /app sẽ được thêm tự động):</Text>
            <Input
              value={testDestination}
              onChange={(e) => setTestDestination(e.target.value)}
              placeholder="/test/message"
              style={{ marginTop: 8 }}
            />
          </div>

          <div>
            <Text strong>Message (JSON format):</Text>
            <TextArea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={4}
              placeholder='{"type": "test", "message": "Hello"}'
              style={{ marginTop: 8 }}
            />
          </div>

          <Button
            type="primary"
            onClick={handleSendMessage}
            disabled={!isConnected}
            icon={<SendOutlined />}
            block
          >
            Gửi Message
          </Button>

          <Divider>Subscribe để nhận Messages</Divider>

          <div>
            <Text strong>Destination (topic/queue):</Text>
            <Input
              value={subscribeDestination}
              onChange={(e) => setSubscribeDestination(e.target.value)}
              placeholder="/topic/test hoặc /queue/test"
              style={{ marginTop: 8 }}
            />
            {subscribed && (
              <Tag color="green" style={{ marginTop: 8 }}>
                Đã subscribe vào {subscribeDestination}
              </Tag>
            )}
          </div>

          <Divider>Messages nhận được ({messages.length})</Divider>

          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Tag color={item.sent ? 'blue' : 'green'}>
                        {item.sent ? 'Đã gửi' : 'Đã nhận'}
                      </Tag>
                      <Text strong>{item.destination}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {item.timestamp}
                      </Text>
                    </div>
                    <Text code style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(item.data, null, 2)}
                    </Text>
                  </Space>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: 'Chưa có messages' }}
            style={{ maxHeight: '400px', overflow: 'auto' }}
          />

          <Divider>Notifications ({notifications.length})</Divider>
          
          <div>
            <Space>
              <Text type="secondary">
                Subscribe topic: <Text code>/topic/noti/{employeeId || 'N/A'}</Text>
              </Text>
            </Space>
          </div>

          <div>
            <Button onClick={clearNotifications} size="small">
              Xóa tất cả
            </Button>
          </div>

          <List
            dataSource={notifications}
            renderItem={(item, index) => (
              <List.Item>
                <div>
                  <Text strong>Notification #{index + 1}</Text>
                  <Text code style={{ display: 'block', marginTop: 4 }}>
                    {JSON.stringify(item, null, 2)}
                  </Text>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: 'Chưa có notifications' }}
            style={{ maxHeight: '300px', overflow: 'auto' }}
          />
        </Space>
      </Card>
    </div>
  );
}

export default function WebSocketTest() {
  return (
    <ProtectedRoute>
      <WebSocketTestContent />
    </ProtectedRoute>
  );
}

