import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Appointments from './pages/Appointments';
import ServiceTickets from './pages/ServiceTickets';
import ServiceTicketsNew from './pages/ServiceTicketsNew';
import MyAppointments from './pages/MyAppointments';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/service-tickets" element={<ServiceTickets />} />
        <Route path="/service-tickets-new" element={<ServiceTicketsNew />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
      </Routes>
    </Router>
  );
}

export default App;

