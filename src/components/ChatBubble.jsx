import React from 'react';

export const ChatBubble = ({ message, isOutgoing, otherUserPhoto, currentUserPhoto }) => {
  const formattedTime = message.createdAt?.toDate
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const avatarSrc = isOutgoing
    ? (currentUserPhoto || '/assets/profile-user.jpg')
    : (otherUserPhoto || '/assets/profile-aditya.jpg');

  return (
    <div className={`chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      {!isOutgoing && (
        <div className="chat-bubble-avatar-wrap incoming-avatar">
          <img src={avatarSrc} alt="User" className="chat-bubble-avatar-img" />
        </div>
      )}

      <div
        className={`chat-bubble-body ${
          isOutgoing ? 'bubble-outgoing' : 'bubble-incoming'
        } ${message.type === 'emoji' ? 'bubble-emoji-only' : ''}`}
      >
        {message.type === 'image' && message.imageUrl ? (
          <div className="chat-bubble-image-wrap">
            <img src={message.imageUrl} alt="Attachment" className="chat-attachment-img" />
          </div>
        ) : (
          <p className="chat-message-text">{message.message}</p>
        )}
        {formattedTime && <span className="chat-timestamp">{formattedTime}</span>}
      </div>

      {isOutgoing && (
        <div className="chat-bubble-avatar-wrap outgoing-avatar">
          <img src={avatarSrc} alt="Me" className="chat-bubble-avatar-img" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
