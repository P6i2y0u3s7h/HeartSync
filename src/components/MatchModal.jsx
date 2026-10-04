import React from 'react';
import { Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';
import { getDeterministicChatId } from '../services/chatService';

export const MatchModal = ({ isOpen, onClose, user1, user2 }) => {
  const navigate = useNavigate();

  if (!isOpen || !user2) return null;

  const photo1 = user1?.profilePhoto || user1?.image || '/assets/logo-heart.jpg';
  const photo2 = user2?.profilePhoto || user2?.image || '/assets/logo-heart.jpg';
  const name1 = user1?.displayName || user1?.name || 'You';
  const name2 = user2?.displayName || user2?.name || 'Your Match';

  const handleSendMessage = () => {
    onClose();
    const uid1 = user1?.uid || user1?.id || 'me';
    const uid2 = user2?.uid || user2?.id || 'other';
    const chatId = getDeterministicChatId(uid1, uid2);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div className="match-modal-card" onClick={e => e.stopPropagation()}>
        {/* Floating animated mini hearts */}
        <div className="match-confetti-hearts" aria-hidden="true">
          <span className="confetti-heart ch-1">💖</span>
          <span className="confetti-heart ch-2">💕</span>
          <span className="confetti-heart ch-3">✨</span>
          <span className="confetti-heart ch-4">💗</span>
          <span className="confetti-heart ch-5">❤️</span>
        </div>

        <div className="match-heading-container">
          <span className="match-script-tag">Hooray!</span>
          <h2 className="match-title-gradient">It's a Match!</h2>
          <p className="match-subtitle">
            You and <span className="match-partner-name">{name2}</span> liked each other.
          </p>
        </div>

        {/* Two profile circles intersecting with heart badge */}
        <div className="match-circles-intersection">
          <div className="match-photo-bubble match-bubble-left">
            <img src={photo1} alt={name1} className="match-bubble-img" />
          </div>
          <div className="match-center-heart-badge">
            <Heart size={28} fill="#C2185B" color="#C2185B" />
          </div>
          <div className="match-photo-bubble match-bubble-right">
            <img src={photo2} alt={name2} className="match-bubble-img" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="match-modal-buttons">
          <PrimaryButton onClick={handleSendMessage} className="btn-send-message-match">
            <MessageCircle size={18} style={{ marginRight: '8px' }} />
            Send Message
          </PrimaryButton>
          <button type="button" className="btn-keep-swiping" onClick={onClose}>
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
