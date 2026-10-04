import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StoryAvatar = ({ isAddStory = false, profile, onAddStory, onClick }) => {
  const navigate = useNavigate();

  if (isAddStory) {
    return (
      <div className="story-item" onClick={onAddStory}>
        <div className="story-avatar-wrapper add-story-wrapper">
          <div className="add-story-inner">
            <Plus size={24} color="#C2185B" />
          </div>
        </div>
        <span className="story-name">My Story</span>
      </div>
    );
  }

  const handleClick = () => {
    if (onClick) onClick(profile);
    else if (profile?.uid || profile?.id) {
      navigate(`/profile/${profile.uid || profile.id}`);
    }
  };

  const displayName = profile?.firstName || profile?.displayName?.split(' ')[0] || 'Member';

  return (
    <div className="story-item" onClick={handleClick}>
      <div className={`story-avatar-wrapper ${profile?.isOnline ? 'has-story-ring' : 'has-story-ring-offline'}`}>
        <img
          src={profile?.profilePhoto || '/assets/logo-heart.jpg'}
          alt={profile?.displayName || 'Profile'}
          className="story-avatar-img"
        />
        {profile?.isOnline && <span className="online-dot-story"></span>}
      </div>
      <span className="story-name">{displayName}</span>
    </div>
  );
};

export default StoryAvatar;
