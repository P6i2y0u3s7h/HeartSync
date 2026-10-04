import React from 'react';

export const ChatBubble = ({ message, isOutgoing }) => {
  const formattedTime = message.createdAt?.toDate
    ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`chat-bubble-row ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      <div className={`chat-bubble-body ${isOutgoing ? 'bubble-outgoing' : 'bubble-incoming'} ${message.type === 'emoji' ? 'bubble-emoji-only' : ''}`}>
        {message.type === 'image' && message.imageUrl ? (
          <div className="chat-bubble-image-wrap">
            <img src={message.imageUrl} alt="Attachment" className="chat-attachment-img" />
          </div>
        ) : (
          <p className="chat-message-text">{message.message}</p>
        )}
        {formattedTime && <span className="chat-timestamp">{formattedTime}</span>}
      </div>
    </div>
  );
};

export default ChatBubble;
