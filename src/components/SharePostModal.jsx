import React, { useState } from 'react';
import { X, Send, Search, Check, MessageSquare } from 'lucide-react';
import { useChats } from '../hooks/useChats';
import { sharePostToChat } from '../services/postService';
import { extractDisplayName, extractProfilePhoto } from '../hooks/useOnlineUsers';

export const SharePostModal = ({
  isOpen,
  onClose,
  post,
  currentUser
}) => {
  const { chats, loading } = useChats();
  const [searchQuery, setSearchQuery] = useState('');
  const [optionalNote, setOptionalNote] = useState('');
  const [sentMap, setSentMap] = useState({});
  const [sendingId, setSendingId] = useState(null);

  if (!isOpen || !post) return null;

  const filteredChats = chats.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.otherUser?.displayName || c.otherUser?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendToChat = async (chat) => {
    const chatId = chat.id;
    if (!chatId || !currentUser?.uid || sendingId || sentMap[chatId]) return;

    setSendingId(chatId);
    try {
      await sharePostToChat(chatId, currentUser.uid, post, optionalNote);
      setSentMap((prev) => ({ ...prev, [chatId]: true }));
    } catch (err) {
      console.error('Error sharing post to chat:', err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="share-post-modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="share-post-title"
      >
        {/* Header */}
        <div className="share-post-header">
          <div className="share-post-title-wrap">
            <Send size={18} color="#C2185B" />
            <h3 id="share-post-title" className="share-post-title">
              Share to Chat
            </h3>
          </div>
          <button
            type="button"
            className="share-post-close-btn"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        {/* Post Preview Thumbnail */}
        <div className="share-post-preview-card">
          <img
            src={post.imageUrl || '/assets/logo-heart.jpg'}
            alt="Post preview"
            className="share-post-thumb-img"
          />
          <div className="share-post-thumb-info">
            <span className="share-post-thumb-author">
              {extractDisplayName(post)}'s post
            </span>
            {post.caption && (
              <p className="share-post-thumb-caption">{post.caption}</p>
            )}
          </div>
        </div>

        {/* Optional Note */}
        <div className="share-post-note-box">
          <input
            type="text"
            className="share-post-note-input"
            placeholder="Write a message... (optional)"
            value={optionalNote}
            onChange={(e) => setOptionalNote(e.target.value)}
          />
        </div>

        {/* Search Chats */}
        <div className="share-post-search-box">
          <Search size={15} className="share-post-search-icon" />
          <input
            type="text"
            className="share-post-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chat List */}
        <div className="share-post-chat-list">
          {loading ? (
            <div className="share-post-loading">Loading conversations...</div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherUser = chat.otherUser || {};
              const name = otherUser.displayName || otherUser.name || 'Member';
              const photo = otherUser.profilePhoto || otherUser.image || '/assets/logo-heart.jpg';
              const isSent = sentMap[chat.id];
              const isSending = sendingId === chat.id;

              return (
                <div key={chat.id} className="share-post-chat-item">
                  <img
                    src={photo}
                    alt={name}
                    className="share-post-user-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/logo-heart.jpg';
                    }}
                  />
                  <span className="share-post-user-name">{name}</span>

                  <button
                    type="button"
                    className={`share-post-send-btn ${isSent ? 'sent' : ''}`}
                    onClick={() => handleSendToChat(chat)}
                    disabled={isSent || isSending}
                  >
                    {isSent ? (
                      <>
                        <Check size={14} />
                        <span>Sent</span>
                      </>
                    ) : isSending ? (
                      'Sending...'
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="share-post-empty">
              <MessageSquare size={24} color="#9e9e9e" />
              <span>No conversations found. Start a chat first!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
