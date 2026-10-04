import React from 'react';
import { Heart, MessageSquare, Search, Sparkles } from 'lucide-react';

export const EmptyState = ({ type = 'matches', title, message, actionText, onAction }) => {
  const getIcon = () => {
    switch (type) {
      case 'matches':
        return <Heart size={44} className="empty-icon-heart" />;
      case 'likes':
        return <Sparkles size={44} className="empty-icon-sparkle" />;
      case 'chats':
        return <MessageSquare size={44} className="empty-icon-chat" />;
      case 'search':
        return <Search size={44} className="empty-icon-search" />;
      default:
        return <Heart size={44} className="empty-icon-heart" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'matches':
        return 'No matches yet ❤️';
      case 'likes':
        return 'No likes yet';
      case 'chats':
        return 'Your conversations will appear here.';
      case 'search':
        return 'No people found.';
      default:
        return 'Nothing here yet';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'matches':
        return 'Keep exploring and liking profiles. When someone likes you back, they will show up here!';
      case 'likes':
        return 'Profiles of people who liked you will be shown here. Keep your profile updated!';
      case 'chats':
        return 'Match with people to start chatting, sharing photos, and building connections.';
      case 'search':
        return 'Try changing your search terms or adjusting the discovery filters.';
      default:
        return 'Check back again soon.';
    }
  };

  return (
    <div className="empty-state-card">
      <div className="empty-icon-wrapper">{getIcon()}</div>
      <h3 className="empty-state-title">{title || getDefaultTitle()}</h3>
      <p className="empty-state-message">{message || getDefaultMessage()}</p>
      {actionText && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
