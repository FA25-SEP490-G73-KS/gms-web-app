import React, { useState, useEffect } from 'react';
import CustomerLayout from '../layouts/CustomerLayout';
import axios from 'axios';
import '../styles/my-appointments.css';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
   
      const res = await axios.get('http://localhost:8080/api/appointments/my-appointments');
      setAppointments(res.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'CONFIRMED': { label: 'Đã xác nhận', class: 'status-confirmed' },
      'ARRIVED': { label: 'Đã đến', class: 'status-arrived' },
      'CANCELLED': { label: 'Đã hủy', class: 'status-cancelled' },
      'COMPLETED': { label: 'Hoàn thành', class: 'status-completed' },
      'OVERDUE': { label: 'Quá hẹn', class: 'status-overdue' },
    };
    const statusInfo = statusMap[status] || { label: status, class: '' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['CONFIRMED'].includes(apt.status);
    if (filter === 'completed') return apt.status === 'COMPLETED';
    if (filter === 'cancelled') return apt.status === 'CANCELLED';
    return true;
  });

  return (
    <CustomerLayout>
      <div className="my-appointments-page">
        <div className="page-header">
          <h1>Lịch hẹn của tôi</h1>
          <p>Quản lý và theo dõi các lịch hẹn của bạn</p>
        </div>

        <div className="appointments-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Sắp tới
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Hoàn thành
          </button>
          <button
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Đã hủy
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-calendar-x"></i>
            <h3>Chưa có lịch hẹn nào</h3>
            <p>Bạn chưa có lịch hẹn nào. Đặt lịch ngay để được phục vụ tốt nhất!</p>
            <a href="/#services" className="btn-primary">Đặt lịch ngay</a>
          </div>
        ) : (
          <div className="appointments-grid">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.appointmentId} className="appointment-card">
                <div className="card-header">
                  <div className="appointment-id">
                    <i className="bi bi-hash"></i>
                    {appointment.appointmentId}
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <i className="bi bi-calendar-event"></i>
                    <span>{appointment.appointmentDate}</span>
                  </div>
                  <div className="info-row">
                    <i className="bi bi-clock"></i>
                    <span>{appointment.timeSlotLabel}</span>
                  </div>
                  <div className="info-row">
                    <i className="bi bi-car-front"></i>
                    <span>{appointment.licensePlate}</span>
                  </div>
                  <div className="info-row">
                    <i className="bi bi-wrench"></i>
                    <span>{appointment.serviceType}</span>
                  </div>
                  {appointment.note && (
                    <div className="info-row note">
                      <i className="bi bi-chat-left-text"></i>
                      <span>{appointment.note}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button className="btn-detail">Xem chi tiết</button>
                  {appointment.status === 'CONFIRMED' && (
                    <button className="btn-cancel">Hủy lịch</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

