import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { useAuthStore } from './store/authStore';
// Lazy load pages - use .then to handle named exports
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const UserDetail = lazy(() => import('./pages/UserDetail').then(m => ({ default: m.UserDetail })));
const Doctors = lazy(() => import('./pages/Doctors').then(m => ({ default: m.Doctors })));
const DoctorDetail = lazy(() => import('./pages/DoctorDetail').then(m => ({ default: m.DoctorDetail })));
const Hospitals = lazy(() => import('./pages/Hospitals').then(m => ({ default: m.Hospitals })));
const Interactions = lazy(() => import('./pages/Interactions').then(m => ({ default: m.Interactions })));
const Activities = lazy(() => import('./pages/Activities').then(m => ({ default: m.Activities })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.Unauthorized })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
// Loading fallback spinner
const LoadingFallback = () => (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700" }) }));
const ProtectedRoute = ({ children, roles }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasRole = useAuthStore((state) => state.hasRole);
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (roles && !hasRole(roles)) {
        return _jsx(Navigate, { to: "/unauthorized", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
function App() {
    return (_jsx(BrowserRouter, { children: _jsx(Suspense, { fallback: _jsx(LoadingFallback, {}), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(MainLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "users", element: _jsx(ProtectedRoute, { roles: ['Admin'], children: _jsx(Users, {}) }) }), _jsx(Route, { path: "users/:id", element: _jsx(ProtectedRoute, { roles: ['Admin'], children: _jsx(UserDetail, {}) }) }), _jsx(Route, { path: "doctors", element: _jsx(Doctors, {}) }), _jsx(Route, { path: "doctors/:id", element: _jsx(DoctorDetail, {}) }), _jsx(Route, { path: "hospitals", element: _jsx(Hospitals, {}) }), _jsx(Route, { path: "interactions", element: _jsx(ProtectedRoute, { roles: ['Admin', 'SalesManager'], children: _jsx(Interactions, {}) }) }), _jsx(Route, { path: "activities", element: _jsx(Activities, {}) })] }), _jsx(Route, { path: "/unauthorized", element: _jsx(Unauthorized, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFound, {}) })] }) }) }));
}
export default App;
