import DashboardLayout from '../layouts/DashboardLayout';
import ServiceTicketList from '../components/serviceTickets/ServiceTicketList';

export default function ServiceTickets() {
  return (
    <DashboardLayout>
      <ServiceTicketList />
    </DashboardLayout>
  );
}

