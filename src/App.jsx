import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ProtectedRoute from './components/common/ProtectedRoute';
import { USER_ROLES } from './utils/constants';
import NotFound from './pages/error/NotFound';
import Forbidden from './pages/error/Forbidden';
import useWebSocketStore from './store/websocketStore';
import useAuthStore from './store/authStore';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import BlogList from './pages/blog/BlogList';
import BlogDetail from './pages/blog/BlogDetail';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ChangePassword from './pages/auth/ChangePassword';
import Profile from './pages/auth/Profile';
import AdminHome from './pages/admin/AdminHome';
import AdminAppointments from './pages/admin/AdminAppointments';
import TicketService from './pages/admin/TicketService';
import CreateTicket from './pages/admin/CreateTicket';
import CreateTicketNewCustomer from './pages/admin/CreateTicketNewCustomer';
import TicketDetailPage from './pages/admin/TicketDetailPage';
import Reports from './pages/admin/Reports';
import AccountanceEmployeeList from './pages/accountance/EmployeeList';
import AccountancePayroll from './pages/accountance/Payroll';
import PayrollDetailPage from './pages/accountance/PayrollDetailPage';
import AccountanceAttendance from './pages/accountance/Attendance';
import AccountancePlaceholder from './pages/accountance/Placeholder';
import AccountanceDebts from './pages/accountance/Debts';
import AccountanceDebtDetail from './pages/accountance/DebtDetail';
import AccountanceDebtTicketDetail from './pages/accountance/DebtTicketDetail';
import AccountanceFinance from './pages/accountance/Finance';
import AccountanceCreateForm from './pages/accountance/CreateForm';
import AccountanceMaterials from './pages/accountance/Materials';   
import AccountancePayments from './pages/accountance/Payments';
import InvoiceDetailPage from './pages/accountance/InvoiceDetailPage';

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
import ManagerTicketDetailPage from './pages/manager/service/ManagerTicketDetailPage';
import ManagerImportRequest from './pages/manager/warehouse/ImportRequest';
import ManagerImportRequestDetail from './pages/manager/warehouse/ImportRequestDetail';
import Inventory from './pages/admin/Inventory';
import AdminCustomers from './pages/admin/Customers';
import ManagerHome from './pages/manager/ManagerHome';

import WarehouseHome from './pages/warehouse/WarehouseHome';
import WarehouseReport from './pages/warehouse/WarehouseReport';
import PartsList from './pages/warehouse/PartsList';
import ImportList from './pages/warehouse/ImportList';
import ImportDetail from './pages/warehouse/ImportDetail';
import ImportRequest from './pages/warehouse/ImportRequest';
import CreateImportForm from './pages/warehouse/CreateImportForm';
import ExportList from './pages/warehouse/ExportList';
import ExportParts from './pages/warehouse/ExportParts';
import ExportRequest from './pages/warehouse/ExportRequest';
import CreateExportForm from './pages/warehouse/CreateExportForm';
import ExportDetail from './pages/warehouse/ExportDetail';
import CreateTicketWarehouse from './pages/warehouse/CreateTicket';
import WebSocketTest from './pages/test/WebSocketTest';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
  
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  return null;
}

function AdminOrdersRedirect() {
  const { id } = useParams()
  return <Navigate to={`/service-advisor/orders/${id}`} replace />
}

function App() {
  const { user, initialize } = useAuthStore();
  const { connect, disconnect, isConnected } = useWebSocketStore();
  
  // Initialize auth store on app load (refresh token if available)
  useEffect(() => {
    console.log('[App] Initializing auth store...');
    initialize().then(() => {
      console.log('[App] Auth store initialized');
    });
  }, [initialize]);
  
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      if (!user) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/appointment" element={<AppointmentService />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/change-password" element={<ChangePassword />} />
        <Route path="/auth/profile" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SERVICE_ADVISOR, USER_ROLES.MANAGER, USER_ROLES.ACCOUNTANT, USER_ROLES.WAREHOUSE]}>
            <Profile />
          </ProtectedRoute>
        } />
        
        
        <Route path="/404" element={<NotFound />} />
        <Route path="/403" element={<Forbidden />} />
        
        <Route path="/test/websocket" element={<WebSocketTest />} />
       
        <Route path="/admin" element={<Navigate to="/service-advisor" replace />} />
        <Route path="/admin/appointments" element={<Navigate to="/service-advisor/appointments" replace />} />
        <Route path="/admin/orders" element={<Navigate to="/service-advisor/orders" replace />} />
        <Route path="/admin/orders/create" element={<Navigate to="/service-advisor/orders/create" replace />} />
        <Route path="/admin/orders/:id" element={<AdminOrdersRedirect />} />
        <Route path="/admin/orders/new-customer" element={<Navigate to="/service-advisor/orders/new-customer" replace />} />
        <Route path="/admin/inventory" element={<Navigate to="/service-advisor/inventory" replace />} />
        
        
        <Route path="/service-advisor" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <Navigate to="/service-advisor/reports" replace />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/reports" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/appointments" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <AdminAppointments />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/orders" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <TicketService />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/orders/create" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <CreateTicket />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/orders/new-customer" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <CreateTicketNewCustomer />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/orders/history" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <TicketService />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/orders/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <TicketDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/inventory" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SERVICE_ADVISOR]}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/service-advisor/customers" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.SERVICE_ADVISOR]}>
            <AdminCustomers />
          </ProtectedRoute>
        } />
        {/* Warehouse Routes - Protected */}
        <Route path="/warehouse" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <WarehouseHome />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/report" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <WarehouseReport />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/parts" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <PartsList />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/import/list" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ImportList />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/import-list/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ImportDetail />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/import/request" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ImportRequest />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/import/create" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <CreateImportForm />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/export/list" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ExportList />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/export/list/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ExportDetail />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/export/request" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ExportRequest />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/export/create" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <ExportParts />
          </ProtectedRoute>
        } />
        <Route path="/warehouse/create-ticket" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAREHOUSE]}>
            <CreateTicketWarehouse />
          </ProtectedRoute>
        } />

        {/* Accountant Routes - Protected */}
        <Route path="/accountance" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountancePlaceholder title="Thống kê" />
          </ProtectedRoute>
        } />
        <Route path="/accountance/finance" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceFinance />
          </ProtectedRoute>
        } />
        <Route path="/accountance/hr/list" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceEmployeeList />
          </ProtectedRoute>
        } />
        <Route path="/accountance/hr/attendance" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceAttendance />
          </ProtectedRoute>
        } />
        <Route path="/accountance/hr/payroll" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountancePayroll />
          </ProtectedRoute>
        } />
        <Route path="/accountance/hr/payroll/:employeeId/:month/:year" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <PayrollDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/accountance/payments" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountancePayments />
          </ProtectedRoute>
        } />
        <Route path="/accountance/payments/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <InvoiceDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/accountance/debts" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceDebts />
          </ProtectedRoute>
        } />
        <Route path="/accountance/debts/detail" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceDebtDetail />
          </ProtectedRoute>
        } />
        <Route path="/accountance/debts/ticket/:ticketId" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceDebtTicketDetail />
          </ProtectedRoute>
        } />
        <Route path="/accountance/inventory" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceMaterials />
          </ProtectedRoute>
        } />
        <Route path="/accountance/forms" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceCreateForm />
          </ProtectedRoute>
        } />
        <Route path="/accountance/services" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ACCOUNTANT]}>
            <AccountanceServices />
          </ProtectedRoute>
        } />

        {/* Manager Routes - Protected */}
        <Route path="/manager" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerHome />
          </ProtectedRoute>
        } />
        
        {/* Manager - Thu - chi */}
        <Route path="/manager/accountance/finance" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <FinanceForManager />
          </ProtectedRoute>
        } />
        <Route path="/manager/accountance/payments" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <PaymentsForManager />
          </ProtectedRoute>
        } />
        
        {/* Manager - Công nợ */}
        <Route path="/manager/accountance/debts" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <DebtsForManager />
          </ProtectedRoute>
        } />
        
        {/* Manager - Nhân sự */}
        <Route path="/manager/accountance/hr/list" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <EmployeeListForManager />
          </ProtectedRoute>
        } />
        <Route path="/manager/accountance/hr/attendance" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <AttendanceForManager />
          </ProtectedRoute>
        } />
        <Route path="/manager/accountance/hr/payroll" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <PayrollForManager />
          </ProtectedRoute>
        } />
        
        {/* Manager - Khách hàng */}
        <Route path="/manager/customers" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerCustomers />
          </ProtectedRoute>
        } />
        <Route path="/manager/customers/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <CustomerDetailForManager />
          </ProtectedRoute>
        } />
        <Route path="/manager/customers/stats" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerCustomerStats />
          </ProtectedRoute>
        } />
        
        {/* Manager - Dịch vụ */}
        <Route path="/manager/service" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerServiceAdvisorHome />
          </ProtectedRoute>
        } />
        <Route path="/manager/service/orders" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerServiceOrders />
          </ProtectedRoute>
        } />
        <Route path="/manager/service/orders/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerTicketDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/manager/service/types" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerServiceTypes />
          </ProtectedRoute>
        } />
        
        {/* Manager - Khuyến mãi */}
        <Route path="/manager/promotions" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerPromotions />
          </ProtectedRoute>
        } />
        
        {/* Manager - Nhà cung cấp */}
        <Route path="/manager/suppliers" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerSuppliers />
          </ProtectedRoute>
        } />
        <Route path="/manager/suppliers/create" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <SupplierForm />
          </ProtectedRoute>
        } />
        <Route path="/manager/suppliers/:id/edit" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <SupplierForm />
          </ProtectedRoute>
        } />

        {/* Manager - Kho */}
        <Route path="/manager/warehouse/import-request" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerImportRequest />
          </ProtectedRoute>
        } />

        <Route path="/manager/warehouse/import-request/:id" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <ManagerImportRequestDetail />
          </ProtectedRoute>
        } />

        <Route path="/manager/system" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <AccountancePlaceholder title="Hệ thống" />
          </ProtectedRoute>
        } />
        <Route path="/manager/system/employees" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <AccountancePlaceholder title="Quản lý nhân viên" />
          </ProtectedRoute>
        } />
        <Route path="/manager/system/settings" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <AccountancePlaceholder title="Cài đặt" />
          </ProtectedRoute>
        } />
        <Route path="/manager/system/reports" element={
          <ProtectedRoute allowedRoles={[USER_ROLES.MANAGER]}>
            <AccountancePlaceholder title="Báo cáo tổng hợp" />
          </ProtectedRoute>
        } />
        
        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />



      </Routes>
    </Router>
  );
}

export default App;

