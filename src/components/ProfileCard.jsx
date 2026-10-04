import React from 'react';
import { Check, MapPin } from 'lucide-react';
import LikeButton from './LikeButton';

export const ProfileCard = ({
  profile,
  onLike,
  onPass,
  onInterested,
  onCardClick,
  className = ''
}) => {
  if (!profile) return null;

  return (
    <div className={`heartsync-card-container ${className}`}>
      <div className="heartsync-card" onClick={onCardClick}>
        <div className="card-image-box">
          <img
            src={profile.profilePhoto || profile.image || '/assets/logo-heart.jpg'}
            alt={profile.displayName || profile.name}
            className="card-main-image"
            loading="lazy"
          />
          <div className="card-gradient-overlay"></div>

          {/* Top badges */}
          <div className="card-top-badges">
            {profile.isVerified && (
              <span className="badge-verified">
                <Check size={12} strokeWidth={3} /> Verified
              </span>
            )}
            {profile.distance && (
              <span className="badge-distance">
                <MapPin size={12} /> {profile.distance}
              </span>
            )}
          </div>

          {/* Profile details text */}
          <div className="card-text-details">
            <div className="card-name-row">
              <h2 className="card-profile-name">{profile.displayName || profile.name}</h2>
              <span className="card-profile-age">{profile.age}</span>
            </div>
            <p className="card-profile-location">
              {profile.city}{profile.country ? `, ${profile.country}` : ''}
            </p>
            {profile.bio && <p className="card-profile-bio">{profile.bio}</p>}
            {profile.interests && profile.interests.length > 0 && (
              <div className="card-interests-tags">
                {profile.interests.slice(0, 3).map((interest, idx) => (
                  <span key={idx} className="interest-pill">{interest}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="card-floating-actions">
        <LikeButton type="pass" onClick={onPass} />
        <LikeButton type="interested" onClick={onInterested || onLike} size="small" />
        <LikeButton type="like" onClick={onLike} />
      </div>
    </div>
  );
};

export default ProfileCard;
