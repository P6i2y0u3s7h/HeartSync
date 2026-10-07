import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import ChatListItem from '../components/ChatListItem';
import NowActiveRow from '../components/NowActiveRow';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import FilterModal from '../components/FilterModal';
import { useChats } from '../hooks/useChats';
import { useAuth } from '../context/AuthContext';
import { useOnlineUsers } from '../hooks/useOnlineUsers';

export const ChatsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { chats, loading } = useChats();
  const { onlineUsers, loading: onlineLoading } = useOnlineUsers(currentUser);
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
        <NowActiveRow
          onlineUsers={onlineUsers}
          loading={onlineLoading}
          showSeeAll={true}
          onSeeAll={() => navigate('/active-users')}
        />

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
              title={searchQuery ? 'No conversations found' : 'No recent chats yet 💬'}
              message={searchQuery ? 'No chats matched your search.' : "Start a conversation and connect with someone! Open a profile and tap Chat."}
              actionText="Find Someone"
              onAction={() => navigate('/discover')}
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
