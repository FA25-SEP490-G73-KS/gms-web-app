import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import CreateTicket from './pages/admin/CreateTicket';
import WarehouseHome from './pages/warehouse/WarehouseHome';
<<<<<<< Updated upstream
import WarehouseReport from './pages/warehouse/WarehouseReport';
import PartsList from './pages/warehouse/PartsList';
import ImportList from './pages/warehouse/ImportList';
import ImportRequest from './pages/warehouse/ImportRequest';
import CreateImportForm from './pages/warehouse/CreateImportForm';
import ExportList from './pages/warehouse/ExportList';
import ExportRequest from './pages/warehouse/ExportRequest';
import CreateExportForm from './pages/warehouse/CreateExportForm';
=======
import ExportRequest from './pages/warehouse/ExportRequest';
>>>>>>> Stashed changes

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/orders" element={<TicketService />} />
        <Route path="/admin/orders/create" element={<CreateTicket />} />
        <Route path="/warehouse" element={<WarehouseHome />} />
<<<<<<< Updated upstream
        <Route path="/warehouse/report" element={<WarehouseReport />} />
        <Route path="/warehouse/parts" element={<PartsList />} />
        <Route path="/warehouse/import/list" element={<ImportList />} />
        <Route path="/warehouse/import/request" element={<ImportRequest />} />
        <Route path="/warehouse/import/create" element={<CreateImportForm />} />
        <Route path="/warehouse/export/list" element={<ExportList />} />
        <Route path="/warehouse/export/request" element={<ExportRequest />} />
        <Route path="/warehouse/export/create" element={<CreateExportForm />} />
=======
        <Route path="/warehouse/export/request" element={<ExportRequest />} />
>>>>>>> Stashed changes
      </Routes>
    </Router>
  );
}

export default App;

