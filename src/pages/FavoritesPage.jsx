import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle, Trash2, Heart } from 'lucide-react';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import HeartBackground from '../components/HeartBackground';
import { useAuth } from '../context/AuthContext';
import { subscribeToFavorites, toggleFavorite } from '../services/favoriteService';
import { getDeterministicChatId } from '../services/chatService';

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToFavorites(currentUser.uid, (list) => {
      setFavorites(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleRemove = async (e, profile) => {
    e.stopPropagation();
    if (!currentUser?.uid || !profile) return;
    try {
      await toggleFavorite(currentUser.uid, profile);
    } catch (err) {
      console.warn('Remove favorite error:', err);
    }
  };

  const handleStartChat = (e, profile) => {
    e.stopPropagation();
    const uidA = currentUser?.uid || 'me';
    const uidB = profile?.uid || profile?.id;
    const chatId = getDeterministicChatId(uidA, uidB);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className="app-page-wrapper">
      <HeartBackground />
      <Header showFilter={false} title="Saved Profiles" />

      <main className="main-content-scrollable favorites-page-layout">
        <div className="favorites-header-intro">
          <h2 className="section-title-pink">Saved Profiles ({favorites.length})</h2>
          <p className="section-sub-pink">Profiles you bookmarked to view or connect with later.</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading saved profiles..." />
        ) : favorites.length > 0 ? (
          <div className="favorites-cards-grid">
            {favorites.map((item) => {
              const profile = item.profile || {};
              const photo = profile.profilePhoto || profile.image || '/assets/logo-heart.jpg';
              const name = profile.displayName || profile.name || 'Member';
              const age = profile.age || '';
              const city = profile.city || '';

              return (
                <div
                  key={item.id || item.targetUid}
                  className="favorite-person-card"
                  onClick={() => navigate(`/profile/${item.targetUid}`)}
                >
                  <div className="favorite-card-img-wrap">
                    <img src={photo} alt={name} className="favorite-card-photo" />
                    <button
                      type="button"
                      className="btn-remove-favorite"
                      onClick={(e) => handleRemove(e, profile)}
                      title="Remove from Saved"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="favorite-card-details">
                    <h4 className="favorite-user-name">
                      {name}{age ? `, ${age}` : ''}
                    </h4>
                    {city && <span className="favorite-location-text">{city}</span>}
                  </div>

                  <div className="favorite-card-actions">
                    <button
                      type="button"
                      className="btn-favorite-chat"
                      onClick={(e) => handleStartChat(e, profile)}
                    >
                      <MessageCircle size={15} /> Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            type="favorites"
            title="No saved profiles yet"
            message="When you browse profiles, tap '❤️ Save Profile' to bookmark someone for later!"
            actionText="Discover People"
            onAction={() => navigate('/discover')}
          />
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default FavoritesPage;
