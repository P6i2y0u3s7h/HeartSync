import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Sparkles, X, Compass } from 'lucide-react';
import { getDeterministicChatId } from '../services/chatService';

export const MatchModal = ({
  isOpen,
  onClose,
  user1, // current user profile or { uid, displayName, profilePhoto }
  user2  // matched user profile or { uid, displayName, profilePhoto }
}) => {
  const navigate = useNavigate();

  if (!isOpen || !user2) return null;

  const uid1 = user1?.uid || user1?.id || 'me';
  const uid2 = user2?.uid || user2?.id;

  const photo1 = user1?.profilePhoto || user1?.photos?.[0] || '/assets/logo-heart.jpg';
  const photo2 = user2?.profilePhoto || user2?.photos?.[0] || user2?.image || '/assets/logo-heart.jpg';

  const name1 = user1?.displayName || user1?.firstName || 'You';
  const name2 = user2?.displayName || user2?.firstName || user2?.name || 'HeartSync Member';

  const handleSendMessage = () => {
    if (onClose) onClose();
    if (uid1 && uid2) {
      const chatId = getDeterministicChatId(uid1, uid2);
      navigate(`/chat/${chatId}`, {
        state: {
          recipientId: uid2,
          recipientName: name2,
          recipientPhoto: photo2
        }
      });
    } else {
      navigate('/chats');
    }
  };

  const handleKeepDiscovering = () => {
    if (onClose) onClose();
  };

  return (
    <div className="hs-modal-backdrop match-celebration-backdrop animate-fade-in" onClick={handleKeepDiscovering}>
      <div
        className="hs-match-modal-card animate-pop-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="match-modal-title"
      >
        {/* Floating Sparks / Hearts */}
        <div className="match-sparkles-floating">
          <Sparkles size={24} className="sparkle-1" color="#f472b6" />
          <Heart size={20} className="sparkle-2" fill="#ec4899" color="#ec4899" />
          <Sparkles size={22} className="sparkle-3" color="#fb7185" />
        </div>

        {/* Close Icon */}
        <button
          type="button"
          className="match-modal-close-icon"
          onClick={handleKeepDiscovering}
          aria-label="Close match modal"
        >
          <X size={20} />
        </button>

        {/* Overlapping Profile Circles */}
        <div className="match-avatars-row">
          <div className="match-avatar-circle left">
            <img
              src={photo1}
              alt={name1}
              className="match-avatar-img"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo-heart.jpg'; }}
            />
          </div>

          <div className="match-heart-center-badge">
            <Heart size={26} fill="#ffffff" color="#ffffff" />
          </div>

          <div className="match-avatar-circle right">
            <img
              src={photo2}
              alt={name2}
              className="match-avatar-img"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo-heart.jpg'; }}
            />
          </div>
        </div>

        {/* Title & Message */}
        <div className="match-modal-text-group">
          <h2 id="match-modal-title" className="match-modal-title">
            It's a Match!
          </h2>
          <p className="match-modal-subtitle">
            You and <span className="matched-person-name">{name2}</span> liked each other ❤️
          </p>
        </div>

        {/* Action Buttons */}
        <div className="match-modal-actions">
          <button
            type="button"
            id="btn-match-send-message"
            className="match-action-btn btn-send-message"
            onClick={handleSendMessage}
          >
            <MessageCircle size={19} />
            <span>Send Message</span>
          </button>

          <button
            type="button"
            id="btn-match-keep-discovering"
            className="match-action-btn btn-keep-discovering"
            onClick={handleKeepDiscovering}
          >
            <Compass size={18} />
            <span>Keep Discovering</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
