import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import CreateTicket from './pages/admin/CreateTicket';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
        {/* Admin */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
        <Route path="/admin/orders" element={<TicketService />} />
        <Route path="/admin/orders/create" element={<CreateTicket />} />
      </Routes>
    </Router>
  );
}

export default App;

