import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import EnterOTP from './pages/auth/EnterOTP';
import ResetPassword from './pages/auth/ResetPassword';
import ResetPasswordSuccess from './pages/auth/ResetPasswordSuccess';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import TicketDetailPage from './pages/admin/TicketDetailPage';
import Reports from './pages/admin/Reports';
import AccountanceEmployeeList from './pages/accountance/EmployeeList';
import AccountancePayroll from './pages/accountance/Payroll';
import AccountanceAttendance from './pages/accountance/Attendance';
import AccountancePlaceholder from './pages/accountance/Placeholder';
import AccountanceDebts from './pages/accountance/Debts';
import AccountanceFinance from './pages/accountance/Finance';
import AccountanceCreateForm from './pages/accountance/CreateForm';
import AccountanceMaterials from './pages/accountance/Materials';
import AccountancePayments from './pages/accountance/Payments';

import Inventory from './pages/admin/Inventory';

// Manager pages
import ManagerHome from './pages/manager/ManagerHome';
import ManagerServiceAdvisorHome from './pages/manager/ManagerServiceAdvisorHome';

import WarehouseHome from './pages/warehouse/WarehouseHome';
import WarehouseReport from './pages/warehouse/WarehouseReport';
import PartsList from './pages/warehouse/PartsList';
import ImportList from './pages/warehouse/ImportList';
import ImportRequest from './pages/warehouse/ImportRequest';
import CreateImportForm from './pages/warehouse/CreateImportForm';
import ExportList from './pages/warehouse/ExportList';
import ExportRequest from './pages/warehouse/ExportRequest';
import CreateExportForm from './pages/warehouse/CreateExportForm';
import CreateTicketForm from './pages/warehouse/CreateTicketForm';

// Component to redirect old /admin/orders/:id to new route
function AdminOrdersRedirect() {
  const { id } = useParams()
  return <Navigate to={`/service-advisor/orders/${id}`} replace />
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/enter-otp" element={<EnterOTP />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/reset-password-success" element={<ResetPasswordSuccess />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
        {/* Redirect old /admin routes to /service-advisor */}
        <Route path="/admin" element={<Navigate to="/service-advisor" replace />} />
        <Route path="/admin/appointments" element={<Navigate to="/service-advisor/appointments" replace />} />
        <Route path="/admin/orders" element={<Navigate to="/service-advisor/orders" replace />} />
        <Route path="/admin/orders/:id" element={<AdminOrdersRedirect />} />
        <Route path="/admin/inventory" element={<Navigate to="/service-advisor/inventory" replace />} />
        
        <Route path="/service-advisor" element={<Navigate to="/service-advisor/reports" replace />} />
        <Route path="/service-advisor/reports" element={<Reports />} />
        <Route path="/service-advisor/appointments" element={<AdminAppointments />} />
        <Route path="/service-advisor/orders" element={<TicketService />} />
        <Route path="/service-advisor/orders/history" element={<TicketService />} />
     
        <Route path="/service-advisor/orders/:id" element={<TicketDetailPage />} />
        <Route path="/service-advisor/inventory" element={<Inventory />} />
        <Route path="/warehouse" element={<WarehouseHome />} />
        <Route path="/warehouse/report" element={<WarehouseReport />} />
        <Route path="/warehouse/parts" element={<PartsList />} />
        <Route path="/warehouse/ticket/create" element={<CreateTicketForm />} />
        <Route path="/warehouse/import/list" element={<ImportList />} />
        <Route path="/warehouse/import/request" element={<ImportRequest />} />
        <Route path="/warehouse/import/create" element={<Navigate to="/warehouse/ticket/create" replace />} />
        <Route path="/warehouse/export/list" element={<ExportList />} />
        <Route path="/warehouse/export/request" element={<ExportRequest />} />
        <Route path="/warehouse/export/create" element={<Navigate to="/warehouse/ticket/create" replace />} />

        <Route path="/accountance" element={<AccountancePlaceholder title="Thống kê" />} />
        <Route path="/accountance/finance" element={<AccountanceFinance />} />
        <Route path="/accountance/hr/list" element={<AccountanceEmployeeList />} />
        <Route path="/accountance/hr/attendance" element={<AccountanceAttendance />} />
        <Route path="/accountance/hr/payroll" element={<AccountancePayroll />} />
        <Route path="/accountance/payments" element={<AccountancePayments />} />
        <Route path="/accountance/debts" element={<AccountanceDebts />} />
        <Route path="/accountance/inventory" element={<AccountanceMaterials />} />
        <Route path="/accountance/forms" element={<AccountanceCreateForm />} />

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerHome />} />
        <Route path="/manager/service-advisor" element={<ManagerServiceAdvisorHome />} />
        <Route path="/manager/service-advisor/appointments" element={<AdminAppointments />} />
        <Route path="/manager/service-advisor/orders" element={<TicketService />} />
        <Route path="/manager/service-advisor/orders/history" element={<TicketService />} />
        <Route path="/manager/service-advisor/orders/:id" element={<TicketDetailPage />} />
        <Route path="/manager/service-advisor/inventory" element={<Inventory />} />
        
        <Route path="/manager/warehouse" element={<WarehouseHome />} />
        <Route path="/manager/warehouse/report" element={<WarehouseReport />} />
        <Route path="/manager/warehouse/parts" element={<PartsList />} />
        <Route path="/manager/warehouse/import/list" element={<ImportList />} />
        <Route path="/manager/warehouse/import/request" element={<ImportRequest />} />
        <Route path="/manager/warehouse/import/create" element={<CreateImportForm />} />
        <Route path="/manager/warehouse/export/list" element={<ExportList />} />
        <Route path="/manager/warehouse/export/request" element={<ExportRequest />} />
        <Route path="/manager/warehouse/export/create" element={<CreateExportForm />} />

        <Route path="/manager/accountance" element={<AccountancePlaceholder title="Thống kê" />} />
        <Route path="/manager/accountance/finance" element={<AccountanceFinance />} />
        <Route path="/manager/accountance/hr/list" element={<AccountanceEmployeeList />} />
        <Route path="/manager/accountance/hr/attendance" element={<AccountanceAttendance />} />
        <Route path="/manager/accountance/hr/payroll" element={<AccountancePayroll />} />
        <Route path="/manager/accountance/payments" element={<AccountancePayments />} />
        <Route path="/manager/accountance/debts" element={<AccountanceDebts />} />
        <Route path="/manager/accountance/inventory" element={<AccountanceMaterials />} />
        <Route path="/manager/accountance/forms" element={<AccountanceCreateForm />} />

        <Route path="/manager/system" element={<AccountancePlaceholder title="Hệ thống" />} />
        <Route path="/manager/system/employees" element={<AccountancePlaceholder title="Quản lý nhân viên" />} />
        <Route path="/manager/system/settings" element={<AccountancePlaceholder title="Cài đặt" />} />
        <Route path="/manager/system/reports" element={<AccountancePlaceholder title="Báo cáo tổng hợp" />} />

      </Routes>
    </Router>
  );
}

export default App;

