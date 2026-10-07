import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, MessageCircle, ShieldCheck, Info, Eye } from 'lucide-react';

export const NotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Heart size={18} fill="#C2185B" color="#C2185B" />;
      case 'match':
        return <Sparkles size={18} color="#ED417A" />;
      case 'message':
        return <MessageCircle size={18} color="#890F4F" />;
      case 'view':
        return <Eye size={18} color="#ED417A" />;
      case 'verification':
        return <ShieldCheck size={18} color="#2e7d32" />;
      default:
        return <Info size={18} color="#C2185B" />;
    }
  };

  const handleClick = () => {
    if (onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.targetUrl) {
      navigate(notification.targetUrl);
      return;
    }
    switch (notification.type) {
      case 'like':
        navigate('/likes');
        break;
      case 'match':
        navigate('/matches');
        break;
      case 'message':
        navigate('/chats');
        break;
      case 'view':
        navigate('/profile');
        break;
      case 'verification':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`notification-item-card ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
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
