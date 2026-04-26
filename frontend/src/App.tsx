import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';

// Lazy load pages - use .then to handle named exports
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CEODashboard = lazy(() => import('./pages/CEODashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const SalesDashboard = lazy(() => import('./pages/SalesDashboard'));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const UserDetail = lazy(() => import('./pages/UserDetail').then(m => ({ default: m.UserDetail })));
const Doctors = lazy(() => import('./pages/Doctors').then(m => ({ default: m.Doctors })));
const DoctorDetail = lazy(() => import('./pages/DoctorDetail').then(m => ({ default: m.DoctorDetail })));
const Hospitals = lazy(() => import('./pages/Hospitals').then(m => ({ default: m.Hospitals })));
const Deals = lazy(() => import('./pages/Deals').then(m => ({ default: m.Deals })));
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Interactions = lazy(() => import('./pages/Interactions').then(m => ({ default: m.Interactions })));
const Activities = lazy(() => import('./pages/Activities').then(m => ({ default: m.Activities })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.Unauthorized })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Loading fallback spinner
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
  </div>
);

// Dashboard router - redirects to role-specific dashboard
const DashboardRouter: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;
    // Redirect is handled in the Route component
  }, [user]);

  if (!user) return <LoadingFallback />;

  switch (user.role) {
    case 'Admin':
      return <Navigate to="/dashboard/ceo" replace />;
    case 'SalesManager':
      return <Navigate to="/dashboard/manager" replace />;
    case 'SalesMember':
      return <Navigate to="/dashboard/sales" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

// ProtectedRoute with roles check
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasRole = useAuthStore((state) => state.hasRole);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="dashboard/ceo" element={<CEODashboard />} />
            <Route path="dashboard/manager" element={<ManagerDashboard />} />
            <Route path="dashboard/sales" element={<SalesDashboard />} />
            <Route
              path="users"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <ProtectedRoute roles={['Admin']}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetail />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="deals" element={<Deals />} />
            <Route path="orders" element={<Orders />} />
            <Route
              path="interactions"
              element={
                <ProtectedRoute roles={['Admin', 'SalesManager']}>
                  <Interactions />
                </ProtectedRoute>
              }
            />
            <Route path="activities" element={<Activities />} />
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;