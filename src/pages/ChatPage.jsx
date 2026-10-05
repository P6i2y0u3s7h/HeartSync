import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Camera,
  Image as ImageIcon,
  AudioWaveform,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import ChatBubble from '../components/ChatBubble';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import { extractOtherUid, markChatAsRead } from '../services/chatService';
import { initialProfiles } from '../data/seedData';

const QUICK_EMOJIS = ['❤️', '😍', '✨', '🔥', '😘', '😊', '🍕', '☕', '🥂', '🎉'];

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Extract other user id from chatId using robust helper
  const otherUid = extractOtherUid(chatId, currentUser?.uid);

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
      if (!otherUid) return;
      // Check seed data
      const seed = initialProfiles.find(
        p => p.uid === otherUid || p.username === otherUid || p.uid.includes(otherUid) || p.firstName?.toLowerCase() === otherUid?.toLowerCase()
      );
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
      setOtherUser({
        uid: otherUid,
        displayName: 'HeartSync Member',
        firstName: 'Member',
        profilePhoto: '/assets/logo-heart.jpg'
      });
    };

    fetchOther();
  }, [otherUid]);

  // Mark chat as read when opened or new messages arrive
  useEffect(() => {
    if (chatId && currentUser?.uid) {
      markChatAsRead(chatId, currentUser.uid);
    }
  }, [chatId, currentUser?.uid, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic viewport listener for mobile keyboards & dynamic browser toolbars (Realme Narzo 50A / Android Chrome)
  useEffect(() => {
    const updateViewportHeight = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--chat-vh', `${height}px`);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
    } else {
      window.addEventListener('resize', updateViewportHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      } else {
        window.removeEventListener('resize', updateViewportHeight);
      }
      document.documentElement.style.removeProperty('--chat-vh');
    };
  }, []);

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

  const otherUserName = otherUser?.firstName || (otherUser?.displayName ? otherUser.displayName.split(' ')[0] : 'Aditya');
  const otherUserPhoto = otherUser?.profilePhoto || otherUser?.image || '/assets/profile-aditya.jpg';
  const currentUserPhoto = (userProfile?.profilePhoto && userProfile.profilePhoto !== '/assets/logo-heart.jpg')
    ? userProfile.profilePhoto
    : '/assets/profile-user.jpg';

  return (
    <div className="chat-screen-page">
      {/* Soft Cloud-Heart decorative background overlay */}
      <div className="chat-bg-cloud-overlay" aria-hidden="true" />

      {/* 1. CHAT HEADER - Full-width pink/magenta header */}
      <header className="chat-screen-header">
        <div className="chat-header-left-group">
          <button
            id="btn-chat-back"
            className="chat-back-btn"
            onClick={() => navigate('/chats')}
            aria-label="Back to conversations"
          >
            <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          </button>

          <div
            className="chat-header-profile"
            onClick={() => navigate(`/profile/${otherUser?.uid || otherUser?.id || otherUid}`)}
            role="button"
            tabIndex={0}
            title={otherUserName}
          >
            <div className="chat-header-avatar-wrap">
              <img
                src={otherUserPhoto}
                alt={otherUserName}
                className="chat-header-avatar-img"
              />
            </div>
            <h2 className="chat-header-name">{otherUserName}</h2>
          </div>
        </div>

        <div className="chat-header-actions">
          <button className="chat-header-action-btn" aria-label="Video Call" title="Video Call">
            <Video size={22} color="#ffffff" />
          </button>
          <button className="chat-header-action-btn" aria-label="Phone Call" title="Phone Call">
            <Phone size={20} color="#ffffff" />
          </button>
          <button className="chat-header-action-btn" aria-label="More Options" title="More Options">
            <MoreVertical size={22} color="#ffffff" />
          </button>
        </div>
      </header>

      {/* 2. CHAT MESSAGES AREA */}
      <div className="chat-messages-container">
        {loading ? (
          <LoadingSpinner text="Loading messages..." />
        ) : (
          <>
            {messages.map((msg) => {
              const isOutgoing = msg.senderId === currentUser?.uid || msg.senderId === 'current_user';
              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isOutgoing={isOutgoing}
                  otherUserPhoto={otherUserPhoto}
                  currentUserPhoto={currentUserPhoto}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Quick Emoji Bar (optional drawer) */}
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

      {/* Hidden File Input for Camera and Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* 4. MESSAGE INPUT AREA - Camera/Gallery/Waveform + Pill Input with Send Arrow */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <div className="chat-input-media-group">
          <button
            type="button"
            className="chat-input-media-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Take or attach photo"
            title="Camera"
          >
            <Camera size={23} className="chat-media-icon" />
          </button>

          <button
            type="button"
            className="chat-input-media-btn"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image from gallery"
            title="Gallery"
          >
            <ImageIcon size={23} className="chat-media-icon" />
          </button>

          <button
            type="button"
            className="chat-input-media-btn"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            aria-label="Toggle voice note / emojis"
            title="Voice & Reactions"
          >
            <AudioWaveform size={23} className="chat-media-icon" />
          </button>
        </div>

        <div className="chat-input-pill-box">
          <input
            id="chat-text-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Send a message."
            className="chat-pill-input-field"
            autoComplete="off"
          />

          <button
            id="btn-send-message"
            type="submit"
            disabled={sending}
            className="chat-pill-send-btn"
            aria-label="Send message"
            title="Send"
          >
            <Send size={18} fill="#1a1a1f" color="#1a1a1f" className="chat-send-icon" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
