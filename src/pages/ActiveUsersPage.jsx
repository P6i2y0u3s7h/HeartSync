import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search, UserCheck } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useAuth } from '../context/AuthContext';
import { useOnlineUsers, extractProfilePhoto, extractDisplayName } from '../hooks/useOnlineUsers';
import { getDeterministicChatId } from '../services/chatService';

export const ActiveUsersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { onlineUsers, loading } = useOnlineUsers(currentUser);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = onlineUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (u.displayName || u.firstName || u.fullName || '').toLowerCase();
    const city = (u.city || u.location || '').toLowerCase();
    return name.includes(q) || city.includes(q);
  });

  const handleStartChat = (e, targetUid) => {
    e.stopPropagation();
    if (!currentUser?.uid || !targetUid) return;
    const chatId = getDeterministicChatId(currentUser.uid, targetUid);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />

      {/* Header */}
      <header className="active-users-header">
        <div className="active-users-header-left">
          <button
            type="button"
            className="active-users-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="active-users-title-group">
            <h1 className="active-users-title">Now Active</h1>
            <span className="active-users-count-chip">
              <span className="online-pulse-dot" aria-hidden="true"></span>
              {onlineUsers.length} Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-scrollable active-users-page-layout">
        {/* Search Input */}
        <div className="active-users-search-wrap">
          <Search size={16} className="active-users-search-icon" />
          <input
            type="text"
            placeholder="Search active members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="active-users-search-input"
          />
        </div>

        {/* User Grid / List */}
        {loading ? (
          <div className="active-users-loading">
            <LoadingSpinner text="Finding who's online..." />
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="active-users-grid">
            {filteredUsers.map((user) => {
              const uid = user.uid || user.id;
              const name = extractDisplayName(user);
              const photo = extractProfilePhoto(user);
              const age = user.age ? `${user.age}` : '';
              const location = user.city || user.location || '';
              const bio = user.bio || '';

              return (
                <div
                  key={uid}
                  id={`active-card-${uid}`}
                  className="active-user-card"
                  onClick={() => navigate(`/profile/${uid}`)}
                  title={`View ${name}'s profile`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="active-user-avatar-box">
                    <img
                      src={photo}
                      alt={name}
                      className="active-user-photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/logo-heart.jpg';
                      }}
                    />
                    <span className="now-active-green-dot" aria-label="Online"></span>
                  </div>

                  <div className="active-user-info">
                    <div className="active-user-name-line">
                      <span className="active-user-name">{name}</span>
                      {age && <span className="active-user-age">, {age}</span>}
                    </div>
                    {location && (
                      <span className="active-user-location">{location}</span>
                    )}
                    {bio && (
                      <p className="active-user-bio">{bio}</p>
                    )}
                  </div>

                  <div className="active-user-actions">
                    <button
                      type="button"
                      className="active-user-chat-btn"
                      onClick={(e) => handleStartChat(e, uid)}
                      title={`Chat with ${name}`}
                      aria-label={`Chat with ${name}`}
                    >
                      <MessageCircle size={18} />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="active-users-empty">
            <div className="active-users-empty-icon">
              <UserCheck size={38} color="#C2185B" />
            </div>
            <h3 className="active-users-empty-title">
              {searchQuery ? 'No active members matched' : 'No one is active right now'}
            </h3>
            <p className="active-users-empty-desc">
              {searchQuery
                ? 'Try searching with a different name or city.'
                : 'Check back in a little bit as members log in throughout the day!'}
            </p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ActiveUsersPage;
