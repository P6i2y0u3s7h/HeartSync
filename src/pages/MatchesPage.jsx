import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Heart } from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useMatches } from '../hooks/useMatches';
import { getDeterministicChatId } from '../services/chatService';
import { useAuth } from '../context/AuthContext';

export const MatchesPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { matches, loading } = useMatches();

  const handleStartChat = (matchedUser) => {
    const uidA = currentUser?.uid || 'me';
    const uidB = matchedUser?.uid || matchedUser?.id || 'other';
    const chatId = getDeterministicChatId(uidA, uidB);
    navigate(`/chat/${chatId}`);
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

                  <button
                    className="btn-match-chat"
                    onClick={() => handleStartChat(user)}
                  >
                    <MessageCircle size={16} /> Chat
                  </button>
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
    </div>
  );
};

export default MatchesPage;
