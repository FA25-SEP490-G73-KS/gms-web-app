import React from 'react';
import Header from '../components/Header';
import SidebarAppointment from '../components/appointments/SidebarAppointment';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/dashboard.css';

export default function DashboardLayout({ children, sidebar }) {
  return (
    <div>
      <Header />
      <div className="dashboard">
        {sidebar ?? <SidebarAppointment />}
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

