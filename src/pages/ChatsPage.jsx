import React from 'react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import ChatListItem from '../components/ChatListItem';
import StoryAvatar from '../components/StoryAvatar';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useChats } from '../hooks/useChats';
import { useNavigate } from 'react-router-dom';

export const ChatsPage = () => {
  const { chats, activeUsers, loading } = useChats();
  const navigate = useNavigate();

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="Messages" />

      <main className="main-content-scrollable chats-page-layout">
        {/* Top: Now Active */}
        <section className="now-active-section">
          <h3 className="subheading-active">Now Active</h3>
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

        {/* Chat List */}
        <section className="chat-threads-section">
          <h3 className="subheading-messages">Recent Conversations</h3>

          {loading ? (
            <LoadingSpinner text="Loading your conversations..." />
          ) : chats.length > 0 ? (
            <div className="chats-list-container">
              {chats.map((chat) => (
                <ChatListItem key={chat.id} chat={chat} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="chats"
              title="Your conversations will appear here."
              message="Like people and match to start chatting with them!"
              actionText="Find Matches"
              onAction={() => navigate('/home')}
            />
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ChatsPage;
