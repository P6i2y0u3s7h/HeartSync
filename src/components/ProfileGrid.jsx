import React from 'react';
import { Heart, X, Check, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileGrid = ({
  profiles = [],
  onLike,
  onPass,
  showActions = true,
  actionLabel
}) => {
  const navigate = useNavigate();

  if (profiles.length === 0) return null;

  return (
    <div className="profile-grid-hs">
      {profiles.map((profile) => {
        const id = profile.uid || profile.id;
        const name = profile.displayName || profile.name;
        const photo = profile.profilePhoto || profile.image || '/assets/logo-heart.jpg';

        return (
          <div key={id} className="grid-profile-card">
            <div
              className="grid-card-media"
              onClick={() => navigate(`/profile/${id}`)}
            >
              <img src={photo} alt={name} className="grid-card-img" loading="lazy" />
              <div className="grid-card-overlay"></div>
              {profile.isVerified && (
                <span className="grid-verified-badge" title="Verified">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
              <div className="grid-card-info">
                <h4 className="grid-card-name">
                  {name}, <span>{profile.age}</span>
                </h4>
                <p className="grid-card-city">
                  <MapPin size={10} /> {profile.city}
                </p>
              </div>
            </div>

            {showActions && (
              <div className="grid-card-actions">
                {onPass && (
                  <button
                    className="grid-action-btn grid-pass-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPass(profile);
                    }}
                    title="Pass"
                  >
                    <X size={16} />
                  </button>
                )}
                {onLike && (
                  <button
                    className="grid-action-btn grid-like-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike(profile);
                    }}
                    title="Like"
                  >
                    <Heart size={16} fill="currentColor" />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProfileGrid;
