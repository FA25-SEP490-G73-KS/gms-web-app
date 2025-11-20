import { useState, useMemo, useCallback } from 'react';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Checkbox from 'antd/es/checkbox';
import message from 'antd/es/message';
import Divider from 'antd/es/divider';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import '../../styles/pages/auth/login.css';

export default function Login() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [logoLoaded, setLogoLoaded] = useState(false);

    const onFinish = useCallback(async (values) => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            message.success('Đăng nhập thành công!');
        } catch (error) {
            message.error('Đăng nhập thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    }, []);

    const onFinishFailed = useCallback((errorInfo) => {
        console.error('Form validation failed:', errorInfo);
    }, []);

    const handleLogoLoad = useCallback(() => {
        setLogoLoaded(true);
    }, []);

    const iconRender = useMemo(() => (visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />), []);

    return (
        <div className="login-container">
            <div className="login-wrapper">
                <Card className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            {!logoLoaded && <div className="login-logo-placeholder" />}
                            <img
                                src="/image/mainlogo.png"
                                alt="Logo Garage Hoàng Tuấn"
                                loading="eager"
                                onLoad={handleLogoLoad}
                                style={{ opacity: logoLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
                                width="120"
                                height="auto"
                            />
                        </div>
                        <h1 className="login-title">Đăng Nhập</h1>
                        <p className="login-subtitle">Chào mừng bạn trở lại Garage Hoàng Tuấn</p>
                    </div>

                    <Form
                        form={form}
                        name="login"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        layout="vertical"
                        size="large"
                        className="login-form"
                    >
                        <Form.Item
                            label="Tên đăng nhập"
                            name="username"
                            rules={[
                                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined className="input-icon" />}
                                placeholder="Nhập tên đăng nhập"
                                autoComplete="username"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="input-icon" />}
                                placeholder="Nhập mật khẩu"
                                iconRender={iconRender}
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <div className="login-options">
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                                </Form.Item>
                                <a className="login-forgot" href="#forgot">
                                    Quên mật khẩu?
                                </a>
                            </div>
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                className="login-button"
                            >
                                Đăng Nhập
                            </Button>
                        </Form.Item>

                        <Divider plain>Hoặc</Divider>

                        <div className="login-footer">
                            <p>
                                Chưa có tài khoản? <a href="#register">Đăng ký ngay</a>
                            </p>
                        </div>
                    </Form>
                </Card>
            </div>
        </div>
    );
}