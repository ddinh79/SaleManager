import { jsx as _jsx } from "react/jsx-runtime";
import { LayoutDashboard, Users, Stethoscope, MessageSquare, Activity, CheckSquare, Briefcase, ShoppingCart, Bell, } from 'lucide-react';
export const menuConfig = [
    {
        label: 'MAIN',
        items: [
            { label: 'Dashboard (CEO)', path: '/dashboard/ceo', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), roles: ['Admin'] },
            { label: 'Dashboard', path: '/dashboard/manager', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), roles: ['SalesManager'] },
            { label: 'My Dashboard', path: '/dashboard/sales', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), roles: ['SalesMember'] },
            { label: 'Tasks', path: '/tasks', icon: _jsx(CheckSquare, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
            { label: 'Orders', path: '/orders', icon: _jsx(ShoppingCart, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
            { label: 'Deals', path: '/deals', icon: _jsx(Briefcase, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
            { label: 'Notifications', path: '/notifications', icon: _jsx(Bell, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
        ],
    },
    {
        label: 'SALES',
        items: [
            { label: 'Users', path: '/users', icon: _jsx(Users, { className: "w-5 h-5" }), roles: ['Admin'] },
            { label: 'Doctors', path: '/doctors', icon: _jsx(Stethoscope, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
            { label: 'Interactions', path: '/interactions', icon: _jsx(MessageSquare, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager'] },
            { label: 'Activities', path: '/activities', icon: _jsx(Activity, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
        ],
    },
];
export const getVisibleMenuItems = (userRole) => {
    return menuConfig.flatMap(section => section.items.filter(item => item.roles.includes(userRole)));
};
