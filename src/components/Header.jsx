import React from 'react';
import { SlidersHorizontal, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

export const Header = ({ onOpenFilter, showFilter, showNotifications = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const { unreadCount } = useNotifications();

  const isDiscover = location.pathname.startsWith('/discover');
  const shouldShowFilter = showFilter !== undefined ? showFilter : isDiscover;

  return (
    <header className="app-header-hs">
      {/* LEFT: HeartSync Brand & Logo */}
      <div
        className="header-left"
        onClick={() => navigate('/home')}
        title="HeartSync Home"
        aria-label="HeartSync Home"
        role="button"
        tabIndex={0}
      >
        <div className="header-logo-container">
          <img src="/assets/logo-heart.jpg" alt="HeartSync" className="header-logo-img" />
          <span className="brand-wordmark">HeartSync</span>
        </div>
      </div>

      {/* RIGHT: Header Actions (Filter, Notifications, Profile Avatar) */}
      <div className="header-right-actions">
        {/* Discovery Filter Icon (when on discover / filter enabled) */}
        {shouldShowFilter && (
          <button
            id="btn-header-filter"
            className="icon-action-btn"
            onClick={onOpenFilter}
            aria-label="Filter"
            title="Filter"
          >
            <SlidersHorizontal size={20} />
          </button>
        )}

        {/* Notifications Bell Icon with Unread Badge */}
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

        {/* My Profile Icon / Avatar */}
        <div
          id="header-user-avatar"
          className="header-avatar-circle"
          onClick={() => navigate('/profile')}
          aria-label="My Profile"
          title="My Profile"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate('/profile');
            }
          }}
        >
          <img
            src={userProfile?.profilePhoto || '/assets/logo-heart.jpg'}
            alt={userProfile?.displayName || 'User Profile'}
            className="header-avatar-img"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
