import React from 'react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import NotificationItem from '../components/NotificationItem';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useNotifications } from '../hooks/useNotifications';
import { CheckCheck } from 'lucide-react';

export const NotificationsPage = () => {
  const { notifications, loading, markAsRead, markAllRead, unreadCount } = useNotifications();

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="Notifications" />

      <main className="main-content-scrollable notifs-content-layout">
        <div className="notifs-header-row">
          <div>
            <h2 className="section-title-pink">Activity & Alerts</h2>
            <p className="section-sub-pink">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You are all caught up!'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              id="btn-mark-all-read"
              className="mark-all-read-btn"
              onClick={markAllRead}
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : notifications.length > 0 ? (
          <div className="notifications-list-box">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkRead={markAsRead}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            type="matches"
            title="No notifications yet"
            message="We will notify you when you get likes, matches, and messages."
          />
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default NotificationsPage;
