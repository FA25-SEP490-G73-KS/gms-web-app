import DashboardLayout from '../layouts/DashboardLayout';
import ServiceTicketCreate from '../components/serviceTickets/ServiceTicketCreate';
import ServiceDetailPage from "../components/serviceTickets/ServiceDetailPage.jsx";

export default function ServiceTicketsNew() {
    return (
        <DashboardLayout>
            <ServiceDetailPage />
        </DashboardLayout>
    );
}

