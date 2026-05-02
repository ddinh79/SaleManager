import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import notificationService from '../services/notificationService';
import { useNotificationStore } from '../store/notificationStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const NotificationSkeleton = () => (
  <div className="px-4 py-4 border-b border-slate-100 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-5 bg-slate-200 rounded" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const pageSize = 20;
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  const { markAsRead, markAllAsRead } = useNotificationStore();

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications(page, pageSize, filter === 'unread');
      setNotifications(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, filter]);

  const handleFilterChange = (f: 'all' | 'unread') => {
    setFilter(f);
    setPage(1);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
    }

    if (notification.referenceType === 'Deal' && notification.referenceId) {
      navigate(`/deals/${notification.referenceId}`);
    } else if (notification.referenceType === 'Doctor' && notification.referenceId) {
      navigate(`/doctors/${notification.referenceId}`);
    } else if (notification.referenceType === 'User' && notification.referenceId) {
      navigate(`/users/${notification.referenceId}`);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" ref={topRef}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={() => loadNotifications()}
            className="p-1 hover:bg-red-100 rounded"
          >
            <RefreshCw className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Notification List */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        {loading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleMarkAsRead(notification)}
                className={`px-4 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-0.5 px-2 py-1 rounded text-xs font-semibold ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`}>
                    {notification.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400 capitalize">{notification.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="text-sm text-slate-500">
            Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50 hover:bg-slate-200"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => { setPage((p) => p + 1); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              disabled={page * pageSize >= total}
              className="px-3 py-1.5 text-sm bg-slate-100 rounded disabled:opacity-50 hover:bg-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Notifications = NotificationsPage;

export { Notifications };
export default NotificationsPage;