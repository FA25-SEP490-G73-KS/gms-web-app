import DashboardLayout from "../layouts/DashboardLayout";
import AppointmentList from "../components/appointments/AppointmentList";

export function meta() {
  return [
    { title: "GMS • Lịch hẹn" },
    { name: "description", content: "Danh sách lịch hẹn • Garage Hoàng Tuấn" },
  ];
}

export default function AppointmentsRoute() {
  return (
    <DashboardLayout>
      <AppointmentList />
    </DashboardLayout>
  );
}
