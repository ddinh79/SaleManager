import { jsx as _jsx } from "react/jsx-runtime";
import { LayoutDashboard, Users, Stethoscope, MessageSquare, Activity, } from 'lucide-react';
export const menuConfig = [
    {
        label: 'MAIN',
        items: [
            { label: 'Dashboard', path: '/', icon: _jsx(LayoutDashboard, { className: "w-5 h-5" }), roles: ['Admin', 'SalesManager', 'SalesMember'] },
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
