import { jsx as _jsx } from "react/jsx-runtime";
const roleStyles = {
    Admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    SalesManager: { label: 'Manager', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    SalesMember: { label: 'Sales', className: 'bg-green-100 text-green-800 border-green-200' },
};
const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
};
export function RoleBadge({ role, size = 'md' }) {
    const { label, className } = roleStyles[role];
    return (_jsx("span", { className: `inline-flex items-center font-medium rounded-full border ${className} ${sizeStyles[size]}`, children: label }));
}
