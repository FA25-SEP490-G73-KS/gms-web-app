import DashboardLayout from "../layouts/DashboardLayout";
import ServiceTicketCreate from "../components/serviceTickets/ServiceTicketCreate";

export function meta() {
  return [
    { title: "GMS • Tạo phiếu dịch vụ" },
    { name: "description", content: "Tạo phiếu dịch vụ • Garage Hoàng Tuấn" },
  ];
}

export default function ServiceTicketCreateRoute() {
  return (
    <DashboardLayout>
      <ServiceTicketCreate />
    </DashboardLayout>
  );
}
