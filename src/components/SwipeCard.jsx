import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Check,
  ShieldCheck,
  MapPin,
  Info,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
  Star,
  Sparkles,
  Briefcase,
  GraduationCap
} from 'lucide-react';

export const SwipeCard = ({
  profile,
  isTopCard = false,
  isNextCard = false,
  onSwipe, // (direction: 'left' | 'right' | 'superlike') => void
  dragProgress = 0, // from parent or self
  onDragUpdate, // (deltaX, deltaY, ratio) => void
  onOpenDetails,
  className = ''
}) => {
  if (!profile) return null;

  // Photos array resolution
  const photoList = useMemo(() => {
    const list = [];
    if (profile.profilePhoto && typeof profile.profilePhoto === 'string') {
      list.push(profile.profilePhoto);
    }
    if (Array.isArray(profile.photos)) {
      profile.photos.forEach(p => {
        if (p && typeof p === 'string' && !list.includes(p)) {
          list.push(p);
        }
      });
    }
    if (profile.image && typeof profile.image === 'string' && !list.includes(profile.image)) {
      list.push(profile.image);
    }
    return list.length > 0 ? list : ['/assets/logo-heart.jpg'];
  }, [profile]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Dragging state
  const [dragState, setDragState] = useState({
    isDragging: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0
  });

  const [flyOutDirection, setFlyOutDirection] = useState(null);

  const cardRef = useRef(null);

  const SWIPE_THRESHOLD = 90; // pixels to trigger like/pass
  const SUPER_LIKE_THRESHOLD = 110;

  // Cleanup flyout on profile change
  useEffect(() => {
    setActivePhotoIdx(0);
    setFlyOutDirection(null);
    setDragState({ isDragging: false, x: 0, y: 0, startX: 0, startY: 0 });
  }, [profile.uid, profile.id]);

  // Pointer event handlers for cross-platform touch & mouse dragging
  const handlePointerDown = (e) => {
    if (!isTopCard || flyOutDirection) return;

    // Do not initiate drag if clicking an action button directly
    if (e.target.closest('button')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture not supported
    }

    setDragState({
      isDragging: true,
      x: 0,
      y: 0,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging || !isTopCard || flyOutDirection) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setDragState(prev => ({
      ...prev,
      x: deltaX,
      y: deltaY
    }));

    if (onDragUpdate) {
      const ratio = Math.min(1, Math.max(-1, deltaX / SWIPE_THRESHOLD));
      onDragUpdate(deltaX, deltaY, ratio);
    }
  };

  const handlePointerUp = (e) => {
    if (!dragState.isDragging || !isTopCard) return;

    const totalDistance = Math.hypot(dragState.x, dragState.y);

    // If pointer barely moved, treat as a tap for photo navigation or detail view
    if (totalDistance < 8) {
      setDragState({ isDragging: false, x: 0, y: 0, startX: 0, startY: 0 });
      if (onDragUpdate) onDragUpdate(0, 0, 0);

      const cardRect = cardRef.current?.getBoundingClientRect();
      if (cardRect) {
        const clickX = e.clientX - cardRect.left;
        const width = cardRect.width;

        // Tap on left 35% -> previous photo
        if (clickX < width * 0.35 && photoList.length > 1) {
          setActivePhotoIdx(prev => (prev > 0 ? prev - 1 : photoList.length - 1));
          return;
        }
        // Tap on right 35% -> next photo
        if (clickX > width * 0.65 && photoList.length > 1) {
          setActivePhotoIdx(prev => (prev < photoList.length - 1 ? prev + 1 : 0));
          return;
        }
        // Center tap -> open details
        if (onOpenDetails) {
          onOpenDetails(profile);
        }
      }
      return;
    }

    // Check if swipe threshold was reached
    if (dragState.x > SWIPE_THRESHOLD) {
      // Swipe Right -> Like
      triggerFlyOut('right');
    } else if (dragState.x < -SWIPE_THRESHOLD) {
      // Swipe Left -> Pass
      triggerFlyOut('left');
    } else if (dragState.y < -SUPER_LIKE_THRESHOLD && Math.abs(dragState.x) < 50) {
      // Swipe Up -> Super Like
      triggerFlyOut('superlike');
    } else {
      // Snap back smoothly
      setDragState({ isDragging: false, x: 0, y: 0, startX: 0, startY: 0 });
      if (onDragUpdate) onDragUpdate(0, 0, 0);
    }
  };

  const triggerFlyOut = (direction) => {
    setFlyOutDirection(direction);
    setDragState(prev => ({ ...prev, isDragging: false }));

    if (onDragUpdate) onDragUpdate(0, 0, 0);

    setTimeout(() => {
      if (onSwipe) onSwipe(direction, profile);
    }, 280);
  };

  // Compute card style transform and rotation
  const cardStyle = useMemo(() => {
    if (flyOutDirection === 'right') {
      return {
        transform: 'translate3d(120vw, 30px, 0) rotate(25deg)',
        transition: 'transform 0.28s ease-in, opacity 0.28s ease-in',
        opacity: 0
      };
    }
    if (flyOutDirection === 'left') {
      return {
        transform: 'translate3d(-120vw, 30px, 0) rotate(-25deg)',
        transition: 'transform 0.28s ease-in, opacity 0.28s ease-in',
        opacity: 0
      };
    }
    if (flyOutDirection === 'superlike') {
      return {
        transform: 'translate3d(0, -120vh, 0) scale(1.05)',
        transition: 'transform 0.28s ease-in, opacity 0.28s ease-in',
        opacity: 0
      };
    }

    if (isTopCard) {
      if (dragState.isDragging) {
        const rotation = (dragState.x / SWIPE_THRESHOLD) * 10;
        return {
          transform: `translate3d(${dragState.x}px, ${dragState.y}px, 0) rotate(${rotation}deg)`,
          cursor: 'grabbing',
          touchAction: 'none'
        };
      }
      return {
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      };
    }

    if (isNextCard) {
      // Scale up dynamically as top card is dragged
      const absDrag = Math.min(1, Math.abs(dragProgress));
      const scale = 0.95 + absDrag * 0.05;
      const translateY = 12 - absDrag * 12;
      return {
        transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        opacity: 0.92 + absDrag * 0.08,
        transition: dragState.isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
        pointerEvents: 'none'
      };
    }

    // Cards further back
    return {
      transform: 'translate3d(0, 20px, 0) scale(0.90)',
      opacity: 0.75,
      pointerEvents: 'none'
    };
  }, [flyOutDirection, isTopCard, isNextCard, dragState, dragProgress]);

  // Stamp Opacities
  const likeOpacity = isTopCard
    ? Math.max(0, Math.min(1, (dragState.x - 20) / (SWIPE_THRESHOLD - 20)))
    : 0;

  const passOpacity = isTopCard
    ? Math.max(0, Math.min(1, (-dragState.x - 20) / (SWIPE_THRESHOLD - 20)))
    : 0;

  const superLikeOpacity = isTopCard
    ? Math.max(0, Math.min(1, (-dragState.y - 30) / (SUPER_LIKE_THRESHOLD - 30)))
    : 0;

  // Metadata
  const name = profile.displayName || profile.firstName || profile.name || 'HeartSync Member';
  const age = profile.age || (profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : null);
  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const isVerified = Boolean(profile.isVerified || profile.verificationStatus === 'verified');
  const isIdVerified = profile.identityVerificationStatus === 'verified';
  const interests = Array.isArray(profile.interests) ? profile.interests : [];

  return (
    <div
      ref={cardRef}
      className={`hs-swipe-card ${isTopCard ? 'is-top' : ''} ${className}`}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="region"
      aria-label={`Profile card for ${name}`}
    >
      <div className="hs-swipe-card-inner">
        {/* Main Photo */}
        <img
          src={photoList[activePhotoIdx] || '/assets/logo-heart.jpg'}
          alt={name}
          className="hs-swipe-card-image"
          draggable="false"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/logo-heart.jpg';
          }}
        />

        {/* Gradient Overlay */}
        <div className="hs-swipe-card-gradient" />

        {/* Top Story/Photo Segments if multiple photos */}
        {photoList.length > 1 && (
          <div className="hs-swipe-card-photo-segments">
            {photoList.map((_, idx) => (
              <div
                key={idx}
                className={`photo-segment-bar ${idx === activePhotoIdx ? 'active' : ''} ${idx < activePhotoIdx ? 'viewed' : ''}`}
              />
            ))}
          </div>
        )}

        {/* Top Badges */}
        <div className="hs-swipe-card-top-badges">
          <div className="badges-left-group">
            {isVerified && (
              <span className="badge-pill verified-badge" title="Photo Verified">
                <Check size={12} strokeWidth={3} />
                <span>Verified</span>
              </span>
            )}
            {isIdVerified && (
              <span className="badge-pill id-verified-badge" title="Government ID Verified">
                <ShieldCheck size={12} strokeWidth={2.5} />
                <span>ID Verified</span>
              </span>
            )}
          </div>

          {profile.distance && (
            <span className="badge-pill distance-badge">
              <MapPin size={11} />
              <span>{profile.distance}</span>
            </span>
          )}
        </div>

        {/* SWIPE STAMP OVERLAYS */}
        {/* 1. LIKE STAMP */}
        <div
          className="hs-swipe-stamp like-stamp"
          style={{ opacity: likeOpacity, transform: `rotate(-16deg) scale(${0.8 + likeOpacity * 0.2})` }}
        >
          <Heart size={20} className="stamp-icon" fill="currentColor" />
          <span>LIKE</span>
        </div>

        {/* 2. PASS STAMP */}
        <div
          className="hs-swipe-stamp pass-stamp"
          style={{ opacity: passOpacity, transform: `rotate(16deg) scale(${0.8 + passOpacity * 0.2})` }}
        >
          <X size={20} className="stamp-icon" strokeWidth={3} />
          <span>NOPE</span>
        </div>

        {/* 3. SUPER LIKE STAMP */}
        <div
          className="hs-swipe-stamp superlike-stamp"
          style={{ opacity: superLikeOpacity, transform: `scale(${0.85 + superLikeOpacity * 0.15})` }}
        >
          <Star size={20} className="stamp-icon" fill="currentColor" />
          <span>SUPER LIKE</span>
        </div>

        {/* Bottom Profile Details */}
        <div className="hs-swipe-card-details">
          <div className="details-header-row">
            <div className="name-and-age">
              <h2 className="card-user-name">{name}</h2>
              {age && <span className="card-user-age">{age}</span>}
              {isVerified && (
                <span className="verified-icon-circle" title="Verified">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>

            {onOpenDetails && (
              <button
                type="button"
                className="card-info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(profile);
                }}
                aria-label={`View details for ${name}`}
              >
                <Info size={18} />
              </button>
            )}
          </div>

          {location && (
            <p className="card-user-location">
              <MapPin size={13} />
              <span>{location}</span>
            </p>
          )}

          {profile.bio && (
            <p className="card-user-bio">
              {profile.bio}
            </p>
          )}

          {/* Interests Cloud */}
          {interests.length > 0 && (
            <div className="card-interests-tags">
              {interests.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="card-interest-pill">
                  {tag}
                </span>
              ))}
              {interests.length > 3 && (
                <span className="card-interest-more-pill">
                  +{interests.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
