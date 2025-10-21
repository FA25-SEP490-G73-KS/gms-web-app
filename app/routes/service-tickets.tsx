import DashboardLayout from "../layouts/DashboardLayout";
import ServiceTicketList from "../components/serviceTickets/ServiceTicketList";

export function meta() {
  return [
    { title: "GMS • Phiếu dịch vụ" },
    { name: "description", content: "Danh sách phiếu dịch vụ • Garage Hoàng Tuấn" },
  ];
}

export default function ServiceTicketsRoute() {
  return (
    <DashboardLayout>
      <ServiceTicketList />
    </DashboardLayout>
  );
}
