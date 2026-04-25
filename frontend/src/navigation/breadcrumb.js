import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
const routeNames = {
    '': 'Dashboard',
    'users': 'Users',
    'doctors': 'Doctors',
    'interactions': 'Interactions',
    'activities': 'Activities',
};
export function Breadcrumb() {
    const location = useLocation();
    const paths = location.pathname.split('/').filter(Boolean);
    return (_jsxs("nav", { className: "flex items-center gap-2 text-sm", children: [_jsx(Link, { to: "/", className: "text-gray-400 hover:text-gray-600", children: _jsx(Home, { className: "w-4 h-4" }) }), paths.map((path, index) => {
                const isLast = index === paths.length - 1;
                const routePath = '/' + paths.slice(0, index + 1).join('/');
                const label = routeNames[path] || path;
                return (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(ChevronRight, { className: "w-4 h-4 text-gray-300" }), isLast ? (_jsx("span", { className: "text-gray-900 font-medium", children: label })) : (_jsx(Link, { to: routePath, className: "text-gray-500 hover:text-gray-700", children: label }))] }, path));
            })] }));
}
