import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Appointments from './pages/Appointments';
import ServiceTickets from './pages/ServiceTickets';
import ServiceTicketsNew from './pages/ServiceTicketsNew';
import MyAppointments from './pages/MyAppointments';
import ServiceDetailPage from "./pages/ServiceDetailPage"
import OtpAppointmentsPage from "@/pages/OtpAppointmentsPage.jsx";

// import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/service-tickets" element={<ServiceTickets />} />
        <Route path="/service-tickets-new" element={<ServiceTicketsNew />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/service-detail" element={<ServiceDetailPage />} />
          <Route path="/otp-appointments" element={<OtpAppointmentsPage />} />

      </Routes>
    </Router>
  );
}

export default App;

