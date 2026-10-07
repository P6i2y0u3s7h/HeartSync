import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  Heart,
  Star,
  RotateCcw,
  Sparkles,
  MapPin,
  Check,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Calendar,
  Compass,
  RefreshCw
} from 'lucide-react';
import SwipeCard from './SwipeCard';

export const SwipeDeck = ({
  profiles = [],
  loading = false,
  onLike,
  onPass,
  onUndo,
  onRefresh,
  currentUser
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState(null); // { type, profile, index }
  const [topCardDrag, setTopCardDrag] = useState(0); // drag ratio -1 to 1
  const [selectedDetailProfile, setSelectedDetailProfile] = useState(null);

  // Top card & underneath card
  const activeProfiles = useMemo(() => {
    return profiles.slice(currentIndex, currentIndex + 3);
  }, [profiles, currentIndex]);

  const currentProfile = activeProfiles[0] || null;
  const nextProfile = activeProfiles[1] || null;

  // Centralized swipe handler
  const handleCardSwipe = useCallback(async (direction, profile) => {
    const target = profile || currentProfile;
    if (!target) return;

    // Track for Undo
    setLastAction({
      type: direction,
      profile: target,
      index: currentIndex
    });

    // Advance deck
    setCurrentIndex(prev => prev + 1);
    setTopCardDrag(0);

    // Trigger parent callbacks
    if (direction === 'right') {
      if (onLike) onLike(target, false);
    } else if (direction === 'superlike') {
      if (onLike) onLike(target, true);
    } else if (direction === 'left') {
      if (onPass) onPass(target);
    }
  }, [currentProfile, currentIndex, onLike, onPass]);

  // Button-triggered actions
  const triggerSwipeAction = (direction) => {
    if (!currentProfile) return;
    handleCardSwipe(direction, currentProfile);
  };

  // Undo button
  const handleUndoAction = async () => {
    if (!lastAction) return;

    const { type, profile } = lastAction;
    setLastAction(null);

    // Decrement card index
    setCurrentIndex(prev => Math.max(0, prev - 1));

    if (onUndo) {
      await onUndo(type, profile);
    }
  };

  const handleDragUpdate = (deltaX, deltaY, ratio) => {
    setTopCardDrag(ratio);
  };

  return (
    <div className="hs-swipe-deck-wrapper">
      {/* Cards Deck Stage */}
      <div className="hs-swipe-cards-stage">
        {loading ? (
          <div className="hs-deck-loading-card">
            <div className="hs-pulse-ring" />
            <Sparkles size={28} className="spinner-rotate" color="#e91e63" />
            <p>Finding people near you...</p>
          </div>
        ) : currentProfile ? (
          <div className="hs-cards-stack-container">
            {/* Third Card in background if available */}
            {activeProfiles[2] && (
              <SwipeCard
                key={activeProfiles[2].uid || activeProfiles[2].id || 'card-2'}
                profile={activeProfiles[2]}
                isTopCard={false}
                isNextCard={false}
              />
            )}

            {/* Second Card underneath top card */}
            {nextProfile && (
              <SwipeCard
                key={nextProfile.uid || nextProfile.id || 'card-1'}
                profile={nextProfile}
                isTopCard={false}
                isNextCard={true}
                dragProgress={topCardDrag}
              />
            )}

            {/* Top Interactive Card */}
            <SwipeCard
              key={currentProfile.uid || currentProfile.id || 'card-0'}
              profile={currentProfile}
              isTopCard={true}
              onSwipe={handleCardSwipe}
              onDragUpdate={handleDragUpdate}
              onOpenDetails={(p) => setSelectedDetailProfile(p)}
            />
          </div>
        ) : (
          /* Empty Deck State */
          <div className="hs-deck-empty-state animate-fade-in">
            <div className="empty-radar-circle">
              <Compass size={40} color="#e91e63" />
            </div>
            <h3 className="empty-title">You've seen everyone!</h3>
            <p className="empty-subtitle">
              There are no new profiles to swipe right now. Try expanding your age or distance preferences, or check back soon!
            </p>
            {onRefresh && (
              <button
                type="button"
                className="hs-deck-refresh-btn"
                onClick={() => {
                  setCurrentIndex(0);
                  setLastAction(null);
                  onRefresh();
                }}
              >
                <RefreshCw size={16} />
                <span>Refresh Discover</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Control Action Buttons (Tinder-style) */}
      <div className="hs-swipe-controls-bar">
        {/* 1. Undo Button */}
        <button
          type="button"
          id="btn-swipe-undo"
          className="hs-control-btn btn-undo"
          onClick={handleUndoAction}
          disabled={!lastAction || loading}
          title="Rewind / Undo last swipe"
          aria-label="Undo"
        >
          <RotateCcw size={20} />
        </button>

        {/* 2. Pass Button */}
        <button
          type="button"
          id="btn-swipe-pass"
          className="hs-control-btn btn-pass"
          onClick={() => triggerSwipeAction('left')}
          disabled={!currentProfile || loading}
          title="Pass / Nope"
          aria-label="Pass"
        >
          <X size={28} strokeWidth={2.8} />
        </button>

        {/* 3. Super Like Button */}
        <button
          type="button"
          id="btn-swipe-superlike"
          className="hs-control-btn btn-superlike"
          onClick={() => triggerSwipeAction('superlike')}
          disabled={!currentProfile || loading}
          title="Super Like"
          aria-label="Super Like"
        >
          <Star size={22} fill="currentColor" />
        </button>

        {/* 4. Like Button */}
        <button
          type="button"
          id="btn-swipe-like"
          className="hs-control-btn btn-like"
          onClick={() => triggerSwipeAction('right')}
          disabled={!currentProfile || loading}
          title="Like"
          aria-label="Like"
        >
          <Heart size={30} fill="currentColor" />
        </button>
      </div>

      {/* Expanded Profile Detail Sheet */}
      {selectedDetailProfile && (
        <div className="hs-modal-backdrop animate-fade-in" onClick={() => setSelectedDetailProfile(null)}>
          <div
            className="hs-profile-detail-sheet animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-sheet-header">
              <h3>{selectedDetailProfile.displayName || selectedDetailProfile.name}</h3>
              <button
                type="button"
                className="detail-sheet-close-btn"
                onClick={() => setSelectedDetailProfile(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="detail-sheet-body">
              {/* Photo gallery */}
              <div className="detail-photo-gallery">
                {(selectedDetailProfile.photos || [selectedDetailProfile.profilePhoto || '/assets/logo-heart.jpg']).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Photo ${idx + 1}`}
                    className="detail-gallery-img"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo-heart.jpg'; }}
                  />
                ))}
              </div>

              {/* Bio & Details */}
              <div className="detail-info-section">
                <div className="detail-name-row">
                  <h2>
                    {selectedDetailProfile.displayName || selectedDetailProfile.name}
                    {selectedDetailProfile.age && <span className="detail-age">, {selectedDetailProfile.age}</span>}
                  </h2>
                  {selectedDetailProfile.isVerified && (
                    <span className="badge-pill verified-badge">
                      <Check size={12} strokeWidth={3} /> Verified
                    </span>
                  )}
                </div>

                {selectedDetailProfile.city && (
                  <p className="detail-location">
                    <MapPin size={14} />
                    <span>{selectedDetailProfile.city}{selectedDetailProfile.country ? `, ${selectedDetailProfile.country}` : ''}</span>
                  </p>
                )}

                {selectedDetailProfile.bio && (
                  <div className="detail-bio-box">
                    <h4>About Me</h4>
                    <p>{selectedDetailProfile.bio}</p>
                  </div>
                )}

                {selectedDetailProfile.interests && selectedDetailProfile.interests.length > 0 && (
                  <div className="detail-interests-box">
                    <h4>Passions &amp; Interests</h4>
                    <div className="detail-interests-pills">
                      {selectedDetailProfile.interests.map((i, idx) => (
                        <span key={idx} className="card-interest-pill">{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Footer in detail modal */}
            <div className="detail-sheet-footer">
              <button
                type="button"
                className="detail-action-btn pass-btn"
                onClick={() => {
                  setSelectedDetailProfile(null);
                  handleCardSwipe('left', selectedDetailProfile);
                }}
              >
                <X size={24} />
                <span>Pass</span>
              </button>
              <button
                type="button"
                className="detail-action-btn like-btn"
                onClick={() => {
                  setSelectedDetailProfile(null);
                  handleCardSwipe('right', selectedDetailProfile);
                }}
              >
                <Heart size={24} fill="currentColor" />
                <span>Like</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeDeck;
