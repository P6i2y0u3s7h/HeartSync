import React from 'react';
import { Check } from 'lucide-react';

export const ProfileAvatar = ({
  src,
  alt = 'Profile',
  size = 56,
  isVerified = false,
  isOnline = false,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`profile-avatar-component ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <img
        src={src || '/assets/logo-heart.jpg'}
        alt={alt}
        className="avatar-round-img"
        style={{ width: size, height: size }}
      />
      {isOnline && <span className="avatar-online-status-dot"></span>}
      {isVerified && (
        <span className="avatar-verified-mini-badge" title="Verified Profile">
          <Check size={10} color="#fff" strokeWidth={3} />
        </span>
      )}
    </div>
  );
};

export default ProfileAvatar;
