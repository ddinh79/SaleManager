import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import notificationService from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';
const PRIORITY_COLORS = {
    Urgent: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Normal: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-gray-100 text-gray-600',
};
const NotificationSkeleton = () => (_jsx("div", { className: "px-4 py-4 border-b border-slate-100 animate-pulse", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-16 h-5 bg-slate-200 rounded" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-slate-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-slate-200 rounded w-1/2 mb-2" }), _jsx("div", { className: "h-3 bg-slate-200 rounded w-1/4" })] })] }) }));
const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('all');
    const pageSize = 20;
    const navigate = useNavigate();
    const topRef = useRef(null);
    const { markAsRead, markAllAsRead } = useNotificationStore();
    const loadNotifications = async (showLoading = true) => {
        if (showLoading)
            setLoading(true);
        setError(null);
        try {
            const res = await notificationService.getNotifications(page, pageSize, filter === 'unread');
            setNotifications(res.items);
            setTotal(res.total);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load notifications');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadNotifications();
    }, [page, filter]);
    const handleFilterChange = (f) => {
        setFilter(f);
        setPage(1);
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleMarkAsRead = async (notification) => {
        if (!notification.isRead) {
            await notificationService.markAsRead(notification.id);
            markAsRead(notification.id);
            setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
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
    };
    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto", ref: topRef, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-slate-800", children: "Notifications" }), _jsx("button", { onClick: handleMarkAllRead, className: "px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors", children: "Mark all as read" })] }), _jsx("div", { className: "flex gap-2 mb-6", children: ['all', 'unread'].map((f) => (_jsx("button", { onClick: () => handleFilterChange(f), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`, children: f === 'all' ? 'All' : 'Unread' }, f))) }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 flex-shrink-0" }), _jsx("p", { className: "text-sm text-red-700 flex-1", children: error }), _jsx("button", { onClick: () => loadNotifications(), className: "p-1 hover:bg-red-100 rounded", children: _jsx(RefreshCw, { className: "w-4 h-4 text-red-500" }) })] })), _jsx("div", { className: "bg-white rounded-xl shadow border border-slate-200 overflow-hidden", children: loading ? (_jsxs(_Fragment, { children: [_jsx(NotificationSkeleton, {}), _jsx(NotificationSkeleton, {}), _jsx(NotificationSkeleton, {})] })) : notifications.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Bell, { className: "w-12 h-12 text-slate-300 mx-auto mb-3" }), _jsx("p", { className: "text-slate-500", children: filter === 'unread' ? 'No unread notifications' : 'No notifications' })] })) : (_jsx(_Fragment, { children: notifications.map((notification) => (_jsx("div", { onClick: () => handleMarkAsRead(notification), className: `px-4 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`, children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("span", { className: `mt-0.5 px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`, children: notification.priority }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-800", children: notification.title }), !notification.isRead && (_jsx("span", { className: "w-2 h-2 bg-blue-500 rounded-full" }))] }), _jsx("p", { className: "text-sm text-slate-600 mt-0.5", children: notification.message }), _jsxs("div", { className: "flex items-center gap-3 mt-2", children: [_jsx("span", { className: "text-xs text-slate-400", children: formatDate(notification.createdAt) }), _jsx("span", { className: "text-xs text-slate-400", children: "\u2022" }), _jsx("span", { className: "text-xs text-slate-400 capitalize", children: notification.type })] })] })] }) }, notification.id))) })) }), total > pageSize && (_jsxs("div", { className: "flex items-center justify-center gap-4 mt-6", children: [_jsxs("span", { className: "text-sm text-slate-500", children: ["Showing ", ((page - 1) * pageSize) + 1, "-", Math.min(page * pageSize, total), " of ", total] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => { setPage((p) => Math.max(1, p - 1)); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }, disabled: page === 1, className: "px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50 hover:bg-slate-200", children: "Previous" }), _jsxs("span", { className: "text-sm text-slate-600", children: ["Page ", page, " of ", Math.ceil(total / pageSize)] }), _jsx("button", { onClick: () => { setPage((p) => p + 1); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }, disabled: page * pageSize >= total, className: "px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50 hover:bg-slate-200", children: "Next" })] })] }))] }));
};
const Notifications = NotificationsPage;
export { Notifications };
export default NotificationsPage;
