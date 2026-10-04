import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/notificationService';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([
        {
          id: 'notif_1',
          type: 'like',
          title: 'Aditya liked your profile ❤️',
          message: 'Aditya liked your profile. Swipe right to match!',
          isRead: false,
          time: '5m ago'
        },
        {
          id: 'notif_2',
          type: 'match',
          title: "It's a Match! 🎉",
          message: 'You and Reyansh matched! Send him a message now.',
          isRead: false,
          time: '1h ago'
        },
        {
          id: 'notif_3',
          type: 'message',
          title: 'Ryan sent you a message',
          message: '"Let’s check out that coffee spot!"',
          isRead: true,
          time: '3h ago'
        },
        {
          id: 'notif_4',
          type: 'verification',
          title: 'Profile Verified ✨',
          message: 'Congratulations! Your profile has been verified.',
          isRead: true,
          time: 'Yesterday'
        }
      ]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(currentUser.uid, (data) => {
      if (data.length === 0) {
        setNotifications([
          {
            id: 'n_demo_1',
            type: 'like',
            title: 'Aditya liked your profile ❤️',
            message: 'Aditya liked your profile. Check out his profile!',
            isRead: false,
            time: 'Just now'
          },
          {
            id: 'n_demo_2',
            type: 'match',
            title: "It's a Match! 🎉",
            message: 'You and Ryan matched! Say hello!',
            isRead: false,
            time: '1h ago'
          }
        ]);
      } else {
        setNotifications(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    try {
      await markNotificationAsRead(notifId);
    } catch (e) {
      console.warn('Mark notif read error:', e);
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (currentUser) {
      try {
        await markAllNotificationsAsRead(currentUser.uid);
      } catch (e) {
        console.warn('Mark all notifs read error:', e);
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead
  };
};

export default useNotifications;
