import React from 'react';
import { Heart, Sparkles, MessageCircle, ShieldCheck, Info } from 'lucide-react';

export const NotificationItem = ({ notification, onMarkRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart size={18} fill="#C2185B" color="#C2185B" />;
      case 'match':
        return <Sparkles size={18} color="#ED417A" />;
      case 'message':
        return <MessageCircle size={18} color="#890F4F" />;
      case 'verification':
        return <ShieldCheck size={18} color="#2e7d32" />;
      default:
        return <Info size={18} color="#C2185B" />;
    }
  };

  return (
    <div
      className={`notification-item-card ${notification.isRead ? 'read' : 'unread'}`}
      onClick={() => onMarkRead && onMarkRead(notification.id)}
    >
      <div className={`notification-icon-badge notif-type-${notification.type || 'system'}`}>
        {getIcon()}
      </div>

      <div className="notification-details">
        <h4 className="notification-item-title">{notification.title}</h4>
        <p className="notification-item-body">{notification.message}</p>
        <span className="notification-item-time">{notification.time || 'Recently'}</span>
      </div>

      {!notification.isRead && <span className="notification-unread-dot"></span>}
    </div>
  );
};

export default NotificationItem;
