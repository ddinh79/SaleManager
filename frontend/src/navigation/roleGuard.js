import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAuthStore } from '../store/authStore';
export function RoleGuard({ children, roles }) {
    const hasRole = useAuthStore(state => state.hasRole);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    if (!isAuthenticated) {
        return null;
    }
    if (roles && !hasRole(roles)) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Access Denied" }), _jsx("p", { className: "text-gray-500 mt-2", children: "You don't have permission to view this page." })] }) }));
    }
    return _jsx(_Fragment, { children: children });
}
