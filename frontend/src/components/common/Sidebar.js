import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, User } from 'lucide-react';
const menuItems = [
    { label: 'Dashboard', path: '/', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }) },
    { label: 'Users', path: '/users', icon: _jsx(User, { className: "w-5 h-5" }) },
    { label: 'Doctors', path: '/doctors', icon: _jsx(Users, { className: "w-5 h-5" }) },
    { label: 'Hospitals', path: '/hospitals', icon: _jsx(Building2, { className: "w-5 h-5" }) },
];
export const Sidebar = ({ className = '' }) => {
    const location = useLocation();
    return (_jsxs("div", { className: `w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col ${className}`, children: [_jsx("div", { className: "px-6 py-4 border-b border-slate-200", children: _jsx("h1", { className: "text-xl font-bold text-blue-600", children: "Sales System" }) }), _jsx("nav", { className: "flex-1 p-4", children: _jsx("ul", { className: "space-y-1", children: menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (_jsx("li", { children: _jsxs(Link, { to: item.path, className: `
                    flex items-center gap-3 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-700 hover:bg-slate-100'}
                  `, children: [item.icon, _jsx("span", { className: "font-medium", children: item.label })] }) }, item.path));
                    }) }) })] }));
};
