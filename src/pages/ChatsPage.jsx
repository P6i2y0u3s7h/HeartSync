import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import ChatListItem from '../components/ChatListItem';
import StoryAvatar from '../components/StoryAvatar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import FilterModal from '../components/FilterModal';
import { useChats } from '../hooks/useChats';
import { useAuth } from '../context/AuthContext';

export const ChatsPage = () => {
  const { chats, activeUsers, loading } = useChats();
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const name = chat.otherUser?.displayName || chat.otherUser?.name || '';
    const lastMsg = chat.lastMessage || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
  });

  return (
    <div className="app-page-wrapper">
      <HeartBackground />

      {/* 1. TOP HEADER */}
      <header className="chats-top-header">
        <div className="chats-header-left" onClick={() => navigate('/chats')}>
          <MessageCircle size={22} className="chats-header-icon" />
          <h1 className="chats-header-title">Chats</h1>
        </div>

        <div className="chats-header-right">
          <button
            id="btn-chats-search"
            className="chats-header-action-btn"
            onClick={() => setSearchOpen(prev => !prev)}
            aria-label="Search chats"
            title="Search"
          >
            <Search size={19} />
          </button>

          <button
            id="btn-chats-filter"
            className="chats-header-action-btn"
            onClick={() => setFilterModalOpen(true)}
            aria-label="Filter chats"
            title="Filter"
          >
            <SlidersHorizontal size={19} />
          </button>

          <div
            id="chats-user-avatar"
            className="chats-avatar-circle"
            onClick={() => navigate('/profile')}
            title="My Profile"
          >
            <img
              src={userProfile?.profilePhoto || '/assets/logo-heart.jpg'}
              alt={userProfile?.displayName || 'User'}
              className="chats-avatar-img"
            />
          </div>
        </div>
      </header>

      {/* Optional Search bar dropdown */}
      {searchOpen && (
        <div className="chats-search-bar-wrap animate-fade-in">
          <Search size={16} className="chats-search-bar-icon" />
          <input
            id="input-chats-search"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="chats-search-input"
            autoFocus
          />
        </div>
      )}

      <main className="main-content-scrollable chats-page-layout">
        {/* 2. "NOW ACTIVE" SECTION */}
        <section className="now-active-section" aria-label="Now active users">
          <div className="now-active-header">
            <h3 className="subheading-active">Now Active</h3>
            <button
              id="btn-now-active-see-all"
              type="button"
              className="now-active-see-all"
              onClick={() => navigate('/discover')}
            >
              See all
            </button>
          </div>

          <div className="now-active-scroll">
            {activeUsers.map((user) => (
              <StoryAvatar
                key={user.uid || user.id}
                profile={user}
                onClick={(p) => {
                  navigate(`/profile/${p.uid || p.id}`);
                }}
              />
            ))}
          </div>
        </section>

        {/* 3. CHAT LIST */}
        <section className="chat-threads-section" aria-label="Recent Conversations">
          <h3 className="subheading-messages">Recent Conversations</h3>

          {loading ? (
            <LoadingSpinner text="Loading your conversations..." />
          ) : filteredChats.length > 0 ? (
            <div className="chats-list-container">
              {filteredChats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="chats"
              title="No conversations found"
              message={searchQuery ? 'No chats matched your search.' : 'Like people and match to start chatting with them!'}
              actionText="Find Matches"
              onAction={() => navigate('/home')}
            />
          )}
        </section>
      </main>

      {/* 4. BOTTOM NAVIGATION */}
      <BottomNavigation />

      {/* Filter Modal */}
      {filterModalOpen && (
        <FilterModal
          isOpen={filterModalOpen}
          onClose={() => setFilterModalOpen(false)}
          onApplyFilters={() => setFilterModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatsPage;
