import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Settings, LogOut, ChevronRight } from 'lucide-react';
const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctors', label: 'Doctors', icon: Users },
    { path: '/hospitals', label: 'Hospitals', icon: Building2 },
    { path: '/settings', label: 'Settings', icon: Settings },
];
export const Sidebar = ({ className = '' }) => {
    return (_jsxs("aside", { className: `w-60 bg-white border-r border-slate-200 flex flex-col h-full ${className}`, children: [_jsx("div", { className: "p-6 border-b border-slate-200", children: _jsx("h1", { className: "text-xl font-bold text-blue-600", children: "SaleManager" }) }), _jsx("nav", { className: "flex-1 p-4 space-y-1", children: menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (_jsxs(Link, { to: item.path, className: `
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'}
              `, children: [_jsx(item.icon, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: item.label }), isActive && _jsx(ChevronRight, { className: "w-4 h-4 ml-auto" })] }, item.path));
                }) }), _jsx("div", { className: "p-4 border-t border-slate-200", children: _jsxs("button", { className: "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-50 w-full transition-colors", children: [_jsx(LogOut, { className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: "Logout" })] }) })] }));
};
