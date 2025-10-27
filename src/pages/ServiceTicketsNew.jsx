import DashboardLayout from '../layouts/DashboardLayout';
import ServiceTicketCreate from '../components/serviceTickets/ServiceTicketCreate';

export default function ServiceTicketsNew() {
  return (
    <DashboardLayout>
      <ServiceTicketCreate />
    </DashboardLayout>
  );
}

