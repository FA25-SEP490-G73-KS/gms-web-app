import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/home/about';
import ContactPage from './pages/home/contact';
import AppointmentService from './pages/customer/appointment/appointmentservice';
import BlogCardSkeleton from './components/blog/BlogCardSkeleton';

const Login = lazy(() => import('./pages/auth/Login'));
const BlogList = lazy(() => import('./pages/blog/BlogList'));
const BlogDetail = lazy(() => import('./pages/blog/BlogDetail'));

const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminAppointments = lazy(() => import('./pages/admin/AdminAppointments'));
const TicketService = lazy(() => import('./pages/admin/TicketService'));
const CreateTicket = lazy(() => import('./pages/admin/CreateTicket'));

const WarehouseHome = lazy(() => import('./pages/warehouse/WarehouseHome'));
const WarehouseReport = lazy(() => import('./pages/warehouse/WarehouseReport'));
const PartsList = lazy(() => import('./pages/warehouse/PartsList'));
const ImportList = lazy(() => import('./pages/warehouse/ImportList'));
const ImportRequest = lazy(() => import('./pages/warehouse/ImportRequest'));
const CreateImportForm = lazy(() => import('./pages/warehouse/CreateImportForm'));
const ExportList = lazy(() => import('./pages/warehouse/ExportList'));
const ExportRequest = lazy(() => import('./pages/warehouse/ExportRequest'));
const CreateExportForm = lazy(() => import('./pages/warehouse/CreateExportForm'));

function LoadingFallback() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div 
          style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1677ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} 
        />
        <p style={{ color: '#8c8c8c', margin: 0, fontSize: '14px' }}>Đang tải...</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function BlogLoadingFallback() {
  return (
    <div style={{ padding: '40px 5%', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ height: '40px', background: '#f0f0f0', borderRadius: '8px', marginBottom: '16px', maxWidth: '600px', margin: '0 auto 16px' }} />
        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '8px', maxWidth: '400px', margin: '0 auto' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
        {[1, 2, 3].map((i) => (
          <BlogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/login" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Login />
            </Suspense>
          } 
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/appointment" element={<AppointmentService />} />
        <Route 
          path="/blog" 
          element={
            <Suspense fallback={<BlogLoadingFallback />}>
              <BlogList />
            </Suspense>
          } 
        />
        <Route 
          path="/blog/:slug" 
          element={
            <Suspense fallback={<BlogLoadingFallback />}>
              <BlogDetail />
            </Suspense>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminHome />
            </Suspense>
          } 
        />
        <Route 
          path="/admin/appointments" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminAppointments />
            </Suspense>
          } 
        />
        <Route 
          path="/admin/orders" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <TicketService />
            </Suspense>
          } 
        />
        <Route 
          path="/admin/orders/create" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CreateTicket />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <WarehouseHome />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/report" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <WarehouseReport />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/parts" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PartsList />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/import/list" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ImportList />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/import/request" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ImportRequest />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/import/create" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CreateImportForm />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/export/list" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ExportList />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/export/request" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ExportRequest />
            </Suspense>
          } 
        />
        <Route 
          path="/warehouse/export/create" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CreateExportForm />
            </Suspense>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
