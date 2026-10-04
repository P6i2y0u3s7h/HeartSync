import React from 'react';
import { SlidersHorizontal, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export const Header = ({ onOpenFilter, showFilter = true, title }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="app-header-hs">
      <div className="header-left" onClick={() => navigate('/home')}>
        <div className="header-logo-container">
          <img src="/assets/logo-heart.jpg" alt="HeartSync" className="header-logo-img" />
          <span className="brand-wordmark">HeartSync</span>
        </div>
      </div>

      {title && <div className="header-center-title">{title}</div>}

      <div className="header-right-actions">
        {showFilter && (
          <button
            id="btn-header-filter"
            className="icon-action-btn"
            onClick={onOpenFilter}
            aria-label="Filter discovery"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}

        <button
          id="btn-header-notifs"
          className="icon-action-btn relative-badge"
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span className="notification-bubble-badge">{unreadCount}</span>}
        </button>

        <div
          id="header-user-avatar"
          className="header-avatar-circle"
          onClick={() => navigate('/profile')}
          title="My Profile"
        >
          <img
            src={userProfile?.profilePhoto || '/assets/logo-heart.jpg'}
            alt={userProfile?.displayName || 'User'}
            className="header-avatar-img"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
