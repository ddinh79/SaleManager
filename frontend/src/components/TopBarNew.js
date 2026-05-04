import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search, LogOut } from 'lucide-react';
import { Breadcrumb } from '../navigation/breadcrumb';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';
import { useNotificationSignalR } from '../hooks/useNotificationSignalR';
export const TopBarNew = () => {
    const openSearchModal = useUiStore((state) => state.openSearchModal);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    useNotificationSignalR();
    return (_jsxs("header", { className: "h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6", children: [_jsx(Breadcrumb, {}), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: openSearchModal, className: "flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200", children: [_jsx(Search, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs text-slate-400", children: "Ctrl+K" })] }), _jsx(NotificationBell, {}), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-sm font-medium text-white", children: user?.fullName?.charAt(0).toUpperCase() ?? 'U' }) }), _jsxs("div", { className: "hidden sm:block", children: [_jsx("p", { className: "text-sm font-medium text-slate-700", children: user?.fullName ?? 'User' }), _jsx("p", { className: "text-xs text-slate-500", children: user?.role ?? '' })] }), _jsx("button", { onClick: logout, className: "p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors", title: "Logout", children: _jsx(LogOut, { className: "w-4 h-4" }) })] })] })] }));
};
