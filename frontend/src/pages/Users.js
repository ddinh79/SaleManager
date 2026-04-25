import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { userService } from '../services/userService';
import { RoleBadge } from '../components/common/RoleBadge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { useNavigate } from 'react-router-dom';
export function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    useEffect(() => {
        loadUsers();
    }, [roleFilter, statusFilter]);
    const loadUsers = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (roleFilter)
                filters.role = roleFilter;
            if (statusFilter)
                filters.status = statusFilter;
            const data = await userService.getAll(filters);
            setUsers(data);
        }
        catch (error) {
            console.error('Failed to load users:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredUsers = users.filter(user => user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase()));
    const columns = [
        {
            key: 'user',
            header: 'User',
            render: (user) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium text-slate-500", children: user.fullName[0] }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-slate-900", children: user.fullName }), _jsx("p", { className: "text-xs text-slate-500", children: user.email })] })] })),
        },
        { key: 'role', header: 'Role', render: (user) => _jsx(RoleBadge, { role: user.role, size: "sm" }) },
        { key: 'manager', header: 'Manager', render: (user) => user.managerName || '-' },
        {
            key: 'status',
            header: 'Status',
            render: (user) => (_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`, children: user.isActive ? 'Active' : 'Inactive' })),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (user) => (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/users/${user.id}`), children: "View" })),
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Users" }), _jsx("p", { className: "text-slate-500", children: "Manage your team members" })] }), _jsxs(Button, { onClick: () => { }, children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Add User"] })] }), _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsx("div", { className: "flex-1 min-w-[200px]", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx(Input, { placeholder: "Search users...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })] }) }), _jsx(Select, { options: [
                                { value: '', label: 'All Roles' },
                                { value: 'Admin', label: 'Admin' },
                                { value: 'SalesManager', label: 'Manager' },
                                { value: 'SalesMember', label: 'Sales' },
                            ], value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), className: "w-40" }), _jsx(Select, { options: [
                                { value: '', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ], value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "w-32" })] }) }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: filteredUsers, emptyMessage: "No users found" }) })] }));
}
