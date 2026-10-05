import React from 'react';
import { SlidersHorizontal, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export const Header = ({ onOpenFilter, showFilter, showNotifications = true, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { unreadCount } = useNotifications();

  // Dynamic route-based title resolver (explicitly no top header title on /likes and /discover)
  const getDynamicTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/likes') || path.startsWith('/discover')) {
      return null;
    }
    if (title !== undefined && title !== null) return title;
    if (path.startsWith('/profile') && !path.includes('/profile/')) return 'My Profile';
    if (path.startsWith('/matches')) return 'Matches';
    if (path.startsWith('/people-i-like')) return 'People Whom I Like';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/settings')) return 'Settings';
    return null;
  };

  const activeTitle = getDynamicTitle();

  const isDiscover = location.pathname.startsWith('/discover');
  const shouldShowFilter = showFilter !== undefined ? showFilter : isDiscover;

  return (
    <header className={`app-header-hs ${activeTitle ? 'has-center-title' : ''}`}>
      <div className="header-left" onClick={() => navigate('/home')}>
        <div className="header-logo-container">
          <img src="/assets/logo-heart.jpg" alt="HeartSync" className="header-logo-img" />
          <span className="brand-wordmark">HeartSync</span>
        </div>
      </div>

      {activeTitle && (
        <h1 className="header-center-title">{activeTitle}</h1>
      )}

      <div className="header-right-actions">
        {shouldShowFilter && (
          <button
            id="btn-header-filter"
            className="icon-action-btn"
            onClick={onOpenFilter}
            aria-label="Filter discovery"
            title="Filter"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}

        {showNotifications && (
          <button
            id="btn-header-notifs"
            className="icon-action-btn relative-badge"
            onClick={() => navigate('/notifications')}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-bubble-badge">{unreadCount}</span>}
          </button>
        )}

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
