import { create } from 'zustand';

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

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setConnectionStatus: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  decrementUnread: () => void;
}

// Storage event key for cross-tab sync
const STORAGE_KEY = 'notification_sync';

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isConnected: false,
  error: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) => {
    const state = get();
    const wasUnread = state.notifications.find(n => n.id === id && !n.isRead);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
    // Broadcast to other tabs
    if (wasUnread) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'markRead', id, timestamp: Date.now() }));
    }
  },
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    // Broadcast to other tabs
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: 'markAllRead', timestamp: Date.now() }));
  },
  setNotifications: (notifications) => set({ notifications }),
  setConnectionStatus: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));

// Cross-tab sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        const store = useNotificationStore.getState();

        if (data.type === 'markRead') {
          // Update notifications in store
          store.setNotifications(
            store.notifications.map(n =>
              n.id === data.id ? { ...n, isRead: true } : n
            )
          );
          // Decrement unread count if this tab didn't already handle it
          const wasUnread = store.notifications.find(n => n.id === data.id && !n.isRead);
          if (wasUnread) {
            store.decrementUnread();
          }
        } else if (data.type === 'markAllRead') {
          store.setNotifications(store.notifications.map(n => ({ ...n, isRead: true })));
          store.setUnreadCount(0);
        }
      } catch {
        // Ignore parse errors
      }
    }
  });
}