import React from 'react';
import { X } from 'lucide-react';
import PostCard from './PostCard';

export const PostDetailModal = ({
  isOpen,
  onClose,
  post,
  currentUser,
  userProfile,
  onToggleLike,
  onToggleSave,
  onDeletePost,
  onEditCaption
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="hs-modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="post-detail-modal-wrapper animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <button
          type="button"
          className="post-detail-close-btn"
          onClick={onClose}
          aria-label="Close post view"
        >
          <X size={22} color="#ffffff" />
        </button>

        <div className="post-detail-card-wrap">
          <PostCard
            post={post}
            currentUser={currentUser}
            userProfile={userProfile}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            onDeletePost={async (postId, storagePath) => {
              if (onDeletePost) {
                await onDeletePost(postId, storagePath);
              }
              onClose();
            }}
            onEditCaption={onEditCaption}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;

