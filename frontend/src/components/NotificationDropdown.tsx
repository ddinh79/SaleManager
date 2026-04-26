import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Props {
  onClose: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Normal: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const NotificationDropdown: React.FC<Props> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    notificationService.getNotifications(1, 5, false).then((res) => {
      setNotifications(res.items);
      setLoading(false);
    });
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
    }

    if (notification.referenceType === 'Deal' && notification.referenceId) {
      navigate(`/deals/${notification.referenceId}`);
    } else if (notification.referenceType === 'Doctor' && notification.referenceId) {
      navigate(`/doctors/${notification.referenceId}`);
    } else if (notification.referenceType === 'User' && notification.referenceId) {
      navigate(`/users/${notification.referenceId}`);
    }

    onClose();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs text-indigo-600 hover:text-indigo-700"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS.Normal}`}>
                  {notification.priority.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatTime(notification.createdAt)}</p>
                </div>
                {!notification.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        onClick={() => { navigate('/notifications'); onClose(); }}
        className="px-4 py-3 text-center text-sm text-indigo-600 hover:bg-slate-50 cursor-pointer border-t border-slate-100"
      >
        View all notifications
      </div>
    </div>
  );
};

export default NotificationDropdown;