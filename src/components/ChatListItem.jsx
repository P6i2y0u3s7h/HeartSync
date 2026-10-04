import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ChatListItem = ({ chat }) => {
  const navigate = useNavigate();
  const user = chat.otherUser || {};
  const photo = user.profilePhoto || user.image || '/assets/logo-heart.jpg';
  const name = user.displayName || user.name || 'HeartSync Member';

  return (
    <div
      className="chat-list-item-hs"
      onClick={() => navigate(`/chat/${chat.id}`)}
    >
      <div className="chat-item-avatar-box">
        <img src={photo} alt={name} className="chat-item-avatar-img" />
        {user.isOnline && <span className="chat-item-online-dot"></span>}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-top-line">
          <h4 className="chat-item-name">{name}</h4>
          <span className="chat-item-time">{chat.lastMessageAt || ''}</span>
        </div>
        <div className="chat-item-bottom-line">
          <p className="chat-item-preview">{chat.lastMessage || 'Start conversation...'}</p>
          {chat.unreadCount > 0 && (
            <span className="chat-item-unread-count">{chat.unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;
