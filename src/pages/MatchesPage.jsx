import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart, HeartOff } from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import ConfirmModal from '../components/ConfirmModal';
import { useMatches } from '../hooks/useMatches';
import { getDeterministicChatId } from '../services/chatService';
import { useAuth } from '../context/AuthContext';

export const MatchesPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { matches, loading, unmatch } = useMatches();

  const [unmatchingUser, setUnmatchingUser] = useState(null);
  const [unmatchLoading, setUnmatchLoading] = useState(false);

  const handleStartChat = (matchedUser) => {
    const uidA = currentUser?.uid || 'me';
    const uidB = matchedUser?.uid || matchedUser?.id || 'other';
    const chatId = getDeterministicChatId(uidA, uidB);
    navigate(`/chat/${chatId}`);
  };

  const handleConfirmUnmatch = async () => {
    if (!unmatchingUser) return;
    setUnmatchLoading(true);
    try {
      const targetId = unmatchingUser.uid || unmatchingUser.id;
      await unmatch(targetId);
      setUnmatchingUser(null);
    } catch (e) {
      console.warn('Unmatch failed:', e);
    } finally {
      setUnmatchLoading(false);
    }
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="Matches" />

      <main className="main-content-scrollable matches-page-layout">
        <div className="matches-header-intro">
          <h2 className="section-title-pink">Your Matches ({matches.length})</h2>
          <p className="section-sub-pink">People with whom you share mutual vibes and chemistry.</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading matches..." />
        ) : matches.length > 0 ? (
          <div className="matches-cards-grid">
            {matches.map((item) => {
              const user = item.matchedUser || {};
              const photo = user.profilePhoto || user.image || '/assets/logo-heart.jpg';
              const name = user.displayName || user.name || 'Member';

              return (
                <div key={item.id} className="match-person-card">
                  <div
                    className="match-card-img-wrap"
                    onClick={() => navigate(`/profile/${user.uid || user.id}`)}
                  >
                    <img src={photo} alt={name} className="match-card-photo" />
                    <div className="match-card-badge-heart">
                      <Heart size={14} fill="#ED417A" color="#ED417A" />
                    </div>
                  </div>

                  <div className="match-card-details">
                    <h4 className="match-user-name">{name}</h4>
                    <span className="match-since-text">Matched {item.matchedAt}</span>
                  </div>

                  <div className="match-card-actions-row">
                    <button
                      className="btn-match-chat"
                      onClick={() => handleStartChat(user)}
                    >
                      <MessageCircle size={16} /> Chat
                    </button>
                    <button
                      className="btn-match-unmatch"
                      onClick={() => setUnmatchingUser(user)}
                      title="Unmatch"
                      aria-label={`Unmatch with ${name}`}
                    >
                      <HeartOff size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            type="matches"
            title="No matches yet ❤️"
            message="When you both like each other, matches will appear here!"
            actionText="Start Swiping"
            onAction={() => navigate('/home')}
          />
        )}
      </main>

      <BottomNavigation />

      {/* Unmatch Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(unmatchingUser)}
        title={`Unmatch with ${unmatchingUser?.displayName || unmatchingUser?.name || 'this member'}?`}
        message="This person will be removed from your matches and you will no longer be able to message each other."
        confirmText="Unmatch"
        cancelText="Cancel"
        isDestructive={true}
        loading={unmatchLoading}
        onConfirm={handleConfirmUnmatch}
        onCancel={() => setUnmatchingUser(null)}
      />
    </div>
  );
};

export default MatchesPage;
