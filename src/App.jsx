import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HelpdeskDashboard from './pages/HelpdeskDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  
  if (!user) return <LandingPage />;
  
  const map = {
    admin: '/admin',
    helpdesk_officer: '/helpdesk',
    officer: '/officer',
    employee: '/employee',
  };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

// 🎯 මේකෙන් අපි ලොගින් සහ රෙජිස්ටර් පිටු හඳුනාගන්නවා
const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/' || location.pathname === '/landingpage';
  const isAdminPage = location.pathname === '/admin';

  return (
    <>
      <Navbar />
      
      {/* ලොගින්/රෙජිස්ටර් පිටු නම් app-container එකේ padding ඕන නෑ */}
      <div className={isAuthPage || isLandingPage || isAdminPage ? "" : "app-container"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/employee" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/helpdesk" element={<ProtectedRoute allowedRoles={['helpdesk_officer']}><HelpdeskDashboard /></ProtectedRoute>} />
          <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;