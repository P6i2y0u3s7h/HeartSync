import React from 'react';
import { Plus } from 'lucide-react';

export const StoryAvatar = ({
  isAddStory = false,
  hasStory = false,
  userProfile = null,
  storyUser = null,
  onAddStory,
  onViewStory
}) => {
  if (isAddStory) {
    const avatarPhoto = userProfile?.profilePhoto || '/assets/logo-heart.jpg';

    if (hasStory) {
      // User has active story: show profile photo with pink gradient ring + small '+' badge
      return (
        <div
          className="story-item"
          id="my-story-avatar-item"
          onClick={onViewStory}
          title="View My Story"
        >
          <div className="story-avatar-wrapper has-story-ring">
            <img
              src={avatarPhoto}
              alt="My Story"
              className="story-avatar-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/logo-heart.jpg';
              }}
            />
            {/* Small '+' badge to add another story */}
            <button
              type="button"
              className="story-avatar-add-badge"
              title="Add another story"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddStory) onAddStory();
              }}
            >
              <Plus size={13} strokeWidth={3} color="#fff" />
            </button>
          </div>
          <span className="story-name">My Story</span>
        </div>
      );
    }

    // User has NO active story: show dashed pink ring with '+' icon
    return (
      <div
        className="story-item"
        id="add-story-avatar-item"
        onClick={onAddStory}
        title="Add to My Story"
      >
        <div className="story-avatar-wrapper add-story-wrapper">
          {avatarPhoto && avatarPhoto !== '/assets/logo-heart.jpg' ? (
            <div className="add-story-photo-container">
              <img
                src={avatarPhoto}
                alt="My Story"
                className="story-avatar-img add-story-faded-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/logo-heart.jpg';
                }}
              />
              <div className="add-story-overlay-plus">
                <Plus size={18} strokeWidth={3} color="#fff" />
              </div>
            </div>
          ) : (
            <div className="add-story-inner">
              <Plus size={22} strokeWidth={2.5} color="#C2185B" />
            </div>
          )}
        </div>
        <span className="story-name">My Story</span>
      </div>
    );
  }

  // Other user with active story
  const displayName =
    storyUser?.userDisplayName ||
    storyUser?.displayName?.split(' ')[0] ||
    'Member';
  const photo = storyUser?.userProfilePhoto || storyUser?.profilePhoto || '/assets/logo-heart.jpg';

  return (
    <div
      className="story-item"
      id={`story-item-${storyUser?.userId || storyUser?.id}`}
      onClick={() => onViewStory && onViewStory(storyUser)}
      title={`View ${displayName}'s story`}
    >
      <div className="story-avatar-wrapper has-story-ring">
        <img
          src={photo}
          alt={displayName}
          className="story-avatar-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/logo-heart.jpg';
          }}
        />
      </div>
      <span className="story-name">{displayName}</span>
    </div>
  );
};

export default StoryAvatar;
