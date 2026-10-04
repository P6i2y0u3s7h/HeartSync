import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Smile,
  Image as ImageIcon,
  Paperclip,
  Mic,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import { initialProfiles } from '../data/seedData';

const QUICK_EMOJIS = ['❤️', '😍', '✨', '🔥', '😘', '😊', '🍕', '☕', '🥂', '🎉'];

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Extract other user id from chatId (format: uidA_uidB or chat_aditya)
  let otherUid = '';
  if (chatId) {
    const parts = chatId.replace('chat_', '').split('_');
    otherUid = parts.find(id => id !== currentUser?.uid) || parts[0];
  }

  const {
    messages,
    loading,
    sending,
    sendTextMessage,
    sendEmojiMessage,
    sendImageAttachment
  } = useMessages(chatId, otherUid);

  useEffect(() => {
    // Resolve other user profile
    const fetchOther = async () => {
      // Check seed data
      const seed = initialProfiles.find(p => p.uid === otherUid || p.username === otherUid || p.uid.includes(otherUid));
      if (seed) {
        setOtherUser(seed);
        return;
      }
      try {
        const prof = await getUserProfile(otherUid);
        if (prof) {
          setOtherUser(prof);
          return;
        }
      } catch (e) {
        console.warn('Error fetching other user:', e);
      }
      // Fallback
      setOtherUser(initialProfiles[0]);
    };

    fetchOther();
  }, [otherUid]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    sendTextMessage(inputVal);
    setInputVal('');
    setShowEmojiPicker(false);
  };

  const handleSelectEmoji = (emoji) => {
    sendEmojiMessage(emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      sendImageAttachment(file);
    }
  };

  return (
    <div className="chat-screen-page">
      {/* Top Header */}
      <header className="chat-screen-header">
        <button
          className="chat-back-btn"
          onClick={() => navigate('/chats')}
          aria-label="Back to conversations"
        >
          <ArrowLeft size={22} />
        </button>

        <div
          className="chat-header-profile"
          onClick={() => navigate(`/profile/${otherUser?.uid || otherUser?.id || otherUid}`)}
        >
          <div className="chat-header-avatar-wrap">
            <img
              src={otherUser?.profilePhoto || otherUser?.image || '/assets/logo-heart.jpg'}
              alt={otherUser?.displayName || 'User'}
              className="chat-header-avatar-img"
            />
            {otherUser?.isOnline && <span className="chat-header-online-dot"></span>}
          </div>
          <div className="chat-header-user-info">
            <h3 className="chat-header-name">{otherUser?.displayName || otherUser?.name || 'HeartSync Member'}</h3>
            <span className="chat-header-status">
              {otherUser?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="chat-action-btn-sm" aria-label="Phone Call">
            <Phone size={18} />
          </button>
          <button className="chat-action-btn-sm" aria-label="Video Call">
            <Video size={18} />
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="chat-messages-container">
        {loading ? (
          <LoadingSpinner text="Loading messages..." />
        ) : (
          <>
            <div className="chat-encryption-notice">
              <span>🔒 Messages are encrypted & secure with HeartSync</span>
            </div>

            {messages.map((msg) => {
              const isOutgoing = msg.senderId === currentUser?.uid || msg.senderId === 'current_user';
              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOutgoing={isOutgoing}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="quick-emoji-drawer animate-pop-in">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="quick-emoji-btn"
              onClick={() => handleSelectEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Input bar */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <button
          type="button"
          className="chat-input-icon-btn"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          aria-label="Add emoji"
        >
          <Smile size={22} />
        </button>

        <button
          type="button"
          className="chat-input-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach photo"
        >
          <ImageIcon size={22} />
        </button>

        <input
          id="chat-text-input"
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Type message..."
          className="chat-text-field"
          autoComplete="off"
        />

        {inputVal.trim() ? (
          <button
            id="btn-send-message"
            type="submit"
            disabled={sending}
            className="chat-send-btn"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="chat-mic-btn"
            aria-label="Voice note"
          >
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
};

export default ChatPage;
