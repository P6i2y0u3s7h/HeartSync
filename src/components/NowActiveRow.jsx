import React from 'react';
import { useNavigate } from 'react-router-dom';
import { extractProfilePhoto, extractDisplayName } from '../hooks/useOnlineUsers';

/**
 * NowActiveRow
 *
 * Renders real registered HeartSync members who are currently online in Firestore.
 * - Real photo (with fallback if missing/broken)
 * - Real user first name
 * - Glowing green online status indicator
 * - Horizontal single-row scroll (no page overflow)
 * - Click navigates to user's profile (/profile/:uid)
 * - Working "See all" button
 * - Empty state: "No one is active right now."
 */
export const NowActiveRow = ({
  onlineUsers = [],
  loading = false,
  showSeeAll = true,
  onSeeAll = null
}) => {
  const navigate = useNavigate();

  const handleSeeAll = () => {
    if (onSeeAll) {
      onSeeAll();
    } else {
      navigate('/active-users');
    }
  };

  const handleUserClick = (uid) => {
    if (!uid) return;
    navigate(`/profile/${uid}`);
  };

  return (
    <section className="now-active-section" aria-label="Now active users">
      {/* 1. Header with Title & See All */}
      <div className="now-active-header">
        <div className="now-active-title-wrap">
          <span className="online-pulse-dot" aria-hidden="true"></span>
          <h3 className="subheading-active">Now Active</h3>
          {!loading && onlineUsers.length > 0 && (
            <span className="online-count-badge">{onlineUsers.length}</span>
          )}
        </div>

        {showSeeAll && (
          <button
            id="btn-now-active-see-all"
            type="button"
            className="now-active-see-all"
            onClick={handleSeeAll}
            aria-label="See all active members"
          >
            See all
          </button>
        )}
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="now-active-scroll" aria-busy="true">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="now-active-item skeleton-item">
              <div className="now-active-avatar-wrap skeleton-circle"></div>
              <div className="now-active-name skeleton-text"></div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Empty State (No other members online) */}
      {!loading && onlineUsers.length === 0 && (
        <div className="now-active-empty">
          <span>No one is active right now.</span>
        </div>
      )}

      {/* 4. Active Users Carousel */}
      {!loading && onlineUsers.length > 0 && (
        <div className="now-active-scroll">
          {onlineUsers.map((user) => {
            const uid = user.uid || user.id;
            const name = extractDisplayName(user);
            const photo = extractProfilePhoto(user);

            return (
              <div
                key={uid}
                id={`online-user-${uid}`}
                className="now-active-item"
                onClick={() => handleUserClick(uid)}
                title={`View ${name}'s profile`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleUserClick(uid);
                  }
                }}
              >
                <div className="now-active-avatar-wrap">
                  <img
                    src={photo}
                    alt={name}
                    className="now-active-avatar-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/logo-heart.jpg';
                    }}
                  />
                  <span
                    className="now-active-green-dot"
                    title="Online now"
                    aria-label="Online"
                  ></span>
                </div>
                <span className="now-active-name">{name}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default NowActiveRow;
