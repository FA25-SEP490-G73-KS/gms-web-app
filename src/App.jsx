import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/appointment/appointmentservice';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
      </Routes>
    </Router>
  );
}

export default App;

