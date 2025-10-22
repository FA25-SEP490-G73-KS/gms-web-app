import React from "react";
import Header from "../components/header";
import SidebarAppointment from "../components/appointments/sidebarAppointment";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/dashboard.css";

interface Props {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export default function DashboardLayout({ children, sidebar }: Props) {
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
