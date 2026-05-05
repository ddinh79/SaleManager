import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import notificationService from '../services/notificationService';

const HUB_URL = 'http://localhost:5100/hubs/notifications';

export const useNotificationSignalR = () => {
  const { addNotification, setUnreadCount, setConnectionStatus } = useNotificationStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveNotification', (notification: any) => {
      addNotification(notification);
    });

    connection.on('UpdateUnreadCount', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    connection.onreconnecting(() => {
      setConnectionStatus(false);
    });

    connection.onreconnected(() => {
      setConnectionStatus(true);
    });

    connection.onclose(() => {
      setConnectionStatus(false);
    });

    connection.start()
      .then(() => {
        setConnectionStatus(true);
        connection.invoke('JoinUserGroup').catch(console.error);
        notificationService.getUnreadCount().then((res) => {
          setUnreadCount(res.count);
        });
      })
      .catch(() => {
        setConnectionStatus(false);
      });

    return () => {
      connection.invoke('LeaveUserGroup').catch(console.error);
      connection.stop().catch(console.error);
    };
  }, [user?.id, addNotification, setUnreadCount, setConnectionStatus]);
};