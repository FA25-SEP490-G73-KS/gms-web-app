import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import CreateTicket from './pages/admin/CreateTicket';
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

import AccountanceServices from './pages/accountance/Services';
import ManagerSuppliers from './pages/manager/Suppliers';
import ManagerCustomers from './pages/manager/Customers';
import ManagerCustomerStats from './pages/manager/CustomerStats';
import ManagerPromotions from './pages/manager/Promotions';
import CustomerDetailForManager from './pages/manager/CustomerDetail';
import SupplierForm from './pages/manager/SupplierForm';
import FinanceForManager from './pages/manager/accountance/Finance';
import PaymentsForManager from './pages/manager/accountance/Payments';
import DebtsForManager from './pages/manager/accountance/Debts';
import EmployeeListForManager from './pages/manager/accountance/EmployeeList';
import AttendanceForManager from './pages/manager/accountance/Attendance';
import PayrollForManager from './pages/manager/accountance/Payroll';
import ManagerServiceAdvisorHome from './pages/manager/ManagerServiceAdvisorHome';
import ManagerServiceOrders from './pages/manager/service/ServiceOrders';
import ManagerServiceTypes from './pages/manager/service/ServiceTypes';
import Inventory from './pages/admin/Inventory';
import ManagerHome from './pages/manager/ManagerHome';

import WarehouseHome from './pages/warehouse/WarehouseHome';
import WarehouseReport from './pages/warehouse/WarehouseReport';
import PartsList from './pages/warehouse/PartsList';
import ImportList from './pages/warehouse/ImportList';
import ImportRequest from './pages/warehouse/ImportRequest';
import CreateImportForm from './pages/warehouse/CreateImportForm';
import ExportList from './pages/warehouse/ExportList';
import ExportRequest from './pages/warehouse/ExportRequest';
import CreateExportForm from './pages/warehouse/CreateExportForm';


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
        <Route path="/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/change-password" element={<ChangePassword />} />
        {/* Redirect old /admin routes to /service-advisor */}
        <Route path="/admin" element={<Navigate to="/service-advisor" replace />} />
        <Route path="/admin/appointments" element={<Navigate to="/service-advisor/appointments" replace />} />
        <Route path="/admin/orders" element={<Navigate to="/service-advisor/orders" replace />} />
        <Route path="/admin/orders/create" element={<Navigate to="/service-advisor/orders/create" replace />} />
        <Route path="/admin/orders/:id" element={<AdminOrdersRedirect />} />
        <Route path="/admin/inventory" element={<Navigate to="/service-advisor/inventory" replace />} />
        
        <Route path="/service-advisor" element={<Navigate to="/service-advisor/reports" replace />} />
        <Route path="/service-advisor/reports" element={<Reports />} />
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
        <Route path="/accountance/services" element={<AccountanceServices />} />

        {/* Manager Routes */}
        <Route path="/manager" element={<ManagerHome />} />
        
        {/* Manager - Thu - chi */}
        <Route path="/manager/accountance/finance" element={<FinanceForManager />} />
        <Route path="/manager/accountance/payments" element={<PaymentsForManager />} />
        
        {/* Manager - Công nợ */}
        <Route path="/manager/accountance/debts" element={<DebtsForManager />} />
        
        {/* Manager - Nhân sự */}
        <Route path="/manager/accountance/hr/list" element={<EmployeeListForManager />} />
        <Route path="/manager/accountance/hr/attendance" element={<AttendanceForManager />} />
        <Route path="/manager/accountance/hr/payroll" element={<PayrollForManager />} />
        
        {/* Manager - Khách hàng */}
        <Route path="/manager/customers" element={<ManagerCustomers />} />
        <Route path="/manager/customers/:id" element={<CustomerDetailForManager />} />
        <Route path="/manager/customers/stats" element={<ManagerCustomerStats />} />
        
        {/* Manager - Dịch vụ */}
        <Route path="/manager/service" element={<ManagerServiceAdvisorHome />} />
        <Route path="/manager/service/orders" element={<ManagerServiceOrders />} />
        <Route path="/manager/service/orders/:id" element={<TicketDetailPage />} />
        <Route path="/manager/service/types" element={<ManagerServiceTypes />} />
        
        {/* Manager - Khuyến mãi */}
        <Route path="/manager/promotions" element={<ManagerPromotions />} />
        
        {/* Manager - Nhà cung cấp */}
        <Route path="/manager/suppliers" element={<ManagerSuppliers />} />
        <Route path="/manager/suppliers/create" element={<SupplierForm />} />
        <Route path="/manager/suppliers/:id/edit" element={<SupplierForm />} />

        <Route path="/manager/system" element={<AccountancePlaceholder title="Hệ thống" />} />
        <Route path="/manager/system/employees" element={<AccountancePlaceholder title="Quản lý nhân viên" />} />
        <Route path="/manager/system/settings" element={<AccountancePlaceholder title="Cài đặt" />} />
        <Route path="/manager/system/reports" element={<AccountancePlaceholder title="Báo cáo tổng hợp" />} />



      </Routes>
    </Router>
  );
}

export default App;

