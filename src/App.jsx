import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import CreateTicket from './pages/admin/CreateTicket';
import TicketDetailPage from './pages/admin/TicketDetailPage';

import Inventory from './pages/admin/Inventory';

import WarehouseHome from './pages/warehouse/WarehouseHome';
import WarehouseReport from './pages/warehouse/WarehouseReport';
import PartsList from './pages/warehouse/PartsList';
import ImportList from './pages/warehouse/ImportList';
import ImportRequest from './pages/warehouse/ImportRequest';
import CreateImportForm from './pages/warehouse/CreateImportForm';
import ExportList from './pages/warehouse/ExportList';
import ExportRequest from './pages/warehouse/ExportRequest';
import CreateExportForm from './pages/warehouse/CreateExportForm';

// Component to redirect old /admin/orders/:id to new route
function AdminOrdersRedirect() {
  const { id } = useParams()
  return <Navigate to={`/service-advisor/orders/${id}`} replace />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
        {/* Redirect old /admin routes to /service-advisor */}
        <Route path="/admin" element={<Navigate to="/service-advisor" replace />} />
        <Route path="/admin/appointments" element={<Navigate to="/service-advisor/appointments" replace />} />
        <Route path="/admin/orders" element={<Navigate to="/service-advisor/orders" replace />} />
        <Route path="/admin/orders/create" element={<Navigate to="/service-advisor/orders/create" replace />} />
        <Route path="/admin/orders/:id" element={<AdminOrdersRedirect />} />
        <Route path="/admin/inventory" element={<Navigate to="/service-advisor/inventory" replace />} />
        
        <Route path="/service-advisor" element={<AdminHome />} />
        <Route path="/service-advisor/appointments" element={<AdminAppointments />} />
        <Route path="/service-advisor/orders" element={<TicketService />} />
        <Route path="/service-advisor/orders/create" element={<CreateTicket />} />
        <Route path="/service-advisor/orders/history" element={<TicketService />} />
     
        <Route path="/service-advisor/orders/:id" element={<TicketDetailPage />} />
        <Route path="/service-advisor/inventory" element={<Inventory />} />
        <Route path="/warehouse" element={<WarehouseHome />} />
        <Route path="/warehouse/report" element={<WarehouseReport />} />
        <Route path="/warehouse/parts" element={<PartsList />} />
        <Route path="/warehouse/import/list" element={<ImportList />} />
        <Route path="/warehouse/import/request" element={<ImportRequest />} />
        <Route path="/warehouse/import/create" element={<CreateImportForm />} />
        <Route path="/warehouse/export/list" element={<ExportList />} />
        <Route path="/warehouse/export/request" element={<ExportRequest />} />
        <Route path="/warehouse/export/create" element={<CreateExportForm />} />

      </Routes>
    </Router>
  );
}

export default App;

