import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Bell } from 'lucide-react';
import notificationService from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
const PRIORITY_COLORS = {
    Urgent: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Normal: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-gray-100 text-gray-600',
};
const DropdownSkeleton = () => (_jsx("div", { className: "p-4 space-y-3", children: [1, 2, 3].map((i) => (_jsxs("div", { className: "flex items-start gap-3 animate-pulse", children: [_jsx("div", { className: "w-12 h-4 bg-slate-200 rounded" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-slate-200 rounded w-3/4 mb-1" }), _jsx("div", { className: "h-3 bg-slate-200 rounded w-1/2" })] })] }, i))) }));
const NotificationDropdown = ({ onClose, isOpen }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const storeNotifications = useNotificationStore((state) => state.notifications);
    const { markAsRead, markAllAsRead, setNotifications } = useNotificationStore();
    // Refetch when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setError(null);
            notificationService.getNotifications(1, 20, false)
                .then((res) => {
                setNotifications(res.items);
                setLoading(false);
            })
                .catch((err) => {
                setError(err instanceof Error ? err.message : 'Failed to load');
                setLoading(false);
            });
        }
    }, [isOpen, setNotifications]);
    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await notificationService.markAsRead(notification.id);
            markAsRead(notification.id);
        }
        if (notification.referenceType === 'Deal' && notification.referenceId) {
            navigate(`/deals/${notification.referenceId}`);
        }
        else if (notification.referenceType === 'Doctor' && notification.referenceId) {
            navigate(`/doctors/${notification.referenceId}`);
        }
        else if (notification.referenceType === 'User' && notification.referenceId) {
            navigate(`/users/${notification.referenceId}`);
        }
        else {
            navigate('/notifications');
        }
        onClose();
    };
    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        markAllAsRead();
    };
    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1)
            return 'just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };
    return (_jsxs("div", { className: "absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-slate-100", children: [_jsx("h3", { className: "font-semibold text-slate-800", children: "Notifications" }), _jsx("button", { onClick: handleMarkAllRead, className: "text-xs text-indigo-600 hover:text-indigo-700", children: "Mark all read" })] }), _jsx("div", { className: "max-h-96 overflow-y-auto", children: error ? (_jsxs("div", { className: "p-4 flex items-center gap-2 text-red-600", children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0" }), _jsx("span", { className: "text-sm flex-1", children: error }), _jsx("button", { onClick: () => setLoading(true), className: "p-1 hover:bg-red-50 rounded", children: _jsx(RefreshCw, { className: "w-4 h-4" }) })] })) : loading ? (_jsx(DropdownSkeleton, {})) : storeNotifications.length === 0 ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx(Bell, { className: "w-8 h-8 text-slate-300 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-slate-500", children: "No notifications" })] })) : (storeNotifications.slice(0, 10).map((notification) => (_jsx("div", { onClick: () => handleNotificationClick(notification), className: `px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: `mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`, children: notification.priority?.toUpperCase() || 'NORMAL' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-slate-800 truncate", children: notification.title }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5 line-clamp-2", children: notification.message }), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: formatTime(notification.createdAt) })] }), !notification.isRead && (_jsx("span", { className: "w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" }))] }) }, notification.id)))) }), _jsx("div", { onClick: () => { navigate('/notifications'); onClose(); }, className: "px-4 py-3 text-center text-sm text-indigo-600 hover:bg-slate-50 cursor-pointer border-t border-slate-100", children: "View all notifications" })] }));
};
export default NotificationDropdown;
